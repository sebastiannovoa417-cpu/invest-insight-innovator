import { Search, X, RotateCcw } from "lucide-react";

export type TradeFilter = "ALL" | "LONG" | "SHORT";
export type ScoreFilter = "ANY" | "3+" | "5+" | "7+";
export type SortOption = "score" | "rsi" | "volume" | "ticker";

interface FilterControlsProps {
  tradeFilter: TradeFilter;
  scoreFilter: ScoreFilter;
  sortBy: SortOption;
  searchQuery: string;
  tickerCount: number;
  onTradeFilterChange: (f: TradeFilter) => void;
  onScoreFilterChange: (f: ScoreFilter) => void;
  onSortChange: (s: SortOption) => void;
  onSearchChange: (q: string) => void;
  onResetFilters?: () => void;
}

export function FilterControls({
  tradeFilter, scoreFilter, sortBy, searchQuery, tickerCount,
  onTradeFilterChange, onScoreFilterChange, onSortChange, onSearchChange, onResetFilters,
}: FilterControlsProps) {
  const tradeOptions: TradeFilter[] = ["ALL", "LONG", "SHORT"];
  const scoreOptions: ScoreFilter[] = ["ANY", "3+", "5+", "7+"];
  const isFiltered = tradeFilter !== "ALL" || scoreFilter !== "ANY" || sortBy !== "score" || searchQuery !== "";

  return (
    <div
      className="win-panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "6px",
        padding: "4px 6px",
        marginBottom: "4px",
        fontFamily: "Tahoma, MS Sans Serif, sans-serif",
      }}
    >
      {/* Trade type label */}
      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000" }}>Type:</span>
      {/* Trade Type Segmented */}
      <div className="win-segmented">
        {tradeOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onTradeFilterChange(opt)}
            className={`win-segmented-btn${tradeFilter === opt ? " win-segmented-btn-active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Score label */}
      <span style={{ fontSize: "11px", fontWeight: "bold", color: "#000", marginLeft: "6px" }}>Score:</span>
      {/* Score Segmented */}
      <div className="win-segmented">
        {scoreOptions.map((opt) => (
          <button
            key={opt}
            onClick={() => onScoreFilterChange(opt)}
            className={`win-segmented-btn${scoreFilter === opt ? " win-segmented-btn-active" : ""}`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <Search style={{ position: "absolute", left: "4px", top: "50%", transform: "translateY(-50%)", width: "12px", height: "12px", color: "#808080" }} />
        <input
          id="search-input"
          type="text"
          placeholder="Search… (press /)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="win-input"
          style={{ paddingLeft: "20px", paddingRight: searchQuery ? "20px" : "4px", width: "180px", height: "22px" }}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            style={{
              position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#808080", fontSize: "10px", lineHeight: 1,
            }}
          >
            <X style={{ width: "10px", height: "10px" }} />
          </button>
        )}
      </div>

      {/* Sort dropdown */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <label htmlFor="sort-select" style={{ fontSize: "11px", fontWeight: "bold", color: "#000" }}>Sort:</label>
        <select
          id="sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="win-select"
          style={{ height: "22px" }}
        >
          <option value="score">Score ↓</option>
          <option value="rsi">RSI</option>
          <option value="volume">Volume</option>
          <option value="ticker">Ticker</option>
        </select>
      </div>

      {/* Reset filters */}
      {isFiltered && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="win-btn"
          style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "auto", padding: "2px 6px" }}
          title="Reset all filters"
        >
          <RotateCcw style={{ width: "10px", height: "10px" }} />
          Reset
        </button>
      )}

      {/* Ticker count */}
      <span style={{ fontSize: "11px", color: "#444", fontFamily: "Courier New", marginLeft: "auto" }}>
        {tickerCount} TICKERS
      </span>
    </div>
  );
}
