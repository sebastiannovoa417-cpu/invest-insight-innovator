import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";
import { usePriceHistory, type PriceBar } from "@/hooks/use-price-history";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BacktestConfig {
  ticker: string;
  strategy: string;
  lookback: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  capital: number;
  slippageBps: number;
  feeBpsPerSide: number;
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

interface MonteCarloResult {
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  mean: number;
  simulations: number;
  worstCase: number;
  bestCase: number;
}

// ─── Indicator helpers ────────────────────────────────────────────────────────

function rollingMean(arr: number[], period: number): number[] {
  return arr.map((_, i) => {
    if (i < period - 1) return NaN;
    const slice = arr.slice(i - period + 1, i + 1);
    return slice.reduce((s, v) => s + v, 0) / period;
  });
}

function computeRSI(closes: number[], period = 14): number[] {
  const result = new Array(closes.length).fill(NaN);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period && i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) avgGain += d / period;
    else avgLoss += Math.abs(d) / period;
  }
  if (period < closes.length) {
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
    for (let i = period + 1; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      const g = d > 0 ? d : 0;
      const l = d < 0 ? Math.abs(d) : 0;
      avgGain = (avgGain * (period - 1) + g) / period;
      avgLoss = (avgLoss * (period - 1) + l) / period;
      const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs2);
    }
  }
  return result;
}

function computeEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result = new Array(closes.length).fill(NaN);
  let ema = closes[0];
  result[0] = ema;
  for (let i = 1; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

function computeMACD(closes: number[]): { macd: number[]; signal: number[] } {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine = closes.map((_, i) =>
    isNaN(ema12[i]) || isNaN(ema26[i]) ? NaN : ema12[i] - ema26[i]
  );
  const validMacd = macdLine.filter(v => !isNaN(v));
  const signalRaw = computeEMA(validMacd, 9);
  const signal = new Array(closes.length).fill(NaN);
  let vi = 0;
  for (let i = 0; i < closes.length; i++) {
    if (!isNaN(macdLine[i])) { signal[i] = signalRaw[vi++]; }
  }
  return { macd: macdLine, signal };
}

// ─── Real signal-replay backtest engine ───────────────────────────────────────

const STRATEGIES = [
  "MACD + EMA Cross",
  "RSI Mean Reversion",
  "Breakout + Volume",
  "Trend Follow SMA200",
  "Dual Momentum",
];

function getStrategyWarmupBars(strategy: string): number {
  if (strategy === "Trend Follow SMA200" || strategy === "Dual Momentum") {
    return 205;
  }
  if (strategy === "MACD + EMA Cross") {
    return 40;
  }
  if (strategy === "RSI Mean Reversion") {
    return 18;
  }
  return 25;
}

function applySlippage(rawPrice: number, dir: "LONG" | "SHORT", side: "entry" | "exit", bps: number): number {
  const slip = bps / 10000;
  if (dir === "LONG") {
    return side === "entry" ? rawPrice * (1 + slip) : rawPrice * (1 - slip);
  }
  return side === "entry" ? rawPrice * (1 - slip) : rawPrice * (1 + slip);
}

function runRealBacktest(cfg: BacktestConfig, bars: PriceBar[]): BacktestResult {
  const warmupBars = getStrategyWarmupBars(cfg.strategy);
  if (bars.length < warmupBars + 2) return emptyResult(cfg.capital);

  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);
  const volumes = bars.map(b => b.volume ?? 0);

  // Pre-compute indicators for all bars
  const sma50 = rollingMean(closes, 50);
  const sma200 = rollingMean(closes, 200);
  const rsi14 = computeRSI(closes, 14);
  const { macd, signal: macdSignal } = computeMACD(closes);
  const volMa20 = rollingMean(volumes, 20);

  const lookbackStart = Math.max(0, bars.length - cfg.lookback);
  const signalStart = Math.max(lookbackStart, warmupBars);
  let equity = cfg.capital;
  const equityCurve: { t: number; equity: number }[] = [{ t: 0, equity: cfg.capital }];
  const trades: TradeResult[] = [];
  let peakEquity = equity;
  let maxDD = 0;
  let totalDD = 0;
  let ddCount = 0;
  let openPos: { dir: "LONG" | "SHORT"; entry: number; entryIdx: number } | null = null;

  const stopMult = cfg.stopLoss / 100;
  const tpMult = cfg.takeProfit / 100;
  const posSize = (cfg.positionSize / 100) * cfg.capital;
  const feeRatePerSide = cfg.feeBpsPerSide / 10000;

  for (let i = signalStart; i < bars.length; i++) {
    const price = closes[i];

    // ── Check exit conditions if in a position ──────────────────────────────
    if (openPos) {
      const { dir, entry, entryIdx } = openPos;
      const stopHit = dir === "LONG"
        ? lows[i] <= entry * (1 - stopMult)
        : highs[i] >= entry * (1 + stopMult);
      const tpHit = dir === "LONG"
        ? highs[i] >= entry * (1 + tpMult)
        : lows[i] <= entry * (1 - tpMult);

      if (stopHit || tpHit) {
        const rawExit = stopHit
          ? (dir === "LONG" ? entry * (1 - stopMult) : entry * (1 + stopMult))
          : (dir === "LONG" ? entry * (1 + tpMult) : entry * (1 - tpMult));
        const exitPrice = applySlippage(rawExit, dir, "exit", cfg.slippageBps);
        const pnlPct = dir === "LONG"
          ? ((exitPrice - entry) / entry) * 100
          : ((entry - exitPrice) / entry) * 100;
        const grossPnl = posSize * (pnlPct / 100);
        const fees = posSize * feeRatePerSide * 2;
        const pnl = grossPnl - fees;
        equity += pnl;
        equityCurve.push({ t: equityCurve.length, equity });

        if (equity > peakEquity) peakEquity = equity;
        const dd = ((peakEquity - equity) / peakEquity) * 100;
        if (dd > maxDD) maxDD = dd;
        if (dd > 0) { totalDD += dd; ddCount++; }

        const bar = bars[i];
        trades.push({
          date: bar.date.slice(5).replace("-", "/"),
          dir,
          entry: Math.round(entry * 100) / 100,
          exit: Math.round(exitPrice * 100) / 100,
          pnl,
          pnlPct,
          days: i - entryIdx,
        });
        openPos = null;
      }
    }

    // ── Check entry signals if flat ─────────────────────────────────────────
    if (!openPos) {
      let dir: "LONG" | "SHORT" | null = null;

      if (cfg.strategy === "MACD + EMA Cross") {
        const prev = i > 0 ? i - 1 : 0;
        if (!isNaN(macd[i]) && !isNaN(macdSignal[i]) && !isNaN(macd[prev]) && !isNaN(macdSignal[prev])) {
          if (macd[prev] < macdSignal[prev] && macd[i] > macdSignal[i]) dir = "LONG";
          else if (macd[prev] > macdSignal[prev] && macd[i] < macdSignal[i]) dir = "SHORT";
        }

      } else if (cfg.strategy === "RSI Mean Reversion") {
        if (!isNaN(rsi14[i])) {
          if (rsi14[i] < 30) dir = "LONG";
          else if (rsi14[i] > 70) dir = "SHORT";
        }

      } else if (cfg.strategy === "Breakout + Volume") {
        if (i >= 21 && !isNaN(volMa20[i])) {
          const hi20 = Math.max(...highs.slice(i - 20, i));
          const lo20 = Math.min(...lows.slice(i - 20, i));
          const volSpike = volumes[i] > volMa20[i] * 1.5;
          if (price > hi20 && volSpike) dir = "LONG";
          else if (price < lo20 && volSpike) dir = "SHORT";
        }

      } else if (cfg.strategy === "Trend Follow SMA200") {
        if (!isNaN(sma200[i]) && !isNaN(sma200[i - 1])) {
          if (closes[i - 1] < sma200[i - 1] && price > sma200[i]) dir = "LONG";
          else if (closes[i - 1] > sma200[i - 1] && price < sma200[i]) dir = "SHORT";
        }

      } else if (cfg.strategy === "Dual Momentum") {
        if (!isNaN(sma50[i]) && !isNaN(sma200[i])) {
          const wasAbove = !isNaN(sma50[i - 1]) && sma50[i - 1] < sma200[i - 1];
          const nowAbove = sma50[i] > sma200[i];
          if (wasAbove && nowAbove && price > sma50[i]) dir = "LONG";
          else if (!wasAbove && !nowAbove && price < sma50[i]) dir = "SHORT";
        }
      }

      if (dir && i + 1 < bars.length) {
        const nextOpen = bars[i + 1].open;
        const entry = applySlippage(nextOpen, dir, "entry", cfg.slippageBps);
        openPos = { dir, entry, entryIdx: i + 1 };
      }
    }
  }

  // Close any open position at last bar price
  if (openPos) {
    const { dir, entry, entryIdx } = openPos;
    const exitPrice = applySlippage(closes[bars.length - 1], dir, "exit", cfg.slippageBps);
    const pnlPct = dir === "LONG"
      ? ((exitPrice - entry) / entry) * 100
      : ((entry - exitPrice) / entry) * 100;
    const grossPnl = posSize * (pnlPct / 100);
    const fees = posSize * feeRatePerSide * 2;
    const pnl = grossPnl - fees;
    equity += pnl;
    equityCurve.push({ t: equityCurve.length, equity });
    trades.push({
      date: bars[bars.length - 1].date.slice(5).replace("-", "/"),
      dir,
      entry: Math.round(entry * 100) / 100,
      exit: Math.round(exitPrice * 100) / 100,
      pnl,
      pnlPct,
      days: bars.length - 1 - entryIdx,
    });
  }

  return summarise(trades, equityCurve, equity, cfg.capital, maxDD, totalDD, ddCount);
}

