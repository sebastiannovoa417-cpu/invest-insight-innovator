import { Star } from "lucide-react";
import { Stock } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { DualScoreBar } from "./DualScoreBar";
import { MiniSparkline } from "./MiniSparkline";
import { mockScoreHistory } from "@/lib/mock-data";

interface StockTableProps {
  stocks: Stock[];
  watchlist: Set<string>;
  onToggleWatchlist: (ticker: string) => void;
  onSelectStock: (stock: Stock) => void;
  selectedTicker?: string;
}

export function StockTable({ stocks, watchlist, onToggleWatchlist, onSelectStock, selectedTicker }: StockTableProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[32px_28px_64px_80px_120px_72px_56px_52px_64px_80px] gap-0 bg-card px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-wider border-b border-border">
        <span></span>
        <span>★</span>
        <span>TICKER</span>
        <span>TYPE</span>
        <span>SCORE</span>
        <span>PRICE</span>
        <span>RSI</span>
        <span>VOL</span>
        <span>SPIKE</span>
        <span>UPDATED</span>
      </div>

      {/* Rows */}
      {stocks.map((stock, i) => {
        const isShort = stock.tradeType === "SHORT";
        const isWatchlisted = watchlist.has(stock.ticker);
        const isSelected = selectedTicker === stock.ticker;
        const directionalScore = isShort ? stock.bearScore : stock.bullScore;
        const history = mockScoreHistory[stock.ticker];
        const sparklineData = history?.map(h => isShort ? h.bear : h.bull);

        return (
          <div
            key={stock.ticker}
            onClick={() => onSelectStock(stock)}
            className={cn(
              "grid grid-cols-[32px_28px_64px_80px_120px_72px_56px_52px_64px_80px] gap-0 px-3 py-2 text-xs items-center cursor-pointer transition-colors border-b border-border/50",
              isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-card/80",
              isWatchlisted && !isSelected && "border-l-2 border-l-primary/30",
              stock.conflictTrend && "opacity-60"
            )}
          >
            {/* Checkbox placeholder */}
            <span className="text-muted-foreground font-mono text-[10px]">{i + 1}</span>

            {/* Watchlist Star */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.ticker); }}
              className={cn("transition-colors", isWatchlisted ? "text-primary" : "text-border hover:text-muted-foreground")}
            >
              <Star className={cn("w-3.5 h-3.5", isWatchlisted && "fill-primary")} />
            </button>

            {/* Ticker */}
            <span className="font-semibold text-foreground">{stock.ticker}</span>

            {/* Type + badges */}
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-[10px] font-bold",
                isShort ? "text-short" : "text-long"
              )}>
                {stock.tradeType}
              </span>
              {stock.conflictTrend && (
                <span className="text-[9px] text-muted-foreground">~CT</span>
              )}
            </div>

            {/* Dual Score Bars + Sparkline */}
            <div className="flex items-center gap-2">
              <DualScoreBar bullScore={stock.bullScore} bearScore={stock.bearScore} />
              {sparklineData && (
                <MiniSparkline
                  data={sparklineData}
                  color={isShort ? "hsl(var(--short))" : "hsl(var(--long))"}
                />
              )}
            </div>

            {/* Price */}
            <span className="font-mono text-foreground">${stock.price.toFixed(2)}</span>

            {/* RSI */}
            <span className={cn(
              "font-mono",
              stock.rsi > 70 ? "text-short" : stock.rsi < 30 ? "text-long" : "text-muted-foreground"
            )}>
              {stock.rsi}
            </span>

            {/* Volume ratio */}
            <span className="font-mono text-muted-foreground">{stock.volumeRatio}x</span>

            {/* Spike */}
            <span>
              {stock.volumeSpike && (
                <span className="text-primary text-[10px] font-bold">↑</span>
              )}
            </span>

            {/* Updated */}
            <span className="text-[10px] text-muted-foreground">{stock.updatedAt}</span>
          </div>
        );
      })}
    </div>
  );
}
