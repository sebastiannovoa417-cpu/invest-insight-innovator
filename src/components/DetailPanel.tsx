import { X, Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Stock } from "@/lib/types";
import type { RegimeData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useAiTradeAnalysis } from "@/hooks/use-ai-analysis";
import { SignalChecklist } from "@/components/detail-panel/SignalChecklist";
import { NewsSection } from "@/components/detail-panel/NewsSection";
import { ConfirmPositionModal } from "@/components/detail-panel/ConfirmPositionModal";

interface DetailPanelProps {
  stock: Stock | null;
  onClose: () => void;
  regime?: RegimeData;
  onOpenPosition?: (pos: {
    ticker: string;
    direction: "LONG" | "SHORT";
    entryPrice: number;
    shares: number;
    stopLoss?: number;
    target?: number;
  }) => void;
}

export function DetailPanel({ stock, onClose, regime, onOpenPosition }: DetailPanelProps) {
  const { user } = useAuth();
  const [shares, setShares] = useState("1");
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { text: aiText, loading: aiLoading, error: aiError, analyze, reset: resetAi } = useAiTradeAnalysis();

  useEffect(() => { setShares("1"); resetAi(); setConfirmOpen(false); }, [stock?.ticker, resetAi]);

  if (!stock) return null;

  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;
  const scoreMax = 8;
  const scorePct = Math.round((score / scoreMax) * 100);

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

  // Risk calculator
  const entryPrice = stock.bestEntry;
  const stopDistance = Math.abs(entryPrice - stock.stopLoss);
  const accountVal = Math.max(parseFloat(accountSize) || 10000, 1);
  const riskPctVal = Math.min(Math.max(parseFloat(riskPct) || 1, 0.1), 100);
  const riskDollars = (accountVal * riskPctVal) / 100;
  const suggestedShares = (stopDistance > 0 && accountVal > 0 && riskPctVal > 0)
    ? Math.floor(riskDollars / stopDistance) : 0;
  const maxRisk = suggestedShares * stopDistance;

  const handleConfirmOpen = () => {
    setConfirmOpen(false);
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">{stock.ticker}</h2>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", isShort ? "bg-short/15 text-short" : "bg-long/15 text-long")}>
              {stock.tradeType}
            </span>
            {stock.earningsWarning && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">⚠ Earnings</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden w-32">
              <div
                className={cn("h-full rounded-full transition-all", isShort ? "bg-short" : "bg-long")}
                style={{ "--score-w": `${scorePct}%`, width: "var(--score-w)" } as React.CSSProperties}
              />
            </div>
            <span className={cn("text-sm font-bold font-mono", isShort ? "text-short" : "text-long")}>
              {score}<span className="text-muted-foreground font-normal text-xs">/8</span>
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {isShort ? "Bear" : "Bull"} Score
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1" title="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Signal Checklist */}
        <SignalChecklist checklist={checklist} signals={stock.signals} isShort={isShort} />

        {/* Swing Setup */}
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
              { label: "Short Int.", value: stock.shortInterest != null ? `${stock.shortInterest.toFixed(1)}%` : "—" },
            ].map((item) => (
              <div key={item.label} className={cn("rounded-md border border-border p-2.5", item.highlight && "border-primary/30 bg-primary/5")}>
                <div className="text-[10px] text-muted-foreground mb-0.5">{item.label}</div>
                <div className="text-sm font-mono font-medium text-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Calculator */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">RISK CALCULATOR</h3>
          <div className="rounded-md border border-border/60 bg-muted/10 p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="detail-account-size" className="text-[10px] text-muted-foreground block mb-1">Account Size ($)</label>
                <input
                  id="detail-account-size"
                  type="number"
                  min="100"
                  step="1000"
                  value={accountSize}
                  onChange={(e) => setAccountSize(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <div>
                <label htmlFor="detail-risk-pct" className="text-[10px] text-muted-foreground block mb-1">Risk per Trade (%)</label>
                <input
                  id="detail-risk-pct"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded border border-border p-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">Risk $</div>
                <div className="text-xs font-mono font-semibold text-foreground">${riskDollars.toFixed(0)}</div>
              </div>
              <div className="rounded border border-border p-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">Suggested Shares</div>
                <div className={cn("text-xs font-mono font-semibold", isShort ? "text-short" : "text-long")}>{suggestedShares > 0 ? suggestedShares : "—"}</div>
              </div>
              <div className="rounded border border-border p-2">
                <div className="text-[10px] text-muted-foreground mb-0.5">Max Loss</div>
                <div className="text-xs font-mono font-semibold text-foreground">${maxRisk.toFixed(0)}</div>
              </div>
            </div>
            {suggestedShares > 0 && (
              <button
                onClick={() => setShares(String(suggestedShares))}
                className="w-full text-[10px] text-primary/70 hover:text-primary transition-colors"
              >
                Use {suggestedShares} shares ↑
              </button>
            )}
          </div>
        </section>

        {/* News */}
        <NewsSection news={stock.news} />

        {/* AI Analysis */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI ANALYSIS
            </h3>
            {aiText && !aiLoading && (
              <button
                onClick={() => { resetAi(); analyze(stock, regime); }}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Refresh
              </button>
            )}
          </div>
          {!aiText && !aiLoading && !aiError && (
            <button
              onClick={() => analyze(stock, regime)}
              className="w-full h-9 rounded-md border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" />
              Generate AI trade commentary
            </button>
          )}
          {aiLoading && aiText === "" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analyzing setup…
            </div>
          )}
          {(aiText || (aiLoading && aiText !== "")) && (
            <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-foreground leading-relaxed">
              {aiText}
              {aiLoading && <span className="inline-block w-1 h-3 bg-primary/70 animate-pulse ml-0.5 align-middle" />}
            </div>
          )}
          {aiError && (
            <div className="text-xs text-short bg-short/10 border border-short/20 rounded-md px-3 py-2">{aiError}</div>
          )}
        </section>

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
                aria-label="Number of shares"
                className="w-20 h-10 px-2 rounded-md border border-border bg-background text-sm font-mono text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!(parseFloat(shares) > 0)}
                className={cn(
                  "flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors disabled:opacity-40",
                  isShort ? "bg-short text-short-foreground hover:bg-short/90" : "bg-long text-long-foreground hover:bg-long/90"
                )}
              >
                Open {stock.tradeType} — ${stock.bestEntry.toFixed(2)}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">Sign in to open positions</p>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <ConfirmPositionModal
          stock={stock}
          shares={shares}
          isShort={isShort}
          onConfirm={handleConfirmOpen}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