function emptyResult(capital: number): BacktestResult {
  return {
    netReturn: 0, winRate: 0, profitFactor: 0, maxDrawdown: 0,
    totalTrades: 0, avgHoldDays: 0, sharpeRatio: 0, finalEquity: capital,
    avgDrawdown: 0, recoveryFactor: 0,
    equityCurve: [{ t: 0, equity: capital }],
    tradeDistribution: ["<-5%", "-5−2", "-2−0", "0−2", "2−5", "5−10", ">10%"].map(b => ({ bucket: b, wins: 0, losses: 0 })),
    trades: [],
  };
}

function summarise(
  trades: TradeResult[],
  equityCurve: { t: number; equity: number }[],
  equity: number,
  capital: number,
  maxDD: number,
  totalDD: number,
  ddCount: number
): BacktestResult {
  if (trades.length === 0) return emptyResult(capital);

  const wins = trades.filter(t => t.pnl >= 0).length;
  const grossWin = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = trades.filter(t => t.pnl < 0).reduce((s, t) => s + Math.abs(t.pnl), 0);
  const winRate = (wins / trades.length) * 100;
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const netReturn = ((equity - capital) / capital) * 100;
  const avgHoldDays = Math.round(trades.reduce((s, t) => s + t.days, 0) / trades.length);
  const avgDD = ddCount > 0 ? totalDD / ddCount : 0;
  const recoveryFactor = maxDD === 0 ? 0 : Math.round((netReturn / maxDD) * 100) / 100;

  const returns = equityCurve.slice(1).map((p, i) => (p.equity - equityCurve[i].equity) / equityCurve[i].equity);
  const avgRet = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const stdRet = Math.sqrt(returns.reduce((s, r) => s + (r - avgRet) ** 2, 0) / (returns.length || 1));
  const sharpe = stdRet === 0 ? 0 : Math.round(((avgRet / stdRet) * Math.sqrt(252)) * 100) / 100;

  const buckets = ["<-5%", "-5−2", "-2−0", "0−2", "2−5", "5−10", ">10%"];
  const dist = buckets.map(b => ({ bucket: b, wins: 0, losses: 0 }));
  trades.forEach(t => {
    const p = t.pnlPct;
    const idx = p < -5 ? 0 : p < -2 ? 1 : p < 0 ? 2 : p < 2 ? 3 : p < 5 ? 4 : p < 10 ? 5 : 6;
    if (t.pnl >= 0) dist[idx].wins += 1; else dist[idx].losses += 1;
  });

  return {
    netReturn,
    winRate,
    profitFactor: Math.round(profitFactor * 100) / 100,
    maxDrawdown: maxDD,
    totalTrades: trades.length,
    avgHoldDays,
    sharpeRatio: sharpe,
    finalEquity: Math.round(equity),
    avgDrawdown: avgDD,
    recoveryFactor,
    equityCurve,
    tradeDistribution: dist,
    trades: trades.slice().reverse(),
  };
}

