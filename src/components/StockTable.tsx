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
    <div style={{ fontFamily: "Tahoma, MS Sans Serif, sans-serif", marginBottom: "4px" }}>
      {/* Pagination row */}
      {totalPages > 1 && (
        <div
          className="win-panel"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 4px", marginBottom: "2px" }}
        >
          <div style={{ display: "flex", gap: "2px" }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="win-btn"
                data-active={page === i ? "true" : undefined}
                style={{ minWidth: "auto", padding: "1px 8px", fontSize: "11px", fontWeight: page === i ? "bold" : "normal" }}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="win-btn"
              style={{ minWidth: "auto", padding: "1px 4px", opacity: page === 0 ? 0.4 : 1 }}
            >
              <ChevronLeft style={{ width: "12px", height: "12px" }} />
            </button>
            <span style={{ fontSize: "11px", fontFamily: "Courier New" }}>
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, stocks.length)} of {stocks.length}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="win-btn"
              style={{ minWidth: "auto", padding: "1px 4px", opacity: page === totalPages - 1 ? 0.4 : 1 }}
            >
              <ChevronRight style={{ width: "12px", height: "12px" }} />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className="win-sunken"
        style={{ backgroundColor: "#ffffff", overflow: "hidden" }}
      >
        {/* Header */}
        <div
          className="win-table-header"
          style={{
            display: "grid",
            gridTemplateColumns: "28px 24px 64px 72px 120px 68px 48px 48px 56px 76px",
            padding: "0 2px",
          }}
        >
          {["#", "★", "TICKER", "TYPE", "SCORE", "PRICE", "RSI", "VOL", "SPIKE", "UPDATED"].map((h) => (
            <div
              key={h}
              className="win-table-header-cell"
              style={{ fontSize: "11px", fontWeight: "bold", padding: "2px 3px", color: "#000" }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {pageStocks.map((stock, i) => {
          const isShort = stock.tradeType === "SHORT";
          const isWatchlisted = watchlist.has(stock.ticker);
          const isSelected = selectedTicker === stock.ticker;
          const history = scoreHistory[stock.ticker];
          const sparklineData = history?.map(h => isShort ? h.bear : h.bull);

          return (
            <div
              key={stock.ticker}
              tabIndex={0}
              aria-label={`View details for ${stock.ticker}`}
              onClick={() => onSelectStock(stock)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectStock(stock); } }}
              style={{
                display: "grid",
                gridTemplateColumns: "28px 24px 64px 72px 120px 68px 48px 48px 56px 76px",
                padding: "1px 2px",
                alignItems: "center",
                cursor: "pointer",
                borderBottom: "1px solid #d4d0c8",
                backgroundColor: isSelected
                  ? "#0a246a"
                  : isWatchlisted
                  ? "#fffbcc"
                  : (pageOffset + i) % 2 === 0 ? "#ffffff" : "#f0f0f0",
                color: isSelected ? "#ffffff" : "#000000",
                opacity: stock.conflictTrend ? 0.65 : 1,
              }}
              className={cn(!isSelected && "hover:bg-[#d5e6fd]")}
            >
              <span style={{ fontSize: "10px", fontFamily: "Courier New", color: isSelected ? "#ccc" : "#666" }}>
                {pageOffset + i + 1}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.ticker); }}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isWatchlisted ? "#cc8800" : isSelected ? "#888" : "#c0c0c0",
                  padding: 0,
                  fontSize: "12px",
                  lineHeight: 1,
                }}
              >
                <Star className={cn("w-3 h-3", isWatchlisted && "fill-[#cc8800]")} />
              </button>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>{stock.ticker}</span>
                {stock.name && (
                  <span style={{ fontSize: "9px", color: isSelected ? "#aac4ff" : "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60px" }}>
                    {stock.name}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "2px", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  color: isSelected ? "#ffffff" : isShort ? "#cc0000" : "#008000",
                  border: `1px solid ${isShort ? "#cc0000" : "#008000"}`,
                  padding: "0 3px",
                  backgroundColor: isSelected ? "transparent" : isShort ? "#ffe8e8" : "#e8ffe8",
                }}>
                  {stock.tradeType}
                </span>
                {stock.earningsWarning && <span style={{ fontSize: "9px", color: "#cc8800" }}>⚠</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <DualScoreBar bullScore={stock.bullScore} bearScore={stock.bearScore} />
                {sparklineData && (
                  <MiniSparkline data={sparklineData} color={isShort ? "#cc0000" : "#008000"} />
                )}
              </div>
              <span style={{ fontFamily: "Courier New", fontSize: "11px" }}>${stock.price.toFixed(2)}</span>
              <span style={{
                fontFamily: "Courier New",
                fontSize: "11px",
                color: isSelected ? "#fff" : stock.rsi > 70 ? "#cc0000" : stock.rsi < 30 ? "#008000" : "#000",
              }}>
                {stock.rsi}
              </span>
              <span style={{ fontFamily: "Courier New", fontSize: "11px", color: isSelected ? "#ccc" : "#444" }}>
                {stock.volumeRatio}x
              </span>
              <span>
                {stock.volumeSpike && (
                  <span style={{ color: isSelected ? "#88ffff" : "#0050cc", fontWeight: "bold", fontSize: "12px" }}>↑</span>
                )}
              </span>
              <span style={{ fontSize: "10px", color: isSelected ? "#ccc" : "#666" }}>{stock.updatedAt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
