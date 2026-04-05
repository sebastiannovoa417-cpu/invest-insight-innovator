import { differenceInCalendarDays, parseISO } from "date-fns";

export interface BacktestBar {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

export interface BacktestConfig {
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

export type TradeDirection = "LONG" | "SHORT";
export type BacktestSignal = TradeDirection | null;

export interface TradeResult {
  signalDate: string;
  entryDate: string;
  exitDate: string;
  dir: TradeDirection;
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  equityReturnPct: number;
  holdingBars: number;
  tradingDaysHeld: number;
  calendarDaysHeld: number;
}

export interface BacktestIssue {
  code: string;
  message: string;
}

export interface BacktestResult {
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
  issues: BacktestIssue[];
}

export interface MonteCarloResult {
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

interface OpenPosition {
  signalDate: string;
  entryDate: string;
  entryIdx: number;
  dir: TradeDirection;
  entry: number;
  quantity: number;
  equityAtEntry: number;
}

interface ExitResolution {
  rawExit: number;
  reason: "stop" | "target" | "eod";
}

const TRADE_BUCKETS = ["<-5%", "-5−2", "-2−0", "0−2", "2−5", "5−10", ">10%"];

export const STRATEGIES = [
  "MACD + EMA Cross",
  "RSI Mean Reversion",
  "Breakout + Volume",
  "Trend Follow SMA200",
  "Dual Momentum",
] as const;

function rollingMean(arr: number[], period: number): number[] {
  return arr.map((_, index) => {
    if (index < period - 1) return Number.NaN;
    const slice = arr.slice(index - period + 1, index + 1);
    return slice.reduce((sum, value) => sum + value, 0) / period;
  });
}

function computeRSI(closes: number[], period = 14): number[] {
  const result = new Array(closes.length).fill(Number.NaN);
  let avgGain = 0;
  let avgLoss = 0;

  for (let index = 1; index <= period && index < closes.length; index += 1) {
    const delta = closes[index] - closes[index - 1];
    if (delta > 0) avgGain += delta / period;
    else avgLoss += Math.abs(delta) / period;
  }

  if (period < closes.length) {
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
    for (let index = period + 1; index < closes.length; index += 1) {
      const delta = closes[index] - closes[index - 1];
      const gain = delta > 0 ? delta : 0;
      const loss = delta < 0 ? Math.abs(delta) : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rsNext = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[index] = 100 - 100 / (1 + rsNext);
    }
  }

  return result;
}

function computeEMA(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  const multiplier = 2 / (period + 1);
  const result = new Array(closes.length).fill(Number.NaN);
  let ema = closes[0];
  result[0] = ema;

  for (let index = 1; index < closes.length; index += 1) {
    ema = closes[index] * multiplier + ema * (1 - multiplier);
    result[index] = ema;
  }

  return result;
}

function computeMACD(closes: number[]): { macd: number[]; signal: number[] } {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine = closes.map((_, index) => {
    if (Number.isNaN(ema12[index]) || Number.isNaN(ema26[index])) return Number.NaN;
    return ema12[index] - ema26[index];
  });

  const validMacd = macdLine.filter((value) => !Number.isNaN(value));
  const signalRaw = computeEMA(validMacd, 9);
  const signal = new Array(closes.length).fill(Number.NaN);
  let validIndex = 0;

  for (let index = 0; index < closes.length; index += 1) {
    if (!Number.isNaN(macdLine[index])) {
      signal[index] = signalRaw[validIndex];
      validIndex += 1;
    }
  }

  return { macd: macdLine, signal };
}

export function getStrategyWarmupBars(strategy: string): number {
  if (strategy === "Trend Follow SMA200" || strategy === "Dual Momentum") return 205;
  if (strategy === "MACD + EMA Cross") return 40;
  if (strategy === "RSI Mean Reversion") return 18;
  return 25;
}

export function applySlippage(rawPrice: number, dir: TradeDirection, side: "entry" | "exit", bps: number): number {
  const slip = bps / 10000;
  if (dir === "LONG") {
    return side === "entry" ? rawPrice * (1 + slip) : rawPrice * (1 - slip);
  }
  return side === "entry" ? rawPrice * (1 - slip) : rawPrice * (1 + slip);
}

export function validateBacktestData(cfg: BacktestConfig, bars: BacktestBar[]): BacktestIssue[] {
  const issues: BacktestIssue[] = [];
  const requiredBars = getStrategyWarmupBars(cfg.strategy) + 2;

  if (bars.length < requiredBars) {
    issues.push({
      code: "insufficient-bars",
      message: `Need at least ${requiredBars} bars for ${cfg.strategy}. Loaded ${bars.length}.`,
    });
  }

  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index];
    const previous = bars[index - 1];
    const parsed = Number.parseInt(bar.date.split("-").join(""), 10);
    if (Number.isNaN(parsed)) {
      issues.push({ code: "invalid-date", message: `Invalid date at row ${index + 1}.` });
      break;
    }
    if (previous && bar.date <= previous.date) {
      issues.push({ code: "non-ascending-dates", message: "Price history must be strictly ascending by date." });
      break;
    }
    const invalidPrice = [bar.open, bar.high, bar.low, bar.close].some((value) => !Number.isFinite(value) || value <= 0);
    if (invalidPrice || bar.low > bar.high) {
      issues.push({ code: "invalid-ohlc", message: `Invalid OHLC data at ${bar.date}.` });
      break;
    }
  }

