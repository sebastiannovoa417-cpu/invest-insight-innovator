import { useState, useMemo, useEffect, useCallback, useDeferredValue, useRef } from "react";
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

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "Tahoma, MS Sans Serif, Arial, sans-serif" }}>
      <div className="scanline-overlay" />

      <SyncBar
        regime={regime}
        runId={runInfo.runId}
        ranAt={runInfo.ranAt}
        onRefresh={handleRefresh}
        onAuthClick={() => setShowAuth(true)}
        onPositionsClick={() => setActiveTab("positions")}
      />

      <main className="flex-1 px-2 md:px-4 py-2 max-w-[1400px] mx-auto w-full">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
          {/* Win2K-style tab bar */}
          <TabsList
            style={{
              width: "100%",
              justifyContent: "flex-start",
              display: "flex",
              gap: 0,
              backgroundColor: "transparent",
              border: "none",
              padding: 0,
              marginBottom: 0,
              height: "auto",
              borderRadius: 0,
            }}
          >
            {(
              [
                { value: "dashboard", label: `Dashboard (${stocks.length})` },
                { value: "watchlist", label: `★ Watchlist (${watchlistStocks.length})` },
                { value: "regime", label: "Regime" },
                { value: "positions", label: `Positions (${positions.filter(p => p.status === "open").length})` },
                { value: "backtest", label: "Backtest" },
                { value: "ai", label: "✦ AI" },
                {
                  value: "alerts",
                  label: `🔔 Alerts${alerts.filter((a) => a.status === "triggered").length > 0 ? ` [${alerts.filter((a) => a.status === "triggered").length}]` : ""}`,
                },
              ] as { value: ActiveTab; label: string }[]
            ).map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                style={{ borderRadius: 0, padding: 0, background: "none", border: "none", boxShadow: "none" }}
              >
                <span
                  className={activeTab === tab.value ? "win-tab-active" : "win-tab-inactive"}
                  style={{ display: "block" }}
                >
                  {tab.label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tab content panel — classic Win2K raised border below tabs */}
          <div
            style={{
              backgroundColor: "#d4d0c8",
              borderStyle: "solid",
              borderWidth: "2px",
              borderTopColor: "#ffffff",
              borderLeftColor: "#ffffff",
              borderRightColor: "#808080",
              borderBottomColor: "#808080",
              boxShadow: "inset -1px -1px 0 #404040, inset 1px 1px 0 #dfdfdf",
              padding: "6px",
            }}
          >

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
              <div
                className="win-sunken"
                style={{
                  backgroundColor: "#ffffff",
                  padding: "40px",
                  textAlign: "center",
                  fontFamily: "Tahoma, MS Sans Serif, sans-serif",
                }}
              >
                <Star className="w-8 h-8 mx-auto mb-3" style={{ color: "#c0c0c0" }} />
                <p style={{ fontSize: "12px", fontWeight: "bold", color: "#000" }}>No stocks in your watchlist yet.</p>
                <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>Click the ★ next to any ticker in the Dashboard to add it here.</p>
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
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontFamily: "Tahoma, MS Sans Serif, sans-serif" }}>
              {/* Status header */}
              <div className="win-panel" style={{ padding: "8px" }}>
                <div className="win-titlebar" style={{ marginBottom: "8px", padding: "2px 4px", fontSize: "11px" }}>
                  <span>Market Regime Analysis</span>
                  <span
                    style={{
                      backgroundColor: regime.status === "BULLISH" ? "#008000" : regime.status === "BEARISH" ? "#cc0000" : "#808080",
                      color: "#ffffff",
                      padding: "1px 8px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      border: "1px solid #000",
                    }}
                  >
                    {regime.status}
                  </span>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span>Regime Score</span>
                    <span style={{ fontFamily: "Courier New", fontWeight: "bold" }}>{regime.regimeScore}/6</span>
                  </div>
                  <div className="win-progress-track" style={{ height: "16px" }}>
                    <div
                      className={regime.status === "BULLISH" ? "win-progress-fill-long" : regime.status === "BEARISH" ? "win-progress-fill-short" : ""}
                      style={{ width: `${(regime.regimeScore / 6) * 100}%`, height: "100%", backgroundColor: regime.status === "NEUTRAL" ? "#808080" : undefined }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                    <span>SPY / SMA 200 Ratio</span>
                    <span style={{ fontFamily: "Courier New", fontWeight: "bold", color: regime.ratio >= 1 ? "#008000" : "#cc0000" }}>
                      {regime.ratio.toFixed(4)}
                    </span>
                  </div>
                  <div className="win-progress-track" style={{ height: "12px" }}>
                    <div
                      className={regime.ratio >= 1 ? "win-progress-fill-long" : "win-progress-fill-short"}
                      style={{ width: `${Math.min(regime.ratio * 50, 100)}%`, height: "100%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Key metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }} className="md:[grid-template-columns:repeat(3,1fr)]">
                {[
                  { label: "SPY Price", value: `$${regime.spyPrice.toFixed(2)}`, color: regime.ratio >= 1 ? "#008000" : "#cc0000" },
                  { label: "SMA 200", value: `$${regime.sma200.toFixed(2)}`, color: "#444" },
                  { label: "SMA 50", value: `$${regime.sma50.toFixed(2)}`, color: "#444" },
                  { label: "SPY RSI", value: regime.spyRsi.toFixed(1), color: regime.spyRsi > 70 ? "#cc0000" : regime.spyRsi < 30 ? "#008000" : "#000" },
                  { label: "VIX", value: regime.vix.toFixed(2), color: regime.vix > 25 ? "#cc0000" : "#008000" },
                  { label: "SPY − SMA200", value: `${((regime.spyPrice - regime.sma200) >= 0 ? "+" : "")}${(regime.spyPrice - regime.sma200).toFixed(2)}`, color: regime.spyPrice >= regime.sma200 ? "#008000" : "#cc0000" },
                ].map((m) => (
                  <div key={m.label} className="win-panel" style={{ padding: "6px", textAlign: "center" }}>
                    <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "Courier New", color: m.color }}>{m.value}</div>
                    <div style={{ fontSize: "9px", color: "#444", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Interpretation */}
              <div className="win-sunken" style={{ backgroundColor: "#fffbcc", padding: "8px", fontSize: "11px" }}>
                <span style={{ fontWeight: "bold" }}>Interpretation: </span>
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

          {/* ── Alerts ── */}
          <TabsContent value="alerts">
            <AlertsPanel stocks={stocks} />
          </TabsContent>
          </div>{/* end Win2K tab panel */}
        </Tabs>
      </main>

      {/* Detail Panel (slide-over — works across all tabs) */}
      {selectedStock && (
        <>
          <div className="fixed inset-0 z-20" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={() => setSelectedStock(null)} />
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
