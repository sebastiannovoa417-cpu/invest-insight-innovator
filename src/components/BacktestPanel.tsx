import { useState, useMemo, useCallback, type CSSProperties } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";
import { usePriceHistory } from "@/hooks/use-price-history";
import {
  STRATEGIES,
  computeBuyAndHold,
  emptyBacktestResult,
  getStrategyWarmupBars,
  runMonteCarloSimulation,
  runRealBacktest,
  type BacktestConfig,
} from "@/lib/backtest";

// ─── Sub-components ───────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, format, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  format: (v: number) => string; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] tracking-wider">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-bold text-primary">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        aria-label={label}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full accent-primary cursor-pointer bg-border"
      />
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <div className={cn("text-xl font-bold font-mono", color ?? "text-foreground")}>{value}</div>
      <div className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{label}</div>
    </div>
  );
}

function DrawdownBar({ label, pct, max, color }: { label: string; pct: number; max: number; color: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr_52px] items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="h-2 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ "--bar-w": `${(pct / Math.max(max, 1)) * 100}%`, "--bar-c": color, width: "var(--bar-w)", background: "var(--bar-c)" } as CSSProperties} />
      </div>
      <span className="text-xs font-mono text-right" style={{ color }}>{pct.toFixed(1)}{label === "Recovery factor" ? "x" : "%"}</span>
    </div>
  );
}

function formatTradeDate(value: string): string {
  return value.slice(5).replace("-", "/");
}

function EquityTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-2 py-1 text-[11px] font-mono text-foreground">
      ${payload[0].value.toFixed(0)}
    </div>
  );
}

function DistTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-2 py-1 text-[11px] font-mono text-foreground space-y-0.5">
      <div className="text-muted-foreground">{label}</div>
      {payload.map(p => (
        <div key={p.name} className={p.name === "wins" ? "text-long" : "text-short"}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface BacktestPanelProps {
  stocks?: Stock[];
}

export function BacktestPanel({ stocks = [] }: BacktestPanelProps) {
  const availableTickers = useMemo(() => {
    return Array.from(new Set(stocks.map(s => s.ticker))).sort();
  }, [stocks]);

  const defaultTicker = availableTickers[0] ?? "NVDA";

  const [cfg, setCfg] = useState<BacktestConfig>({
    ticker: defaultTicker,
    strategy: "MACD + EMA Cross",
    lookback: 90,
    stopLoss: 5.5,
    takeProfit: 15,
    positionSize: 100,
    capital: 1000,
    slippageBps: 5,
    feeBpsPerSide: 2,
  });

  const set = useCallback(<K extends keyof BacktestConfig>(key: K, val: BacktestConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }));
  }, []);

  const { data: priceHistory = [], isLoading, isError } = usePriceHistory(cfg.ticker, cfg.lookback + 260);

  const result = useMemo(() => {
    if (priceHistory.length < 30) return emptyBacktestResult(cfg.capital);
    return runRealBacktest(cfg, priceHistory);
  }, [cfg, priceHistory]);

  const monteCarlo = useMemo(() => {
    if (result.trades.length < 3) return null;
    return runMonteCarloSimulation(result.trades, cfg.capital);
  }, [result.trades, cfg.capital]);

  const buyAndHoldReturn = useMemo(() => {
    if (priceHistory.length < 2) return null;
    return computeBuyAndHold(priceHistory, cfg.lookback);
  }, [priceHistory, cfg.lookback]);

  const warmupBars = useMemo(() => getStrategyWarmupBars(cfg.strategy), [cfg.strategy]);
  const requiredBars = warmupBars + 2;

  const ddMax = Math.max(result.maxDrawdown, result.avgDrawdown, Math.abs(result.recoveryFactor), 1);
  const hasData = priceHistory.length >= requiredBars;
  const validationIssues = result.issues;

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold tracking-[0.2em] text-primary">SWINGPULSE</span>
        <span className="text-[10px] text-muted-foreground tracking-widest">// BACKTEST ENGINE v2.1</span>
        {hasData && (
          <span className="ml-auto text-[9px] text-long tracking-wider">
            ● LIVE DATA ({priceHistory.length} bars)
          </span>
        )}
        {!hasData && !isLoading && (
          <span className="ml-auto text-[9px] text-muted-foreground tracking-wider">
            ○ NEED {requiredBars}+ BARS FOR {cfg.strategy.toUpperCase()}
          </span>
        )}
        {isLoading && (
          <span className="ml-auto text-[9px] text-muted-foreground tracking-wider animate-pulse">
            ● LOADING…
          </span>
        )}
      </div>

      {/* ── Config ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
          STRATEGY CONFIG
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] text-muted-foreground tracking-wider block mb-1.5">TICKER</label>
            <select
              title="Backtest ticker"
              value={cfg.ticker}
              onChange={e => set("ticker", e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {availableTickers.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground tracking-wider block mb-1.5">STRATEGY</label>
            <select
              title="Backtest strategy"
              value={cfg.strategy}
              onChange={e => set("strategy", e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
          <SliderRow label="LOOKBACK (DAYS)" value={cfg.lookback} min={10} max={250} step={5}
            format={v => String(v)} onChange={v => set("lookback", v)} />
          <SliderRow label="STOP LOSS %" value={cfg.stopLoss} min={1} max={20} step={0.5}
            format={v => v.toFixed(1)} onChange={v => set("stopLoss", v)} />
          <SliderRow label="TAKE PROFIT %" value={cfg.takeProfit} min={2} max={50} step={1}
            format={v => String(v)} onChange={v => set("takeProfit", v)} />
          <SliderRow label="POSITION SIZE %" value={cfg.positionSize} min={10} max={100} step={5}
            format={v => String(v)} onChange={v => set("positionSize", v)} />
          <SliderRow label="CAPITAL ($)" value={cfg.capital} min={500} max={50000} step={500}
            format={v => `$${v.toLocaleString()}`} onChange={v => set("capital", v)} />
          <SliderRow label="SLIPPAGE (BPS)" value={cfg.slippageBps} min={0} max={50} step={1}
            format={v => String(v)} onChange={v => set("slippageBps", v)} />
          <SliderRow label="FEE / SIDE (BPS)" value={cfg.feeBpsPerSide} min={0} max={25} step={1}
            format={v => String(v)} onChange={v => set("feeBpsPerSide", v)} />
        </div>
      </div>

      {/* ── Assumptions ── */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground mb-2">
          ASSUMPTIONS & LIMITS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <p>Signals are evaluated on bar close; entries are filled on the next bar open.</p>
          <p>Gap-through exits fill at the next open; same-bar stop/target conflicts use a pessimistic stop-first rule.</p>
          <p>Fees are applied on entry and exit ({cfg.feeBpsPerSide} bps per side).</p>
          <p>Position sizing compounds from current equity, not only starting capital.</p>
          <p>Warmup: {warmupBars} bars required for {cfg.strategy} indicator stability.</p>
          <p>Monte Carlo uses bootstrap resampling of historical trade returns.</p>
        </div>
      </div>

      {validationIssues.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
          <div className="text-[10px] font-bold tracking-[0.15em] mb-2">DATA QUALITY WARNINGS</div>
          <ul className="space-y-1.5 text-[11px] text-amber-100/90">
            {validationIssues.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>- {issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── No data notice ── */}
      {isError && (
        <div className="rounded-lg border border-short/30 bg-short/5 p-4 text-xs text-short">
          Failed to load price history. Ensure price_history table exists and SUPABASE_PRICES_URL is configured.
        </div>
      )}

      {/* ── Performance Metrics ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
          PERFORMANCE METRICS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="NET RETURN"
            value={result.totalTrades === 0 ? "—" : `${result.netReturn >= 0 ? "+" : ""}${result.netReturn.toFixed(1)}%`}
            color={result.netReturn >= 0 ? "text-long" : "text-short"} />
          <MetricCard label="WIN RATE"
            value={result.totalTrades === 0 ? "—" : `${result.winRate.toFixed(0)}%`}
            color={result.winRate >= 55 ? "text-primary" : result.winRate >= 45 ? "text-foreground" : "text-short"} />
          <MetricCard label="PROFIT FACTOR"
            value={result.totalTrades === 0 ? "—" : result.profitFactor.toFixed(2)}
            color={result.profitFactor >= 2 ? "text-long" : result.profitFactor >= 1 ? "text-foreground" : "text-short"} />
          <MetricCard label="MAX DRAWDOWN"
            value={result.totalTrades === 0 ? "—" : `-${result.maxDrawdown.toFixed(1)}%`}
            color="text-short" />
          <MetricCard label="TOTAL TRADES" value={result.totalTrades === 0 ? "—" : String(result.totalTrades)} />
          <MetricCard label="AVG HOLD (DAYS)" value={result.totalTrades === 0 ? "—" : `${result.avgHoldDays}d`} />
          <MetricCard label="SHARPE RATIO"
            value={result.totalTrades === 0 ? "—" : result.sharpeRatio.toFixed(2)}
            color={result.sharpeRatio >= 1 ? "text-long" : result.sharpeRatio >= 0.5 ? "text-primary" : "text-muted-foreground"} />
          <MetricCard label="FINAL EQUITY"
            value={`$${result.finalEquity.toLocaleString()}`}
            color={result.finalEquity >= cfg.capital ? "text-long" : "text-short"} />
          {buyAndHoldReturn !== null && (
            <MetricCard
              label="BUY & HOLD"
              value={result.totalTrades === 0 ? "—" : `${buyAndHoldReturn >= 0 ? "+" : ""}${buyAndHoldReturn.toFixed(1)}%`}
              color={buyAndHoldReturn >= 0 ? "text-long" : "text-short"}
            />
          )}
          {buyAndHoldReturn !== null && result.totalTrades > 0 && (
            <MetricCard
              label="ALPHA vs B&H"
              value={`${(result.netReturn - buyAndHoldReturn) >= 0 ? "+" : ""}${(result.netReturn - buyAndHoldReturn).toFixed(1)}%`}
              color={(result.netReturn - buyAndHoldReturn) >= 0 ? "text-primary" : "text-short"}
            />
          )}
        </div>
      </div>

      {/* ── Equity Curve ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground mb-1">
          EQUITY CURVE <span className="text-[9px] opacity-60">// cumulative P&L over {result.totalTrades} real trades</span>
        </div>
        <div className="h-52 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.equityCurve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis
                dataKey="t" tick={false}
                axisLine={false} tickLine={false}
                label={{ value: "START", position: "insideBottomLeft", offset: -4, style: { fontSize: 9, fill: "hsl(var(--muted-foreground))" } }}
              />
              <YAxis
                tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false} tickLine={false} width={44}
              />
              <ReferenceLine y={cfg.capital} stroke="hsl(var(--border))" strokeDasharray="4 4" />
              <Tooltip content={<EquityTooltip />} />
              <Area
                type="monotone" dataKey="equity"
                stroke="hsl(142 71% 45%)" strokeWidth={2}
                fill="url(#equityGrad)" dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="text-right text-[9px] text-muted-foreground -mt-1 pr-1">NOW</div>
        </div>
      </div>

      {/* ── Trade Distribution ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground mb-1">
          TRADE DISTRIBUTION <span className="text-[9px] opacity-60">// win vs loss spread</span>
        </div>
        <div className="h-44 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={result.tradeDistribution} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false} tickLine={false} width={20}
              />
              <Tooltip content={<DistTooltip />} />
              <Bar dataKey="losses" name="losses" stackId="a">
                {result.tradeDistribution.map((_, i) => (
                  <Cell key={i} fill="hsl(350 89% 60%)" fillOpacity={0.75} />
                ))}
              </Bar>
              <Bar dataKey="wins" name="wins" stackId="b">
                {result.tradeDistribution.map((_, i) => (
                  <Cell key={i} fill="hsl(142 71% 45%)" fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Drawdown Profile ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
          DRAWDOWN PROFILE
        </div>
        <div className="space-y-3">
          <DrawdownBar label="Max Drawdown" pct={result.maxDrawdown} max={ddMax} color="hsl(350 89% 60%)" />
          <DrawdownBar label="Avg Drawdown" pct={result.avgDrawdown} max={ddMax} color="hsl(30 95% 60%)" />
          <DrawdownBar label="Recovery factor" pct={Math.abs(result.recoveryFactor)} max={ddMax} color="hsl(45 95% 60%)" />
        </div>
      </div>

      {/* ── Monte Carlo Simulation ── */}
      {monteCarlo && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-1 flex items-center gap-2">
            <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
            MONTE CARLO ({monteCarlo.simulations.toLocaleString()} SIMULATIONS)
          </div>
          <p className="text-[10px] text-muted-foreground mb-4">
            Trade-level equity returns randomly resampled {monteCarlo.simulations}× — shows range of plausible outcomes.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="rounded border border-short/30 bg-short/5 p-2.5 text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">5th %ile (Worst)</div>
              <div className="text-sm font-mono font-bold text-short">${monteCarlo.p5.toLocaleString()}</div>
            </div>
            <div className="rounded border border-border p-2.5 text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">25th %ile</div>
              <div className="text-sm font-mono font-bold text-foreground">${monteCarlo.p25.toLocaleString()}</div>
            </div>
            <div className="rounded border border-primary/30 bg-primary/5 p-2.5 text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">Median</div>
              <div className="text-sm font-mono font-bold text-primary">${monteCarlo.median.toLocaleString()}</div>
            </div>
            <div className="rounded border border-border p-2.5 text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">75th %ile</div>
              <div className="text-sm font-mono font-bold text-foreground">${monteCarlo.p75.toLocaleString()}</div>
            </div>
            <div className="rounded border border-long/30 bg-long/5 p-2.5 text-center">
              <div className="text-[9px] text-muted-foreground mb-0.5">95th %ile (Best)</div>
              <div className="text-sm font-mono font-bold text-long">${monteCarlo.p95.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Mean outcome: <span className="font-mono text-foreground">${monteCarlo.mean.toLocaleString()}</span></span>
            <span>
              Range: <span className="text-short font-mono">${monteCarlo.worstCase.toLocaleString()}</span>
              {" → "}
              <span className="text-long font-mono">${monteCarlo.bestCase.toLocaleString()}</span>
            </span>
          </div>
        </div>
      )}

      {/* ── Trade Log ── */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary">
            TRADE LOG <span className="text-muted-foreground font-normal">(LAST {Math.min(result.trades.length, 12)} OF {result.totalTrades})</span>
          </span>
        </div>
        {result.totalTrades === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            {isLoading ? "Loading price history…" : "No trades generated for this config. Try adjusting the strategy or lookback window."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 text-[10px] text-muted-foreground tracking-wider">
                  <th className="px-4 py-2 text-left font-medium">SIGNAL</th>
                  <th className="px-4 py-2 text-left font-medium">DIR</th>
                  <th className="px-4 py-2 text-left font-medium">ENTRY DATE</th>
                  <th className="px-4 py-2 text-left font-medium">EXIT DATE</th>
                  <th className="px-4 py-2 text-left font-medium">ENTRY→EXIT</th>
                  <th className="px-4 py-2 text-right font-medium">P&L</th>
                  <th className="px-4 py-2 text-right font-medium">P&L %</th>
                  <th className="px-4 py-2 text-right font-medium">DAYS</th>
                </tr>
              </thead>
              <tbody>
                {result.trades.slice(0, 12).map((t, i) => (
                  <tr key={i} className="border-t border-border/40 hover:bg-card/80 transition-colors">
                    <td className="px-4 py-2 font-mono text-muted-foreground">{formatTradeDate(t.signalDate)}</td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider",
                        t.dir === "LONG" ? "bg-long/15 text-long" : "bg-short/15 text-short"
                      )}>
                        {t.dir}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{formatTradeDate(t.entryDate)}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">{formatTradeDate(t.exitDate)}</td>
                    <td className="px-4 py-2 font-mono text-muted-foreground">
                      ${t.entry.toFixed(2)} → ${t.exit.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-2 font-mono text-right font-semibold", t.pnl >= 0 ? "text-long" : "text-short")}>
                      {t.pnl >= 0 ? "+" : ""}${Math.round(t.pnl)}
                    </td>
                    <td className={cn("px-4 py-2 font-mono text-right", t.pnlPct >= 0 ? "text-long" : "text-short")}>
                      {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 font-mono text-right text-muted-foreground">{t.tradingDaysHeld}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