  if (cfg.strategy === "Breakout + Volume" && bars.some((bar) => bar.volume == null)) {
    issues.push({
      code: "missing-volume",
      message: "Breakout + Volume uses volume confirmation, but some bars have missing volume.",
    });
  }

  return dedupeIssues(issues);
}

export function buildStrategySignals(cfg: BacktestConfig, bars: BacktestBar[]): BacktestSignal[] {
  const signals: BacktestSignal[] = new Array(bars.length).fill(null);
  if (bars.length === 0) return signals;

  const closes = bars.map((bar) => bar.close);
  const highs = bars.map((bar) => bar.high);
  const lows = bars.map((bar) => bar.low);
  const volumes = bars.map((bar) => bar.volume ?? 0);
  const sma50 = rollingMean(closes, 50);
  const sma200 = rollingMean(closes, 200);
  const rsi14 = computeRSI(closes, 14);
  const { macd, signal: macdSignal } = computeMACD(closes);
  const volMa20 = rollingMean(volumes, 20);

  const lookbackStart = Math.max(0, bars.length - cfg.lookback);
  const signalStart = Math.max(lookbackStart, getStrategyWarmupBars(cfg.strategy));

  for (let index = signalStart; index < bars.length; index += 1) {
    let dir: TradeDirection | null = null;

    if (cfg.strategy === "MACD + EMA Cross") {
      const previous = Math.max(0, index - 1);
      if (![macd[index], macdSignal[index], macd[previous], macdSignal[previous]].some(Number.isNaN)) {
        if (macd[previous] < macdSignal[previous] && macd[index] > macdSignal[index]) dir = "LONG";
        else if (macd[previous] > macdSignal[previous] && macd[index] < macdSignal[index]) dir = "SHORT";
      }
    } else if (cfg.strategy === "RSI Mean Reversion") {
      if (!Number.isNaN(rsi14[index])) {
        if (rsi14[index] < 30) dir = "LONG";
        else if (rsi14[index] > 70) dir = "SHORT";
      }
    } else if (cfg.strategy === "Breakout + Volume") {
      if (index >= 21 && !Number.isNaN(volMa20[index])) {
        const hi20 = Math.max(...highs.slice(index - 20, index));
        const lo20 = Math.min(...lows.slice(index - 20, index));
        const volSpike = volumes[index] > volMa20[index] * 1.5;
        if (closes[index] > hi20 && volSpike) dir = "LONG";
        else if (closes[index] < lo20 && volSpike) dir = "SHORT";
      }
    } else if (cfg.strategy === "Trend Follow SMA200") {
      if (index > 0 && !Number.isNaN(sma200[index]) && !Number.isNaN(sma200[index - 1])) {
        if (closes[index - 1] < sma200[index - 1] && closes[index] > sma200[index]) dir = "LONG";
        else if (closes[index - 1] > sma200[index - 1] && closes[index] < sma200[index]) dir = "SHORT";
      }
    } else if (cfg.strategy === "Dual Momentum") {
      if (index > 0 && !Number.isNaN(sma50[index]) && !Number.isNaN(sma200[index])) {
        const wasAbove = !Number.isNaN(sma50[index - 1]) && sma50[index - 1] < sma200[index - 1];
        const nowAbove = sma50[index] > sma200[index];
        if (wasAbove && nowAbove && closes[index] > sma50[index]) dir = "LONG";
        else if (!wasAbove && !nowAbove && closes[index] < sma50[index]) dir = "SHORT";
      }
    }

    signals[index] = dir;
  }

  return signals;
}

export function resolveExitOnBar(
  bar: BacktestBar,
  dir: TradeDirection,
  stopPrice: number,
  targetPrice: number,
): ExitResolution | null {
  if (dir === "LONG") {
    if (bar.open <= stopPrice) return { rawExit: bar.open, reason: "stop" };
    if (bar.open >= targetPrice) return { rawExit: bar.open, reason: "target" };
    const stopTouched = bar.low <= stopPrice;
    const targetTouched = bar.high >= targetPrice;
    if (stopTouched && targetTouched) return { rawExit: stopPrice, reason: "stop" };
    if (stopTouched) return { rawExit: stopPrice, reason: "stop" };
    if (targetTouched) return { rawExit: targetPrice, reason: "target" };
    return null;
  }

  if (bar.open >= stopPrice) return { rawExit: bar.open, reason: "stop" };
  if (bar.open <= targetPrice) return { rawExit: bar.open, reason: "target" };
  const stopTouched = bar.high >= stopPrice;
  const targetTouched = bar.low <= targetPrice;
  if (stopTouched && targetTouched) return { rawExit: stopPrice, reason: "stop" };
  if (stopTouched) return { rawExit: stopPrice, reason: "stop" };
  if (targetTouched) return { rawExit: targetPrice, reason: "target" };
  return null;
}

export function runSignalBacktest(
  cfg: BacktestConfig,
  bars: BacktestBar[],
  signals: BacktestSignal[],
  baseIssues: BacktestIssue[] = [],
): BacktestResult {
  const issues = dedupeIssues(baseIssues);
  if (bars.length === 0) return emptyBacktestResult(cfg.capital, issues);

  let equity = cfg.capital;
  let peakEquity = cfg.capital;
  let maxDrawdown = 0;
  let totalDrawdown = 0;
  let drawdownCount = 0;
  const equityCurve = [{ t: 0, equity: cfg.capital }];
  const trades: TradeResult[] = [];
  const positionFraction = cfg.positionSize / 100;
  const stopMultiple = cfg.stopLoss / 100;
  const targetMultiple = cfg.takeProfit / 100;
  const feeRate = cfg.feeBpsPerSide / 10000;
  let openPosition: OpenPosition | null = null;

  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index];

