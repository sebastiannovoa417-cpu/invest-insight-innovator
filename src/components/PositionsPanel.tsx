import { Position, Stock } from "@/lib/types";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PositionsPanelProps {
  positions: Position[];
  stocks: Stock[];
  onClose: () => void;
  onClosePosition: (args: { id: string; exitPrice: number }) => void;
}

export function PositionsPanel({ positions, stocks, onClose, onClosePosition }: PositionsPanelProps) {
  const [closingId, setClosingId] = useState<string | null>(null);
  const [exitPrice, setExitPrice] = useState("");

  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");

  const getCurrentPrice = (ticker: string) => stocks.find((s) => s.ticker === ticker)?.price ?? 0;

  const getPnl = (pos: Position) => {
    const current = pos.status === "closed" ? (pos.exitPrice ?? 0) : getCurrentPrice(pos.ticker);
    const diff = pos.direction === "LONG" ? current - pos.entryPrice : pos.entryPrice - current;
    return { dollars: diff * pos.shares, percent: (diff / pos.entryPrice) * 100 };
  };

  // Stats
  const closedPnls = closedPositions.map(getPnl);
  const totalPnl = closedPnls.reduce((s, p) => s + p.dollars, 0);
  const wins = closedPnls.filter((p) => p.dollars > 0).length;
  const winRate = closedPnls.length > 0 ? ((wins / closedPnls.length) * 100).toFixed(0) : "—";

  const handleClose = (id: string) => {
    if (closingId === id && exitPrice) {
      onClosePosition({ id, exitPrice: parseFloat(exitPrice) });
      setClosingId(null);
      setExitPrice("");
    } else {
      setClosingId(id);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Positions</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border p-2.5 text-center">
            <div className="text-[10px] text-muted-foreground">OPEN</div>
            <div className="text-lg font-bold font-mono text-foreground">{openPositions.length}</div>
          </div>
          <div className="rounded-md border border-border p-2.5 text-center">
            <div className="text-[10px] text-muted-foreground">WIN RATE</div>
            <div className="text-lg font-bold font-mono text-foreground">{winRate}%</div>
          </div>
          <div className="rounded-md border border-border p-2.5 text-center">
            <div className="text-[10px] text-muted-foreground">TOTAL P&L</div>
            <div className={cn("text-lg font-bold font-mono", totalPnl >= 0 ? "text-long" : "text-short")}>
              ${totalPnl.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Open Positions */}
        {openPositions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">OPEN POSITIONS</h3>
            <div className="space-y-2">
              {openPositions.map((pos) => {
                const pnl = getPnl(pos);
                const currentPrice = getCurrentPrice(pos.ticker);
                return (
                  <div key={pos.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{pos.ticker}</span>
                        <span className={cn("text-[10px] font-bold", pos.direction === "LONG" ? "text-long" : "text-short")}>
                          {pos.direction}
                        </span>
                      </div>
                      <span className={cn("text-sm font-mono font-bold", pnl.dollars >= 0 ? "text-long" : "text-short")}>
                        {pnl.dollars >= 0 ? "+" : ""}${pnl.dollars.toFixed(2)} ({pnl.percent >= 0 ? "+" : ""}{pnl.percent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground mb-2">
                      <div><span className="block">Entry</span><span className="text-foreground font-mono">${pos.entryPrice.toFixed(2)}</span></div>
                      <div><span className="block">Current</span><span className="text-foreground font-mono">${currentPrice.toFixed(2)}</span></div>
                      <div><span className="block">Shares</span><span className="text-foreground font-mono">{pos.shares}</span></div>
                      <div><span className="block">Stop</span><span className="text-foreground font-mono">{pos.stopLoss ? `$${pos.stopLoss.toFixed(2)}` : "—"}</span></div>
                    </div>
                    {closingId === pos.id ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Exit price"
                          value={exitPrice}
                          onChange={(e) => setExitPrice(e.target.value)}
                          className="flex-1 h-8 px-2 rounded border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          autoFocus
                        />
                        <button
                          onClick={() => handleClose(pos.id)}
                          disabled={!exitPrice}
                          className="px-3 h-8 rounded bg-short text-short-foreground text-xs font-semibold disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => { setClosingId(null); setExitPrice(""); }}
                          className="px-2 h-8 rounded border border-border text-xs text-muted-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClose(pos.id)}
                        className="w-full h-7 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:border-short transition-colors"
                      >
                        Close Position
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Closed Positions */}
        {closedPositions.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">CLOSED ({closedPositions.length})</h3>
            <div className="space-y-1.5">
              {closedPositions.map((pos) => {
                const pnl = getPnl(pos);
                return (
                  <div key={pos.id} className="flex items-center justify-between py-1.5 border-b border-border/50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{pos.ticker}</span>
                      <span className={cn("text-[10px]", pos.direction === "LONG" ? "text-long" : "text-short")}>{pos.direction}</span>
                    </div>
                    <span className={cn("font-mono", pnl.dollars >= 0 ? "text-long" : "text-short")}>
                      {pnl.dollars >= 0 ? "+" : ""}${pnl.dollars.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {positions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No positions yet. Open one from a stock's detail panel.
          </p>
        )}
      </div>
    </div>
  );
}
