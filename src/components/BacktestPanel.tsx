import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BacktestConfig {
  ticker: string;
  strategy: string;
  lookback: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  capital: number;
  maxConcurrent: number;
}

interface TradeResult {
  date: string;
  dir: "LONG" | "SHORT";
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  days: number;
}

interface BacktestResult {
  netReturn: number;
  winRate: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
  avgHoldDays: number;
  sharpeRatio: number;
  finalEquity: number;
  avgDrawdown: number;
  recoveryFactor: number;
  equityCurve: { t: number; equity: number }[];
  tradeDistribution: { bucket: string; wins: number; losses: number }[];
  trades: TradeResult[];
}

// ─── Mock backtest engine ──────────────────────────────────────────────────────

const STRATEGIES = [
  "MACD + EMA Cross",
  "RSI Mean Reversion",
  "Breakout + Volume",
  "Trend Follow SMA200",
  "Dual Momentum",
];

const TICKERS = [
  "SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META",
  "GOOGL", "AMD", "SOFI", "NIO", "PLUG", "PLTR", "MARA",
  "COIN", "RBLX", "RIVN", "LCID", "UPST",
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function runBacktest(cfg: BacktestConfig): BacktestResult {
  const seed = cfg.ticker.charCodeAt(0) * 31 +
    cfg.strategy.length * 17 +
    cfg.lookback +
    Math.round(cfg.stopLoss * 10) +
    Math.round(cfg.takeProfit * 10);
  const rand = seededRand(seed);

  const isRSI = cfg.strategy.includes("RSI");
  const isTrend = cfg.strategy.includes("SMA200") || cfg.strategy.includes("Trend");
  const baseWinRate = isRSI ? 0.52 + rand() * 0.12 : isTrend ? 0.44 + rand() * 0.14 : 0.48 + rand() * 0.10;

  const numTrades = Math.max(4, Math.round(6 + rand() * (cfg.lookback / 10)));
  const trades: TradeResult[] = [];

  const now = new Date(2026, 2, 21);
  let equity = cfg.capital;
  const equityCurve: { t: number; equity: number }[] = [{ t: 0, equity: cfg.capital }];

  let wins = 0;
  let grossWin = 0;
  let grossLoss = 0;
  let peakEquity = equity;
  let maxDD = 0;
  let totalDD = 0;
  let ddCount = 0;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = 0; i < numTrades; i++) {
    const isWin = rand() < baseWinRate;
    const dir: "LONG" | "SHORT" = rand() < 0.55 ? "LONG" : "SHORT";
    const holdDays = Math.round(3 + rand() * 20);
    const entryPrice = 150 + rand() * 300;
    const pnlPct = isWin
      ? (cfg.takeProfit * 0.5 + rand() * cfg.takeProfit * 0.8)
      : -(cfg.stopLoss * 0.6 + rand() * cfg.stopLoss * 0.7);
    const posValue = equity * (cfg.positionSize / 100) / Math.min(numTrades, cfg.maxConcurrent);
    const pnl = posValue * (pnlPct / 100);
    const exitPrice = dir === "LONG" ? entryPrice * (1 + pnlPct / 100) : entryPrice * (1 - pnlPct / 100);

    const d = new Date(now);
    d.setDate(d.getDate() - Math.round((numTrades - i) * (cfg.lookback / numTrades)));
    const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;

    trades.push({ date: dateStr, dir, entry: entryPrice, exit: exitPrice, pnl, pnlPct, days: holdDays });

    equity += pnl;
    equityCurve.push({ t: i + 1, equity: Math.max(equity, cfg.capital * 0.1) });

    if (equity > peakEquity) peakEquity = equity;
    const dd = ((peakEquity - equity) / peakEquity) * 100;
    if (dd > maxDD) maxDD = dd;
    if (dd > 0) { totalDD += dd; ddCount++; }

    if (isWin) { wins++; grossWin += pnl; } else { grossLoss += Math.abs(pnl); }
  }

  const winRate = wins / numTrades;
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const netReturn = ((equity - cfg.capital) / cfg.capital) * 100;

  const avgHoldDays = Math.round(trades.reduce((s, t) => s + t.days, 0) / numTrades);
  const avgDD = ddCount > 0 ? totalDD / ddCount : 0;
  const recoveryFactor = maxDD === 0 ? 0 : netReturn / maxDD;

  // Sharpe: simplified daily return / std
  const returns = equityCurve.slice(1).map((p, i) => (p.equity - equityCurve[i].equity) / equityCurve[i].equity);
  const avgRet = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdRet = Math.sqrt(returns.reduce((s, r) => s + (r - avgRet) ** 2, 0) / returns.length);
  const sharpe = stdRet === 0 ? 0 : (avgRet / stdRet) * Math.sqrt(252);

  // Distribution buckets
  const buckets = ["<-5%", "-5-2", "-2-0", "0-2", "2-5", "5-10", ">10%"];
  const dist = buckets.map(b => ({ bucket: b, wins: 0, losses: 0 }));
  trades.forEach(t => {
    const p = t.pnlPct;
    const idx = p < -5 ? 0 : p < -2 ? 1 : p < 0 ? 2 : p < 2 ? 3 : p < 5 ? 4 : p < 10 ? 5 : 6;
    if (t.pnl >= 0) dist[idx].wins += 1; else dist[idx].losses += 1;
  });

  return {
    netReturn,
    winRate: winRate * 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdown: maxDD,
    totalTrades: numTrades,
    avgHoldDays,
    sharpeRatio: Math.round(Math.abs(sharpe) * 100) / 100,
    finalEquity: Math.round(equity),
    avgDrawdown: avgDD,
    recoveryFactor: Math.round(recoveryFactor * 100) / 100,
    equityCurve,
    tradeDistribution: dist,
    trades: trades.slice().reverse(),
  };
}

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
        <div className="h-full rounded-full transition-all" style={{ width: `${(pct / max) * 100}%`, background: color }} />
      </div>
      <span className="text-xs font-mono text-right" style={{ color }}>{pct.toFixed(1)}{label === "Recovery factor" ? "x" : "%"}</span>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

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
    const fromStocks = stocks.map(s => s.ticker);
    return Array.from(new Set([...fromStocks, ...TICKERS])).sort();
  }, [stocks]);

  const [cfg, setCfg] = useState<BacktestConfig>({
    ticker: "SPY",
    strategy: "MACD + EMA Cross",
    lookback: 50,
    stopLoss: 5.5,
    takeProfit: 15,
    positionSize: 100,
    capital: 1000,
    maxConcurrent: 5,
  });

  const result = useMemo(() => runBacktest(cfg), [cfg]);

  const set = useCallback(<K extends keyof BacktestConfig>(key: K, val: BacktestConfig[K]) => {
    setCfg(prev => ({ ...prev, [key]: val }));
  }, []);

  const ddMax = Math.max(result.maxDrawdown, result.avgDrawdown, result.recoveryFactor, 1);

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold tracking-[0.2em] text-primary">SWINGPULSE</span>
        <span className="text-[10px] text-muted-foreground tracking-widest">// BACKTEST PLANNER v1.0</span>
      </div>

      {/* ── Config ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
          STRATEGY CONFIG
        </div>

        {/* Ticker + Strategy selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-[10px] text-muted-foreground tracking-wider block mb-1.5">TICKER</label>
            <select
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
              value={cfg.strategy}
              onChange={e => set("strategy", e.target.value)}
              className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              {STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Sliders — row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
          <SliderRow label="LOOKBACK (DAYS)" value={cfg.lookback} min={10} max={200} step={5}
            format={v => String(v)} onChange={v => set("lookback", v)} />
          <SliderRow label="STOP LOSS %" value={cfg.stopLoss} min={1} max={20} step={0.5}
            format={v => v.toFixed(1)} onChange={v => set("stopLoss", v)} />
          <SliderRow label="TAKE PROFIT %" value={cfg.takeProfit} min={2} max={50} step={1}
            format={v => String(v)} onChange={v => set("takeProfit", v)} />
          <SliderRow label="POSITION SIZE %" value={cfg.positionSize} min={10} max={100} step={5}
            format={v => String(v)} onChange={v => set("positionSize", v)} />
          <SliderRow label="CAPITAL ($)" value={cfg.capital} min={500} max={50000} step={500}
            format={v => `$${v.toLocaleString()}`} onChange={v => set("capital", v)} />
          <SliderRow label="MAX CONCURRENT" value={cfg.maxConcurrent} min={1} max={10} step={1}
            format={v => String(v)} onChange={v => set("maxConcurrent", v)} />
        </div>
      </div>

      {/* ── Performance Metrics ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-primary mb-4 flex items-center gap-2">
          <span className="w-1 h-3 bg-primary rounded-sm inline-block" />
          PERFORMANCE METRICS
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="NET RETURN"
            value={`${result.netReturn >= 0 ? "+" : ""}${result.netReturn.toFixed(1)}%`}
            color={result.netReturn >= 0 ? "text-long" : "text-short"} />
          <MetricCard label="WIN RATE"
            value={`${result.winRate.toFixed(0)}%`}
            color={result.winRate >= 55 ? "text-primary" : result.winRate >= 45 ? "text-foreground" : "text-short"} />
          <MetricCard label="PROFIT FACTOR"
            value={result.profitFactor.toFixed(2)}
            color={result.profitFactor >= 2 ? "text-long" : result.profitFactor >= 1 ? "text-foreground" : "text-short"} />
          <MetricCard label="MAX DRAWDOWN"
            value={`-${result.maxDrawdown.toFixed(1)}%`}
            color="text-short" />
          <MetricCard label="TOTAL TRADES" value={String(result.totalTrades)} />
          <MetricCard label="AVG HOLD (DAYS)" value={`${result.avgHoldDays}d`} />
          <MetricCard label="SHARPE RATIO"
            value={result.sharpeRatio.toFixed(2)}
            color={result.sharpeRatio >= 1 ? "text-long" : result.sharpeRatio >= 0.5 ? "text-primary" : "text-muted-foreground"} />
          <MetricCard label="FINAL EQUITY"
            value={`$${result.finalEquity.toLocaleString()}`}
            color={result.finalEquity >= cfg.capital ? "text-long" : "text-short"} />
        </div>
      </div>

      {/* ── Equity Curve ── */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground mb-1">
          EQUITY CURVE <span className="text-[9px] opacity-60">// cumulative P&L</span>
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
          <DrawdownBar label="Recovery factor" pct={result.recoveryFactor} max={ddMax} color="hsl(45 95% 60%)" />
        </div>
      </div>

      {/* ── Trade Log ── */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-[10px] font-bold tracking-[0.15em] text-primary">
            TRADE LOG <span className="text-muted-foreground font-normal">(LAST {Math.min(result.trades.length, 12)})</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 text-[10px] text-muted-foreground tracking-wider">
                <th className="px-4 py-2 text-left font-medium">DATE</th>
                <th className="px-4 py-2 text-left font-medium">DIR</th>
                <th className="px-4 py-2 text-left font-medium">ENTRY→EXIT</th>
                <th className="px-4 py-2 text-right font-medium">P&L</th>
                <th className="px-4 py-2 text-right font-medium">P&L %</th>
                <th className="px-4 py-2 text-right font-medium">DAYS</th>
              </tr>
            </thead>
            <tbody>
              {result.trades.slice(0, 12).map((t, i) => (
                <tr
                  key={i}
                  className="border-t border-border/40 hover:bg-card/80 transition-colors"
                >
                  <td className="px-4 py-2 font-mono text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider",
                      t.dir === "LONG" ? "bg-long/15 text-long" : "bg-short/15 text-short"
                    )}>
                      {t.dir}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">
                    ${t.entry.toFixed(2)} → ${t.exit.toFixed(2)}
                  </td>
                  <td className={cn("px-4 py-2 font-mono text-right font-semibold", t.pnl >= 0 ? "text-long" : "text-short")}>
                    {t.pnl >= 0 ? "+" : ""}${Math.round(t.pnl)}
                  </td>
                  <td className={cn("px-4 py-2 font-mono text-right", t.pnlPct >= 0 ? "text-long" : "text-short")}>
                    {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 font-mono text-right text-muted-foreground">{t.days}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
