import { useState, useMemo, useEffect, useCallback } from "react";
import { SyncBar } from "@/components/SyncBar";
import { TopPickCard } from "@/components/TopPickCard";
import { FilterControls, TradeFilter, ScoreFilter, SortOption } from "@/components/FilterControls";
import { StockTable } from "@/components/StockTable";
import { StatsBar } from "@/components/StatsBar";
import { DetailPanel } from "@/components/DetailPanel";
import { StatusBar } from "@/components/StatusBar";
import { mockStocks, mockRegime, lastRunInfo, Stock } from "@/lib/mock-data";

const Index = () => {
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("ALL");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("ANY");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Search…"]')?.focus();
      }
      if (e.key === "Escape") {
        setSelectedStock(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleWatchlist = useCallback((ticker: string) => {
    setWatchlist(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  }, []);

  const filteredStocks = useMemo(() => {
    let result = [...mockStocks];

    // Trade type filter
    if (tradeFilter !== "ALL") {
      result = result.filter(s => s.tradeType === tradeFilter);
    }

    // Score filter
    if (scoreFilter !== "ANY") {
      const min = parseInt(scoreFilter);
      result = result.filter(s => {
        const score = s.tradeType === "SHORT" ? s.bearScore : s.bullScore;
        return score >= min;
      });
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      result = result.filter(s => s.ticker.includes(q));
    }

    // Sort: watchlisted first, then by chosen sort
    result.sort((a, b) => {
      const aWl = watchlist.has(a.ticker) ? 0 : 1;
      const bWl = watchlist.has(b.ticker) ? 0 : 1;
      if (aWl !== bWl) return aWl - bWl;

      switch (sortBy) {
        case "score": {
          const aScore = a.tradeType === "SHORT" ? a.bearScore : a.bullScore;
          const bScore = b.tradeType === "SHORT" ? b.bearScore : b.bullScore;
          return bScore - aScore;
        }
        case "rsi": return b.rsi - a.rsi;
        case "volume": return b.volumeRatio - a.volumeRatio;
        case "ticker": return a.ticker.localeCompare(b.ticker);
        default: return 0;
      }
    });

    return result;
  }, [tradeFilter, scoreFilter, sortBy, searchQuery, watchlist]);

  // Top pick: highest directional score aligned with regime
  const topPick = useMemo(() => {
    const aligned = mockStocks.filter(s =>
      (mockRegime.status === "BEARISH" && s.tradeType === "SHORT") ||
      (mockRegime.status === "BULLISH" && s.tradeType === "LONG")
    );
    if (aligned.length === 0) return mockStocks[0];
    return aligned.sort((a, b) => {
      const aS = a.tradeType === "SHORT" ? a.bearScore : a.bullScore;
      const bS = b.tradeType === "SHORT" ? b.bearScore : b.bullScore;
      return bS - aS;
    })[0];
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <SyncBar regime={mockRegime} runId={lastRunInfo.runId} />

      <main className="flex-1 px-4 md:px-6 py-4 max-w-[1400px] mx-auto w-full">
        {/* Top Pick */}
        {topPick && <TopPickCard stock={topPick} regime={mockRegime} />}

        {/* Filters */}
        <FilterControls
          tradeFilter={tradeFilter}
          scoreFilter={scoreFilter}
          sortBy={sortBy}
          searchQuery={searchQuery}
          tickerCount={filteredStocks.length}
          onTradeFilterChange={setTradeFilter}
          onScoreFilterChange={setScoreFilter}
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
        />

        {/* Stock Table */}
        <StockTable
          stocks={filteredStocks}
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
          onSelectStock={setSelectedStock}
          selectedTicker={selectedStock?.ticker}
        />

        {/* Stats Bar */}
        <StatsBar stocks={filteredStocks} regime={mockRegime} />
      </main>

      {/* Detail Panel (slide-in) */}
      {selectedStock && (
        <>
          <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedStock(null)} />
          <DetailPanel stock={selectedStock} onClose={() => setSelectedStock(null)} />
        </>
      )}

      <StatusBar
        lastRun={lastRunInfo.timestamp}
        stockCount={lastRunInfo.stockCount}
        regime={lastRunInfo.regime}
        universe={lastRunInfo.universe}
        connected={true}
      />
    </div>
  );
};

export default Index;
