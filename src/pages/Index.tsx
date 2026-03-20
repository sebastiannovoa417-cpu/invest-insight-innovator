import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SyncBar } from "@/components/SyncBar";
import { TopPickCard } from "@/components/TopPickCard";
import { FilterControls, TradeFilter, ScoreFilter, SortOption } from "@/components/FilterControls";
import { StockTable } from "@/components/StockTable";
import { StatsBar } from "@/components/StatsBar";
import { DetailPanel } from "@/components/DetailPanel";
import { StatusBar } from "@/components/StatusBar";
import { AuthModal } from "@/components/AuthModal";
import { PositionsPanel } from "@/components/PositionsPanel";
import { useStocks, useRegime, useLastRun, useScoreHistory, useWatchlist, usePositions, useRunWatcher } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { mockRegime, lastRunInfo } from "@/lib/mock-data";
import type { Stock } from "@/lib/types";

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Data hooks
  const { data: stocks = [], isLoading: stocksLoading } = useStocks();
  const { data: regime = mockRegime } = useRegime();
  const { data: runInfo = lastRunInfo } = useLastRun();
  const { data: scoreHistory = {} } = useScoreHistory();
  const { watchlist, toggle: toggleWatchlist } = useWatchlist();
  const { positions, openPosition, closePosition } = usePositions();
  useRunWatcher();

  // UI state
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("ALL");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("ANY");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPositions, setShowPositions] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder="Search…"]')?.focus();
      }
      if (e.key === "Escape") {
        setSelectedStock(null);
        setShowPositions(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleToggleWatchlist = useCallback((ticker: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    toggleWatchlist(ticker);
  }, [user, toggleWatchlist]);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    if (tradeFilter !== "ALL") {
      result = result.filter(s => s.tradeType === tradeFilter);
    }

    if (scoreFilter !== "ANY") {
      const min = parseInt(scoreFilter);
      result = result.filter(s => {
        const score = s.tradeType === "SHORT" ? s.bearScore : s.bullScore;
        return score >= min;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toUpperCase();
      result = result.filter(s => s.ticker.includes(q));
    }

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
  }, [stocks, tradeFilter, scoreFilter, sortBy, searchQuery, watchlist]);

  const topPick = useMemo(() => {
    const aligned = stocks.filter(s =>
      (regime.status === "BEARISH" && s.tradeType === "SHORT") ||
      (regime.status === "BULLISH" && s.tradeType === "LONG")
    );
    if (aligned.length === 0) return stocks[0] ?? null;
    return aligned.sort((a, b) => {
      const aS = a.tradeType === "SHORT" ? a.bearScore : a.bullScore;
      const bS = b.tradeType === "SHORT" ? b.bearScore : b.bullScore;
      return bS - aS;
    })[0];
  }, [stocks, regime]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="scanline-overlay" />

      <SyncBar
        regime={regime}
        runId={runInfo.runId}
        onRefresh={handleRefresh}
        onAuthClick={() => setShowAuth(true)}
        onPositionsClick={() => setShowPositions(true)}
      />

      <main className="flex-1 px-4 md:px-6 py-4 max-w-[1400px] mx-auto w-full">
        {topPick && <TopPickCard stock={topPick} regime={regime} />}

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

        <StockTable
          stocks={filteredStocks}
          watchlist={watchlist}
          scoreHistory={scoreHistory}
          onToggleWatchlist={handleToggleWatchlist}
          onSelectStock={setSelectedStock}
          selectedTicker={selectedStock?.ticker}
        />

        <StatsBar stocks={filteredStocks} regime={regime} />
      </main>

      {/* Detail Panel */}
      {selectedStock && (
        <>
          <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedStock(null)} />
          <DetailPanel
            stock={selectedStock}
            onClose={() => setSelectedStock(null)}
            onOpenPosition={(pos) => {
              if (!user) { setShowAuth(true); return; }
              openPosition(pos);
            }}
          />
        </>
      )}

      {/* Positions Panel */}
      {showPositions && (
        <>
          <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setShowPositions(false)} />
          <PositionsPanel
            positions={positions}
            stocks={stocks}
            onClose={() => setShowPositions(false)}
            onClosePosition={closePosition}
          />
        </>
      )}

      {/* Auth Modal */}
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />

      <StatusBar
        lastRun={runInfo.timestamp}
        stockCount={runInfo.stockCount}
        regime={runInfo.regime}
        universe={runInfo.universe}
        connected={true}
      />
    </div>
  );
};

export default Index;
