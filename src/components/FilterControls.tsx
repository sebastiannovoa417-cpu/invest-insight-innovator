import { Search, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, type CategoryFilter } from "@/lib/stock-categories";

export type { CategoryFilter };
export type TradeFilter = "ALL" | "LONG" | "SHORT";
export type ScoreFilter = "ANY" | "3+" | "5+" | "7+";
export type SortOption = "score" | "rsi" | "volume" | "ticker";

interface FilterControlsProps {
  tradeFilter: TradeFilter;
  scoreFilter: ScoreFilter;
  sortBy: SortOption;
  searchQuery: string;
  tickerCount: number;
  categoryFilter: CategoryFilter;
  onTradeFilterChange: (f: TradeFilter) => void;
  onScoreFilterChange: (f: ScoreFilter) => void;
  onSortChange: (s: SortOption) => void;
  onSearchChange: (q: string) => void;
  onCategoryFilterChange: (c: CategoryFilter) => void;
  onResetFilters?: () => void;
}

export function FilterControls({
  tradeFilter, scoreFilter, sortBy, searchQuery, tickerCount, categoryFilter,
  onTradeFilterChange, onScoreFilterChange, onSortChange, onSearchChange,
  onCategoryFilterChange, onResetFilters,
}: FilterControlsProps) {
  const tradeOptions: TradeFilter[] = ["ALL", "LONG", "SHORT"];
  const scoreOptions: ScoreFilter[] = ["ANY", "3+", "5+", "7+"];
  const isFiltered = tradeFilter !== "ALL" || scoreFilter !== "ANY" || sortBy !== "score" || searchQuery !== "" || categoryFilter !== "ALL";

  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      {/* Category Segmented */}
      <div className="flex rounded-md border border-border overflow-hidden">
        {CATEGORY_LABELS.map((opt) => (
          <button
            key={opt}
            onClick={() => onCategoryFilterChange(opt)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              categoryFilter === opt
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {opt === "ALL" ? "All Categories" : opt === "High Dividend Yield & High Earnings" ? "High Dividend" : "Penny Stocks"}
          </button>
        ))}
      </div>

      {/* Trade Type Segmented */}
      <div className="flex rounded-md border border-border overflow-hidden">
        {tradeOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onTradeFilterChange(opt)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              tradeFilter === opt
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Score Segmented */}
      <div className="flex rounded-md border border-border overflow-hidden">
        {scoreOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onScoreFilterChange(opt)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              scoreFilter === opt
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[140px] max-w-full sm:max-w-[220px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          id="search-input"
          type="text"
          placeholder="Search… (press /)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 pl-8 pr-7 rounded-md border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        aria-label="Sort by"
        className="h-8 px-2 rounded-md border border-border bg-card text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
      >
        <option value="score">SCORE ↓</option>
        <option value="rsi">RSI</option>
        <option value="volume">VOLUME</option>
        <option value="ticker">TICKER</option>
      </select>

      {/* Reset filters */}
      {isFiltered && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 h-8 px-2 rounded-md border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      )}

      {/* Ticker count */}
      <span className="text-xs text-muted-foreground font-mono ml-auto">
        {tickerCount} TICKERS
      </span>
    </div>
  );
}
