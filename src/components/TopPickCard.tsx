import { Stock, RegimeData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TopPickCardProps {
  stock: Stock;
  regime: RegimeData;
}

export function TopPickCard({ stock, regime }: TopPickCardProps) {
  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;
  const isRegimeAligned = (isShort && regime.status === "BEARISH") || (!isShort && regime.status === "BULLISH");

  const circumference = 2 * Math.PI * 36;
  const fillPercent = (score / 8) * circumference;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-5">
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
            <circle
              cx="44" cy="44" r="36" fill="none"
              stroke={isShort ? "hsl(var(--short))" : "hsl(var(--long))"}
              strokeWidth="4" strokeLinecap="round"
              strokeDasharray={`${fillPercent} ${circumference}`}
              transform="rotate(-90 44 44)"
              className="score-bar-fill"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-mono text-foreground">{score}</span>
            <span className="text-[10px] text-muted-foreground">/8</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground font-medium">#1</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{stock.ticker}</h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-3">
            <span className="text-foreground">${stock.price.toFixed(2)}</span>
            <span>·</span>
            <span>RSI {stock.rsi}</span>
            <span>·</span>
            <span>Vol {stock.volumeRatio}x avg</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {isRegimeAligned && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/15 text-primary">✓ Regime Aligned</span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              52W {stock.distance52w >= 0 ? "+" : ""}{stock.distance52w.toFixed(1)}%
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
              Entry ${stock.bestEntry.toFixed(2)}
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
              isShort ? "bg-short/15 text-short" : "bg-long/15 text-long"
            )}>
              {stock.tradeType}
            </span>
            {stock.earningsWarning && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400">⚠ Earnings</span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {stock.signals.sma200 && <span>Price {isShort ? "<" : ">"} SMA_200</span>}
            {stock.signals.sma50 && <span>Price {isShort ? "<" : ">"} SMA_50</span>}
            {stock.signals.rsiMomentum && <span>RSI {isShort ? "bearish" : "bullish"}: {stock.rsi}</span>}
            {stock.signals.volume && <span>{isShort ? "Distribution" : "Accumulation"} vol: {stock.volumeRatio}x</span>}
            {stock.signals.macd && <span>MACD {isShort ? "bearish" : "bullish"}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
