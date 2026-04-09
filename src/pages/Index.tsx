import { useState, useMemo, useEffect, useCallback, useDeferredValue, useRef, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, Menu, X } from "lucide-react";
import { SyncBar } from "@/components/SyncBar";
import { TopPickCard } from "@/components/TopPickCard";
import { FilterControls, TradeFilter, ScoreFilter, SortOption } from "@/components/FilterControls";
import { StockTable } from "@/components/StockTable";
import { StatsBar } from "@/components/StatsBar";
import { DetailPanel } from "@/components/DetailPanel";
import { StatusBar } from "@/components/StatusBar";
import { AuthModal } from "@/components/AuthModal";
import { PositionsPanel } from "@/components/PositionsPanel";
const BacktestPanel = lazy(() => import("@/components/BacktestPanel").then(m => ({ default: m.BacktestPanel })));
const AiChatPanel = lazy(() => import("@/components/AiChatPanel").then(m => ({ default: m.AiChatPanel })));
import { AiBrief } from "@/components/AiBrief";
import { AlertsPanel } from "@/components/AlertsPanel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useStocks, useRegime, useLastRun, useScoreHistory, useWatchlist, usePositions, useRunWatcher } from "@/hooks/use-data";
import { useAuth } from "@/hooks/use-auth";
import { useAlerts } from "@/hooks/use-alerts";
import { mockRegime, lastRunInfo } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