    if (openPosition && index >= openPosition.entryIdx) {
      const stopPrice = openPosition.dir === "LONG"
        ? openPosition.entry * (1 - stopMultiple)
        : openPosition.entry * (1 + stopMultiple);
      const targetPrice = openPosition.dir === "LONG"
        ? openPosition.entry * (1 + targetMultiple)
        : openPosition.entry * (1 - targetMultiple);

      const resolution = resolveExitOnBar(bar, openPosition.dir, stopPrice, targetPrice);
      if (resolution) {
        const exitPrice = applySlippage(resolution.rawExit, openPosition.dir, "exit", cfg.slippageBps);
        const grossPnl = openPosition.dir === "LONG"
          ? openPosition.quantity * (exitPrice - openPosition.entry)
          : openPosition.quantity * (openPosition.entry - exitPrice);
        const entryFees = openPosition.quantity * openPosition.entry * feeRate;
        const exitFees = openPosition.quantity * exitPrice * feeRate;
        const pnl = grossPnl - entryFees - exitFees;
        const pnlPct = openPosition.dir === "LONG"
          ? ((exitPrice - openPosition.entry) / openPosition.entry) * 100
          : ((openPosition.entry - exitPrice) / openPosition.entry) * 100;
        const holdingBars = Math.max(1, index - openPosition.entryIdx + 1);
        const calendarDaysHeld = computeCalendarDaysHeld(openPosition.entryDate, bar.date);

        equity += pnl;
        equityCurve.push({ t: equityCurve.length, equity });
        if (equity > peakEquity) peakEquity = equity;
        const drawdown = peakEquity === 0 ? 0 : ((peakEquity - equity) / peakEquity) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        if (drawdown > 0) {
          totalDrawdown += drawdown;
          drawdownCount += 1;
        }

        trades.push({
          signalDate: openPosition.signalDate,
          entryDate: openPosition.entryDate,
          exitDate: bar.date,
          dir: openPosition.dir,
          entry: round2(openPosition.entry),
          exit: round2(exitPrice),
          pnl,
          pnlPct,
          equityReturnPct: openPosition.equityAtEntry === 0 ? 0 : (pnl / openPosition.equityAtEntry) * 100,
          holdingBars,
          tradingDaysHeld: holdingBars,
          calendarDaysHeld,
        });
        openPosition = null;
      }
    }

