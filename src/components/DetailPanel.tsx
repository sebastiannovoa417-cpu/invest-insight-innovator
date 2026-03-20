import { X, Check, Minus, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus as NeutralIcon } from "lucide-react";
import { Stock } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";

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

const VISIBLE_NEWS = 3;

export function DetailPanel({ stock, onClose, onOpenPosition }: DetailPanelProps) {
  const { user } = useAuth();
  const [shares, setShares] = useState("1");
  const [showMoreNews, setShowMoreNews] = useState(false);

  useEffect(() => { setShares("1"); }, [stock?.ticker]);

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

  const visibleNews = stock.news.slice(0, VISIBLE_NEWS);
  const hiddenNews = stock.news.slice(VISIBLE_NEWS);

  const sentimentIcon = (sentiment?: string) => {
    if (sentiment === "bullish") return <TrendingUp className="w-3 h-3 text-long flex-shrink-0" />;
    if (sentiment === "bearish") return <TrendingDown className="w-3 h-3 text-short flex-shrink-0" />;
    return <NeutralIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />;
  };

  const sentimentBadge = (sentiment?: string) => {
    if (sentiment === "bullish") return "bg-long/10 text-long";
    if (sentiment === "bearish") return "bg-short/10 text-short";
    return "bg-border/40 text-muted-foreground";
  };

  const scoreMax = 8;
  const scorePct = Math.round((score / scoreMax) * 100);

  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-foreground">{stock.ticker}</h2>
            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold tracking-wider", isShort ? "bg-short/15 text-short" : "bg-long/15 text-long")}>
              {stock.tradeType}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{stock.name}</p>
          {/* Score bar */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-2 rounded-full bg-border overflow-hidden w-32">
              <div
                className={cn("h-full rounded-full transition-all", isShort ? "bg-short" : "bg-long")}
                style={{ width: `${scorePct}%` }}
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
            <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">
              RECENT NEWS <span className="font-normal normal-case text-muted-foreground/60">({stock.news.length} articles)</span>
            </h3>
            <div className="space-y-3">
              {visibleNews.map((n, i) => (
                <div key={i} className={cn("rounded-md border border-border/60 p-3 space-y-1.5", sentimentBadge(n.sentiment).includes("long") ? "border-long/20" : n.sentiment === "bearish" ? "border-short/20" : "")}>
                  <div className="flex items-start gap-1.5">
                    {sentimentIcon(n.sentiment)}
                    <span className="text-xs font-medium text-foreground leading-snug">{n.title}</span>
                  </div>
                  {n.summary && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">{n.summary}</p>
                  )}
                  <div className="flex items-center gap-2 pl-4">
                    {n.source && (
                      <span className="text-[10px] font-medium text-primary/70">{n.source}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">— {n.date}</span>
                    {n.sentiment && (
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", sentimentBadge(n.sentiment))}>
                        {n.sentiment}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {hiddenNews.length > 0 && (
                <>
                  {showMoreNews && hiddenNews.map((n, i) => (
                    <div key={`hidden-${i}`} className={cn("rounded-md border border-border/60 p-3 space-y-1.5", n.sentiment === "bullish" ? "border-long/20" : n.sentiment === "bearish" ? "border-short/20" : "")}>
                      <div className="flex items-start gap-1.5">
                        {sentimentIcon(n.sentiment)}
                        <span className="text-xs font-medium text-foreground leading-snug">{n.title}</span>
                      </div>
                      {n.summary && (
                        <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">{n.summary}</p>
                      )}
                      <div className="flex items-center gap-2 pl-4">
                        {n.source && (
                          <span className="text-[10px] font-medium text-primary/70">{n.source}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">— {n.date}</span>
                        {n.sentiment && (
                          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", sentimentBadge(n.sentiment))}>
                            {n.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowMoreNews(p => !p)}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-primary/80 hover:text-primary transition-colors w-full justify-center py-1.5 rounded-md border border-dashed border-border hover:border-primary/40"
                  >
                    {showMoreNews ? (
                      <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-3.5 h-3.5" /> Show {hiddenNews.length} more article{hiddenNews.length !== 1 ? "s" : ""}</>
                    )}
                  </button>
                </>
              )}
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
                aria-label="Number of shares"
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