type ActiveTab = "dashboard" | "watchlist" | "regime" | "positions" | "backtest" | "ai" | "alerts";

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const prevUserRef = useRef(user);

  // Re-fetch all queries when auth state changes (sign-in or sign-out).
  // Without this, hooks like useStocks have no user dependency and keep
  // serving stale/mock data after login if the stocks table requires auth.
  useEffect(() => {
    const wasLoggedIn = !!prevUserRef.current;
    const isLoggedIn = !!user;
    if (wasLoggedIn !== isLoggedIn) {
      queryClient.invalidateQueries();
    }
    prevUserRef.current = user;
  }, [user, queryClient]);

  // Data hooks
  const { data: stocks = [] } = useStocks();
  const { data: regime = mockRegime } = useRegime();
  const { data: runInfo = lastRunInfo } = useLastRun();
  const { data: scoreHistory = {} } = useScoreHistory();
  const { watchlist, toggle: toggleWatchlist } = useWatchlist();
  const { positions, openPosition, closePosition } = usePositions();
  const { alerts } = useAlerts();
  useRunWatcher();

  // UI state — filters persisted in localStorage
  const VALID_TRADE_FILTERS: TradeFilter[] = ["ALL", "LONG", "SHORT"];
  const VALID_SCORE_FILTERS: ScoreFilter[] = ["ANY", "3+", "5+", "7+"];
  const VALID_SORT_OPTIONS: SortOption[] = ["score", "rsi", "volume", "ticker"];

  // Versioned localStorage keys — bump suffix when filter schema changes to avoid stale values.
  const LS_TRADE = "sp_v2_tradeFilter";
  const LS_SCORE = "sp_v2_scoreFilter";
  const LS_SORT = "sp_v2_sortBy";

  function getStored<T extends string>(key: string, valid: T[], fallback: T): T {
    const v = localStorage.getItem(key) as T;
    return valid.includes(v) ? v : fallback;
  }

  // One-time migration: copy old unversioned values to new keys, then remove old ones.
  useEffect(() => {
    const OLD_KEYS = ["sp_tradeFilter", "sp_scoreFilter", "sp_sortBy"];
    const NEW_KEYS = [LS_TRADE, LS_SCORE, LS_SORT];
    OLD_KEYS.forEach((old, i) => {
      const val = localStorage.getItem(old);
      if (val !== null && localStorage.getItem(NEW_KEYS[i]) === null) {
        localStorage.setItem(NEW_KEYS[i], val);
      }
      localStorage.removeItem(old);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>(() =>
    getStored(LS_TRADE, VALID_TRADE_FILTERS, "ALL")
  );
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>(() =>
    getStored(LS_SCORE, VALID_SCORE_FILTERS, "ANY")
  );
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    getStored(LS_SORT, VALID_SORT_OPTIONS, "score")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  // Persist filters to localStorage (versioned keys)
  useEffect(() => { localStorage.setItem(LS_TRADE, tradeFilter); }, [tradeFilter]);
  useEffect(() => { localStorage.setItem(LS_SCORE, scoreFilter); }, [scoreFilter]);
  useEffect(() => { localStorage.setItem(LS_SORT, sortBy); }, [sortBy]);

  const handleResetFilters = useCallback(() => {
    setTradeFilter("ALL");
    setScoreFilter("ANY");
    setSortBy("score");
    setSearchQuery("");
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        (document.getElementById("search-input") as HTMLInputElement | null)?.focus();
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

    if (deferredSearch) {
      const q = deferredSearch.toUpperCase();
      result = result.filter(s => s.ticker.includes(q) || s.name?.toUpperCase().includes(q));
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
  }, [stocks, watchlistStocks, activeTab, tradeFilter, scoreFilter, sortBy, deferredSearch, watchlist]);

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

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  }, []);

  const openPositionCount = useMemo(() => positions.filter(p => p.status === "open").length, [positions]);
  const triggeredAlertCount = useMemo(() => alerts.filter((a) => a.status === "triggered").length, [alerts]);

  // Tab definitions for burger menu and desktop tabs
  const tabDefs = useMemo(() => [
    { value: "dashboard" as ActiveTab, label: "Dashboard", badge: `${stocks.length}` },
    { value: "watchlist" as ActiveTab, label: "Watchlist", badge: `${watchlistStocks.length}`, icon: <Star className="w-3 h-3" /> },
    { value: "regime" as ActiveTab, label: "Regime" },
    { value: "positions" as ActiveTab, label: "Positions", badge: `${openPositionCount}` },
    { value: "backtest" as ActiveTab, label: "Backtest" },
    { value: "ai" as ActiveTab, label: "✦ AI" },
    {
      value: "alerts" as ActiveTab,
      label: "🔔 Alerts",
      badge: triggeredAlertCount > 0 ? `${triggeredAlertCount}` : undefined,
      badgeClass: "bg-amber-500 text-black",
    },
  ], [stocks.length, watchlistStocks.length, openPositionCount, triggeredAlertCount]);

  const activeTabDef = tabDefs.find(t => t.value === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="scanline-overlay" />

      <SyncBar
        regime={regime}
        runId={runInfo.runId}
        ranAt={runInfo.ranAt}
        onRefresh={handleRefresh}
        onAuthClick={() => setShowAuth(true)}
        onPositionsClick={() => handleTabChange("positions")}
      />

      <main className="flex-1 px-4 md:px-6 py-4 max-w-[1400px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => handleTabChange(v as ActiveTab)}>
          {/* Desktop tab bar — hidden on mobile */}
          <TabsList className="hidden md:flex w-full justify-start mb-4 bg-card border border-border h-auto p-1 rounded-lg gap-1">
            {tabDefs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs font-semibold tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.icon && <span className="mr-1">{tab.icon}</span>}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={cn("ml-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold", tab.badgeClass ?? "opacity-60")}>
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile burger menu — visible only on mobile */}
          <div className="md:hidden mb-4 relative">
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="flex items-center justify-between w-full px-4 py-2.5 rounded-lg bg-card border border-border text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                {activeTabDef?.icon && <span>{activeTabDef.icon}</span>}
                {activeTabDef?.label ?? activeTab}
                {activeTabDef?.badge !== undefined && (
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", activeTabDef?.badgeClass ?? "bg-muted text-muted-foreground")}>
                    {activeTabDef.badge}
                  </span>
                )}
              </span>
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {mobileMenuOpen && (
              <div role="menu" className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg bg-card border border-border shadow-xl overflow-hidden">
                {tabDefs.map((tab) => (
                  <button
                    key={tab.value}
                    role="menuitem"
                    onClick={() => handleTabChange(tab.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "flex items-center justify-between w-full px-4 py-3 text-sm font-medium transition-colors border-b border-border/50 last:border-b-0",
                      activeTab === tab.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {tab.icon}
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && (
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", tab.badgeClass ?? "bg-muted/30 text-muted-foreground")}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
              onResetFilters={handleResetFilters}
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
                      style={{ "--bar-w": `${(regime.regimeScore / 6) * 100}%`, width: "var(--bar-w)" } as React.CSSProperties}
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
                      style={{ "--bar-w": `${Math.min(regime.ratio * 50, 100)}%`, width: "var(--bar-w)" } as React.CSSProperties}
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
            <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading backtester…</div>}>
              <BacktestPanel stocks={stocks} />
            </Suspense>
          </TabsContent>

          {/* ── AI ── */}
          <TabsContent value="ai">
            <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading AI chat…</div>}>
              <AiChatPanel stocks={stocks} regime={regime} />
            </Suspense>
          </TabsContent>

          {/* ── Alerts ── */}
          <TabsContent value="alerts">
            <AlertsPanel stocks={stocks} />
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
        connected={stocks.length > 0}
      />
    </div>
  );
};

export default Index;