    if (!openPosition) {
      const dir = signals[index];
      if (dir && index + 1 < bars.length) {
        const nextBar = bars[index + 1];
        const entry = applySlippage(nextBar.open, dir, "entry", cfg.slippageBps);
        const allocatedCapital = equity * positionFraction;
        const quantity = entry > 0 ? allocatedCapital / entry : 0;
        if (quantity > 0) {
          openPosition = {
            signalDate: bar.date,
            entryDate: nextBar.date,
            entryIdx: index + 1,
            dir,
            entry,
            quantity,
            equityAtEntry: equity,
          };
        }
      }
    }
  }

  if (openPosition) {
    const lastBar = bars[bars.length - 1];
    const exitPrice = applySlippage(lastBar.close, openPosition.dir, "exit", cfg.slippageBps);
    const grossPnl = openPosition.dir === "LONG"
      ? openPosition.quantity * (exitPrice - openPosition.entry)
      : openPosition.quantity * (openPosition.entry - exitPrice);
    const entryFees = openPosition.quantity * openPosition.entry * feeRate;
    const exitFees = openPosition.quantity * exitPrice * feeRate;
    const pnl = grossPnl - entryFees - exitFees;
    const pnlPct = openPosition.dir === "LONG"
      ? ((exitPrice - openPosition.entry) / openPosition.entry) * 100
      : ((openPosition.entry - exitPrice) / openPosition.entry) * 100;
    const holdingBars = Math.max(1, bars.length - openPosition.entryIdx);

    equity += pnl;
    equityCurve.push({ t: equityCurve.length, equity });
    trades.push({
      signalDate: openPosition.signalDate,
      entryDate: openPosition.entryDate,
      exitDate: lastBar.date,
      dir: openPosition.dir,
      entry: round2(openPosition.entry),
      exit: round2(exitPrice),
      pnl,
      pnlPct,
      equityReturnPct: openPosition.equityAtEntry === 0 ? 0 : (pnl / openPosition.equityAtEntry) * 100,
      holdingBars,
      tradingDaysHeld: holdingBars,
      calendarDaysHeld: computeCalendarDaysHeld(openPosition.entryDate, lastBar.date),
    });
  }

  return summariseBacktest(trades, equityCurve, equity, cfg.capital, maxDrawdown, totalDrawdown, drawdownCount, issues);
}

export function runRealBacktest(cfg: BacktestConfig, bars: BacktestBar[]): BacktestResult {
  const issues = validateBacktestData(cfg, bars);
  const requiredBars = getStrategyWarmupBars(cfg.strategy) + 2;
  if (bars.length < requiredBars) return emptyBacktestResult(cfg.capital, issues);
  const signals = buildStrategySignals(cfg, bars);
  return runSignalBacktest(cfg, bars, signals, issues);
}

export function emptyBacktestResult(capital: number, issues: BacktestIssue[] = []): BacktestResult {
  return {
    netReturn: 0,
    winRate: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    totalTrades: 0,
    avgHoldDays: 0,
    sharpeRatio: 0,
    finalEquity: capital,
    avgDrawdown: 0,
    recoveryFactor: 0,
    equityCurve: [{ t: 0, equity: capital }],
    tradeDistribution: TRADE_BUCKETS.map((bucket) => ({ bucket, wins: 0, losses: 0 })),
    trades: [],
    issues,
  };
}

