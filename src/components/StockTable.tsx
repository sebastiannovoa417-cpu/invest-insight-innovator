import { useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Stock, ScoreHistoryPoint } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DualScoreBar } from "./DualScoreBar";
import { MiniSparkline } from "./MiniSparkline";

const PAGE_SIZE = 11;

interface StockTableProps {
  stocks: Stock[];
  watchlist: Set<string>;
  scoreHistory: Record<string, ScoreHistoryPoint[]>;
  onToggleWatchlist: (ticker: string) => void;
  onSelectStock: (stock: Stock) => void;
  selectedTicker?: string;
}

export function StockTable({ stocks, watchlist, scoreHistory, onToggleWatchlist, onSelectStock, selectedTicker }: StockTableProps) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(stocks.length / PAGE_SIZE));
  const pageStocks = stocks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pageOffset = page * PAGE_SIZE;

  return (
    <div className="space-y-0">
      {/* Page tabs */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-card border border-border border-b-0 rounded-t-lg px-3 py-1.5">
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "px-3 py-1 rounded text-[11px] font-semibold tracking-wide transition-colors",
                  page === i
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-border/50"
                )}
              >
                Page {i + 1}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              title="Previous page"
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground font-mono">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, stocks.length)} of {stocks.length}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              title="Next page"
              className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className={cn("border border-border overflow-hidden", totalPages > 1 ? "rounded-b-lg" : "rounded-lg")}>
        <div className="grid grid-cols-[32px_28px_64px_80px_120px_72px_56px_52px_64px_80px] gap-0 bg-card px-3 py-2 text-[10px] font-medium text-muted-foreground tracking-wider border-b border-border">
          <span></span><span>★</span><span>TICKER</span><span>TYPE</span><span>SCORE</span>
          <span>PRICE</span><span>RSI</span><span>VOL</span><span>SPIKE</span><span>UPDATED</span>
        </div>

        {pageStocks.map((stock, i) => {
          const isShort = stock.tradeType === "SHORT";
          const isWatchlisted = watchlist.has(stock.ticker);
          const isSelected = selectedTicker === stock.ticker;
          const history = scoreHistory[stock.ticker];
          const sparklineData = history?.map(h => isShort ? h.bear : h.bull);

          return (
            <div
              key={stock.ticker}
              role="button"
              tabIndex={0}
              aria-label={`View details for ${stock.ticker}`}
              onClick={() => onSelectStock(stock)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectStock(stock); } }}
              className={cn(
                "grid grid-cols-[32px_28px_64px_80px_120px_72px_56px_52px_64px_80px] gap-0 px-3 py-2 text-xs items-center cursor-pointer transition-colors border-b border-border/50",
                isSelected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-card/80",
                isWatchlisted && !isSelected && "border-l-2 border-l-primary/30",
                stock.conflictTrend && "opacity-60"
              )}
            >
              <span className="text-muted-foreground font-mono text-[10px]">{pageOffset + i + 1}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.ticker); }}
                className={cn("transition-colors", isWatchlisted ? "text-primary" : "text-border hover:text-muted-foreground")}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
              >
                <Star className={cn("w-3.5 h-3.5", isWatchlisted && "fill-primary")} />
              </button>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-semibold text-foreground">{stock.ticker}</span>
                {stock.name && <span className="text-[9px] text-muted-foreground truncate max-w-[58px]">{stock.name}</span>}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className={cn("text-[10px] font-bold", isShort ? "text-short" : "text-long")}>{stock.tradeType}</span>
                {stock.conflictTrend && <span className="text-[9px] text-muted-foreground">~CT</span>}
                {stock.earningsWarning && <span className="text-[9px] font-bold text-amber-400" title="Earnings risk">⚠</span>}
              </div>
              <div className="flex items-center gap-2">
                <DualScoreBar bullScore={stock.bullScore} bearScore={stock.bearScore} />
                {sparklineData && (
                  <MiniSparkline data={sparklineData} color={isShort ? "hsl(var(--short))" : "hsl(var(--long))"} />
                )}
              </div>
              <span className="font-mono text-foreground">${stock.price.toFixed(2)}</span>
              <span className={cn("font-mono", stock.rsi > 70 ? "text-short" : stock.rsi < 30 ? "text-long" : "text-muted-foreground")}>{stock.rsi}</span>
              <span className="font-mono text-muted-foreground">{stock.volumeRatio}x</span>
              <span>{stock.volumeSpike && <span className="text-primary text-[10px] font-bold">↑</span>}</span>
              <span className="text-[10px] text-muted-foreground">{stock.updatedAt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

