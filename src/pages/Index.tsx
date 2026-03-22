import { useState, useMemo, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { SyncBar } from "@/components/SyncBar";
import { TopPickCard } from "@/components/TopPickCard";
import { FilterControls, TradeFilter, ScoreFilter, SortOption } from "@/components/FilterControls";
import { StockTable } from "@/components/StockTable";
import { StatsBar } from "@/components/StatsBar";
import { DetailPanel } from "@/components/DetailPanel";
import { StatusBar } from "@/components/StatusBar";
import { AuthModal } from "@/components/AuthModal";
import { PositionsPanel } from "@/components/PositionsPanel";
import { BacktestPanel } from "@/components/BacktestPanel";
import { AiBrief } from "@/components/AiBrief";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStocks, useRegime, useLastRun, useScoreHistory, useWatchlist, usePositions, useRunWatcher } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { mockRegime, lastRunInfo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

type ActiveTab = "dashboard" | "watchlist" | "regime" | "positions" | "backtest" | "ai";

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Data hooks
  const { data: stocks = [] } = useStocks();
  const { data: regime = mockRegime } = useRegime();
  const { data: runInfo = lastRunInfo } = useLastRun();
  const { data: scoreHistory = {} } = useScoreHistory();
  const { watchlist, toggle: toggleWatchlist } = useWatchlist();
  const { positions, openPosition, closePosition } = usePositions();
  useRunWatcher();

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>("ALL");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("ANY");
  const [sortBy, setSortBy] = useState<SortOption>("score");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showAuth, setShowAuth] = useState(false);

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

  const watchlistStocks = useMemo(() =>
    stocks.filter(s => watchlist.has(s.ticker)),
    [stocks, watchlist]);

  const filteredStocks = useMemo(() => {
    let result = activeTab === "watchlist"
      ? [...watchlistStocks]
      : [...stocks];

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
  }, [stocks, watchlistStocks, activeTab, tradeFilter, scoreFilter, sortBy, searchQuery, watchlist]);

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
        onPositionsClick={() => setActiveTab("positions")}
      />

      <main className="flex-1 px-4 md:px-6 py-4 max-w-[1400px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          <TabsList className="w-full justify-start mb-4 bg-card border border-border h-auto p-1 rounded-lg gap-1">
            <TabsTrigger
              value="dashboard"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Dashboard <span className="ml-1 opacity-60">({stocks.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="watchlist"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Star className="w-3 h-3 mr-1" />
              Watchlist <span className="ml-1 opacity-60">({watchlistStocks.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="regime"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Regime
            </TabsTrigger>
            <TabsTrigger
              value="positions"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Positions <span className="ml-1 opacity-60">({positions.filter(p => p.status === "open").length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="backtest"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Backtest
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              ✦ AI
            </TabsTrigger>
          </TabsList>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard">
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
            <AiBrief stocks={stocks} regime={regime} />
            <StatsBar stocks={filteredStocks} regime={regime} />
          </TabsContent>

          {/* ── Watchlist ── */}
          <TabsContent value="watchlist">
            {watchlistStocks.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <Star className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-muted-foreground">No stocks in your watchlist yet.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Click the ★ next to any ticker in the Dashboard to add it here.</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </TabsContent>

          {/* ── Regime ── */}
          <TabsContent value="regime">
            <div className="space-y-4">
              {/* Status header */}
              <div className="rounded-lg border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-muted-foreground tracking-wider">MARKET REGIME</h2>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-bold tracking-wide",
                    regime.status === "BULLISH" ? "bg-long/20 text-long" :
                      regime.status === "BEARISH" ? "bg-short/20 text-short" :
                        "bg-muted text-muted-foreground"
                  )}>
                    {regime.status}
                  </span>
                </div>
                {/* Regime score progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Regime Score</span>
                    <span className="font-mono text-foreground">{regime.regimeScore}/6</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all",
                        regime.status === "BULLISH" ? "bg-long" :
                          regime.status === "BEARISH" ? "bg-short" :
                            "bg-muted-foreground"
                      )}
                      style={{ width: `${(regime.regimeScore / 6) * 100}%` }}
                    />
                  </div>
                </div>
                {/* SPY vs SMA200 bar */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>SPY / SMA 200 ratio</span>
                    <span className={cn("font-mono font-semibold", regime.ratio >= 1 ? "text-long" : "text-short")}>
                      {regime.ratio.toFixed(4)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", regime.ratio >= 1 ? "bg-long" : "bg-short")}
                      style={{ width: `${Math.min(regime.ratio * 50, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "SPY Price", value: `$${regime.spyPrice.toFixed(2)}`, color: regime.ratio >= 1 ? "text-long" : "text-short" },
                  { label: "SMA 200", value: `$${regime.sma200.toFixed(2)}`, color: "text-muted-foreground" },
                  { label: "SMA 50", value: `$${regime.sma50.toFixed(2)}`, color: "text-muted-foreground" },
                  { label: "SPY RSI", value: regime.spyRsi.toFixed(1), color: regime.spyRsi > 70 ? "text-short" : regime.spyRsi < 30 ? "text-long" : "text-foreground" },
                  { label: "VIX", value: regime.vix.toFixed(2), color: regime.vix > 25 ? "text-short" : "text-long" },
                  { label: "SPY − SMA200", value: `${((regime.spyPrice - regime.sma200) >= 0 ? "+" : "")}${(regime.spyPrice - regime.sma200).toFixed(2)}`, color: regime.spyPrice >= regime.sma200 ? "text-long" : "text-short" },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border border-border bg-card p-4 text-center">
                    <div className={cn("text-xl font-bold font-mono", m.color)}>{m.value}</div>
                    <div className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Interpretation: </span>
                {regime.status === "BULLISH" && "SPY is trading above SMA 200 — bulls are in control. Favour LONG setups with regime-aligned scores."}
                {regime.status === "BEARISH" && "SPY is trading below SMA 200 — bears are in control. Favour SHORT setups with regime-aligned scores."}
                {regime.status === "NEUTRAL" && "SPY is near SMA 200 — no clear directional bias. Require higher score thresholds before entering any setup."}
              </div>
            </div>
          </TabsContent>

          {/* ── Positions ── */}
          <TabsContent value="positions">
            <PositionsPanel
              inline
              positions={positions}
              stocks={stocks}
              onClose={() => setActiveTab("dashboard")}
              onClosePosition={closePosition}
            />
          </TabsContent>

          {/* ── Backtest ── */}
          <TabsContent value="backtest">
            <BacktestPanel stocks={stocks} />
          </TabsContent>

          {/* ── AI ── */}
          <TabsContent value="ai">
            <AiChatPanel stocks={stocks} regime={regime} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Detail Panel (slide-over — works across all tabs) */}
      {selectedStock && (
        <>
          <div className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedStock(null)} />
          <DetailPanel
            stock={selectedStock}
            regime={regime}
            onClose={() => setSelectedStock(null)}
            onOpenPosition={(pos) => {
              if (!user) { setShowAuth(true); return; }
              openPosition(pos);
            }}
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