function summariseBacktest(
  trades: TradeResult[],
  equityCurve: { t: number; equity: number }[],
  equity: number,
  capital: number,
  maxDrawdown: number,
  totalDrawdown: number,
  drawdownCount: number,
  issues: BacktestIssue[],
): BacktestResult {
  if (trades.length === 0) return emptyBacktestResult(capital, issues);

  const wins = trades.filter((trade) => trade.pnl >= 0).length;
  const grossWin = trades.filter((trade) => trade.pnl > 0).reduce((sum, trade) => sum + trade.pnl, 0);
  const grossLoss = trades.filter((trade) => trade.pnl < 0).reduce((sum, trade) => sum + Math.abs(trade.pnl), 0);
  const winRate = (wins / trades.length) * 100;
  const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
  const netReturn = capital === 0 ? 0 : ((equity - capital) / capital) * 100;
  const avgHoldDays = Math.round(trades.reduce((sum, trade) => sum + trade.tradingDaysHeld, 0) / trades.length);
  const avgDrawdown = drawdownCount > 0 ? totalDrawdown / drawdownCount : 0;
  const recoveryFactor = maxDrawdown === 0 ? 0 : round2(netReturn / maxDrawdown);

  const returns = equityCurve.slice(1).map((point, index) => {
    const previous = equityCurve[index].equity;
    return previous === 0 ? 0 : (point.equity - previous) / previous;
  });
  const avgReturn = returns.reduce((sum, value) => sum + value, 0) / (returns.length || 1);
  const stdDev = Math.sqrt(returns.reduce((sum, value) => sum + (value - avgReturn) ** 2, 0) / (returns.length || 1));
  const sharpeRatio = stdDev === 0 ? 0 : round2((avgReturn / stdDev) * Math.sqrt(252));

  const tradeDistribution = TRADE_BUCKETS.map((bucket) => ({ bucket, wins: 0, losses: 0 }));
  for (const trade of trades) {
    const index = getTradeBucketIndex(trade.pnlPct);
    if (trade.pnl >= 0) tradeDistribution[index].wins += 1;
    else tradeDistribution[index].losses += 1;
  }

  return {
    netReturn,
    winRate,
    profitFactor: round2(profitFactor),
    maxDrawdown,
    totalTrades: trades.length,
    avgHoldDays,
    sharpeRatio,
    finalEquity: Math.round(equity),
    avgDrawdown,
    recoveryFactor,
    equityCurve,
    tradeDistribution,
    trades: trades.slice().reverse(),
    issues,
  };
}

export function runMonteCarloSimulation(
  trades: TradeResult[],
  capital: number,
  simCount = 500,
): MonteCarloResult | null {
  if (trades.length < 3) return null;

  const returnList = trades.map((trade) => trade.equityReturnPct / 100);
  const finalEquities: number[] = [];

  for (let simulation = 0; simulation < simCount; simulation += 1) {
    let equity = capital;
    for (let index = 0; index < returnList.length; index += 1) {
      const sample = returnList[Math.floor(Math.random() * returnList.length)];
      equity += equity * sample;
    }
    finalEquities.push(equity);
  }

  finalEquities.sort((left, right) => left - right);
  const count = finalEquities.length;
  const percentile = (value: number) => finalEquities[Math.min(count - 1, Math.floor(value * count))];

  return {
    p5: Math.round(percentile(0.05)),
    p25: Math.round(percentile(0.25)),
    median: Math.round(percentile(0.5)),
    p75: Math.round(percentile(0.75)),
    p95: Math.round(percentile(0.95)),
    mean: Math.round(finalEquities.reduce((sum, value) => sum + value, 0) / count),
    simulations: simCount,
    worstCase: Math.round(finalEquities[0]),
    bestCase: Math.round(finalEquities[count - 1]),
  };
}

export function computeBuyAndHold(bars: BacktestBar[], lookback: number): number {
  if (bars.length < 2) return 0;
  const startIndex = Math.max(0, bars.length - lookback);
  const startPrice = bars[startIndex].close;
  const endPrice = bars[bars.length - 1].close;
  return startPrice === 0 ? 0 : ((endPrice - startPrice) / startPrice) * 100;
}

function computeCalendarDaysHeld(entryDate: string, exitDate: string): number {
  return Math.max(1, differenceInCalendarDays(parseISO(exitDate), parseISO(entryDate)) + 1);
}

function getTradeBucketIndex(pnlPct: number): number {
  if (pnlPct < -5) return 0;
  if (pnlPct < -2) return 1;
  if (pnlPct < 0) return 2;
  if (pnlPct < 2) return 3;
  if (pnlPct < 5) return 4;
  if (pnlPct < 10) return 5;
  return 6;
}

function dedupeIssues(issues: BacktestIssue[]): BacktestIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}