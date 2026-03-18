import { X, Check, Minus } from "lucide-react";
import { Stock } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface DetailPanelProps {
  stock: Stock | null;
  onClose: () => void;
  onOpenPosition?: (pos: {
    ticker: string;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    shares: number;
    stopLoss?: number;
    target?: number;
  }) => void;
}

export function DetailPanel({ stock, onClose, onOpenPosition }: DetailPanelProps) {
  const { user } = useAuth();
  const [shares, setShares] = useState("1");

  if (!stock) return null;

  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;

  const checklist: { label: string; key: keyof typeof stock.signals; description: string }[] = [
    { label: "SMA 200", key: "sma200", description: isShort ? "Price < SMA_200" : "Price > SMA_200" },
    { label: "SMA 50", key: "sma50", description: isShort ? "Price < SMA_50" : "Price > SMA_50" },
    { label: "RSI", key: "rsiMomentum", description: `RSI ${isShort ? "bearish" : "bullish"}: ${stock.rsi}` },
    { label: "Volume", key: "volume", description: `${isShort ? "Distribution" : "Accumulation"} vol: ${stock.volumeRatio}x` },
    { label: "MACD", key: "macd", description: `MACD ${isShort ? "bearish" : "bullish"}` },
    { label: "Price Action", key: "priceAction", description: "Key level interaction" },
    { label: "Trend Strength", key: "trendStrength", description: "ADX / trend confirmation" },
    { label: "Earnings", key: "earningsSetup", description: stock.earningsDate ? `Earnings ${stock.earningsDate}` : "No earnings risk" },
  ];

  const handleOpen = () => {
    onOpenPosition?.({
      ticker: stock.ticker,
      direction: stock.tradeType,
      entryPrice: stock.bestEntry,
      shares: parseFloat(shares) || 1,
      stopLoss: stock.stopLoss,
      target: stock.target,
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">{stock.ticker}</h2>
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", isShort ? "bg-short/15 text-short" : "bg-long/15 text-long")}>
            {stock.tradeType}
          </span>
          <span className="text-sm font-mono text-muted-foreground">{score}/8</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">SIGNAL CHECKLIST</h3>
          <div className="space-y-2">
            {checklist.map((item) => {
              const pass = stock.signals[item.key];
              return (
                <div key={item.key} className="flex items-center gap-2.5">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", pass ? "bg-long/20 text-long" : "bg-border text-muted-foreground")}>
                    {pass ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">{item.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">SWING SETUP</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Entry (ATR)", value: `$${stock.entryAtr.toFixed(2)}` },
              { label: "Entry (Structure)", value: `$${stock.entryStructure.toFixed(2)}` },
              { label: "Best Entry", value: `$${stock.bestEntry.toFixed(2)}`, highlight: true },
              { label: "Stop Loss", value: `$${stock.stopLoss.toFixed(2)}` },
              { label: "Target", value: `$${stock.target.toFixed(2)}` },
              { label: "R:R", value: `${stock.riskReward.toFixed(2)}` },
              { label: "ATR", value: `$${stock.atr.toFixed(2)}` },
              { label: "52W Distance", value: `${stock.distance52w > 0 ? "+" : ""}${stock.distance52w.toFixed(1)}%` },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-md border border-border p-2.5", item.highlight && "border-primary/30 bg-primary/5")}>
                <div className="text-[10px] text-muted-foreground mb-0.5">{item.label}</div>
                <div className="text-sm font-mono font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {stock.news.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">RECENT NEWS</h3>
            <div className="space-y-2">
              {stock.news.map((n, i) => (
                <div key={i} className="text-xs">
                  <span className="text-foreground">{n.title}</span>
                  <span className="text-muted-foreground ml-2">— {n.date}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open Position */}
        {user ? (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="w-20 h-10 px-2 rounded-md border border-border bg-background text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={handleOpen}
                className={cn(
                  "flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors",
                  isShort ? "bg-short text-short-foreground hover:bg-short/90" : "bg-long text-long-foreground hover:bg-long/90"
                )}
              >
                Open {stock.tradeType} — ${stock.bestEntry.toFixed(2)}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            Sign in to open positions
          </p>
        )}
      </div>
    </div>
  );
}