// ─── Monte Carlo simulation ───────────────────────────────────────────────────

function runMonteCarloSimulation(
  trades: TradeResult[],
  capital: number,
  positionSize: number,
  simCount = 500
): MonteCarloResult | null {
  if (trades.length < 3) return null;

  const returnList = trades.map(t => t.pnlPct / 100);
  const positionFraction = positionSize / 100;
  const finalEquities: number[] = [];

  for (let s = 0; s < simCount; s++) {
    // Bootstrap sampled path (with replacement) gives distributional uncertainty.
    let eq = capital;
    for (let i = 0; i < returnList.length; i++) {
      const sample = returnList[Math.floor(Math.random() * returnList.length)];
      const pnl = eq * positionFraction * sample;
      eq += pnl;
    }
    finalEquities.push(eq);
  }

  finalEquities.sort((a, b) => a - b);
  const n = finalEquities.length;
  const pct = (p: number) => finalEquities[Math.floor(p * n)];

  return {
    p5: Math.round(pct(0.05)),
    p25: Math.round(pct(0.25)),
    median: Math.round(pct(0.5)),
    p75: Math.round(pct(0.75)),
    p95: Math.round(pct(0.95)),
    mean: Math.round(finalEquities.reduce((a, b) => a + b, 0) / n),
    simulations: simCount,
    worstCase: Math.round(finalEquities[0]),
    bestCase: Math.round(finalEquities[n - 1]),
  };
}

// ─── Buy-and-hold return ──────────────────────────────────────────────────────

function computeBuyAndHold(bars: PriceBar[], lookback: number): number {
  if (bars.length < 2) return 0;
  const startIdx = Math.max(0, bars.length - lookback);
  const startPrice = bars[startIdx].close;
  const endPrice = bars[bars.length - 1].close;
  return ((endPrice - startPrice) / startPrice) * 100;
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
        <div className="h-full rounded-full transition-all" style={{ "--bar-w": `${(pct / Math.max(max, 1)) * 100}%`, "--bar-c": color, width: "var(--bar-w)", background: "var(--bar-c)" } as React.CSSProperties} />
      </div>
      <span className="text-xs font-mono text-right" style={{ color }}>{pct.toFixed(1)}{label === "Recovery factor" ? "x" : "%"}</span>
    </div>
  );
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
    if (priceHistory.length < 30) return emptyResult(cfg.capital);
    return runRealBacktest(cfg, priceHistory);
  }, [cfg, priceHistory]);

  const monteCarlo = useMemo(() => {
    if (result.trades.length < 3) return null;
    return runMonteCarloSimulation(result.trades, cfg.capital, cfg.positionSize);
  }, [result.trades, cfg.capital, cfg.positionSize]);

  const buyAndHoldReturn = useMemo(() => {
    if (priceHistory.length < 2) return null;
    return computeBuyAndHold(priceHistory, cfg.lookback);
  }, [priceHistory, cfg.lookback]);

  const warmupBars = useMemo(() => getStrategyWarmupBars(cfg.strategy), [cfg.strategy]);
  const requiredBars = warmupBars + 2;

  const ddMax = Math.max(result.maxDrawdown, result.avgDrawdown, Math.abs(result.recoveryFactor), 1);
  const hasData = priceHistory.length >= requiredBars;

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
          <p>Exits trigger intrabar at stop/target with adverse slippage ({cfg.slippageBps} bps each side).</p>
          <p>Fees are applied on entry and exit ({cfg.feeBpsPerSide} bps per side).</p>
          <p>Single-position engine: one trade at a time; no portfolio concurrency yet.</p>
          <p>Warmup: {warmupBars} bars required for {cfg.strategy} indicator stability.</p>
          <p>Monte Carlo uses bootstrap resampling of historical trade returns.</p>
        </div>
      </div>

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
            Trade sequence randomly shuffled {monteCarlo.simulations}× — shows range of plausible outcomes.
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
                  <tr key={i} className="border-t border-border/40 hover:bg-card/80 transition-colors">
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
        )}
      </div>

    </div>
  );
}
