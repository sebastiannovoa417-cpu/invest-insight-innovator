import type { BacktestBar, BacktestConfig, BacktestSignal } from "@/lib/backtest";

export const baseBacktestConfig: BacktestConfig = {
    ticker: "NVDA",
    strategy: "MACD + EMA Cross",
    lookback: 30,
    stopLoss: 5,
    takeProfit: 10,
    positionSize: 100,
    capital: 1000,
    slippageBps: 0,
    feeBpsPerSide: 0,
    walkForwardEnabled: false,
    walkForwardTrainBars: 120,
    walkForwardTestBars: 30,
    regimeFilterEnabled: false,
    regimeStatus: "NEUTRAL",
    avoidEarningsDays: 0,
    earningsDate: null,
    staleAfterDays: 10,
    referenceDate: "2026-01-31",
};

export function makeBar(date: string, open: number, high: number, low: number, close: number, volume = 1_000_000): BacktestBar {
    return {
        ticker: "NVDA",
        date,
        open,
        high,
        low,
        close,
        volume,
    };
}

export const longGapStopBars: BacktestBar[] = [
    makeBar("2026-01-05", 100, 101, 99, 100),
    makeBar("2026-01-06", 100, 102, 99, 101),
    makeBar("2026-01-07", 90, 92, 88, 89),
];

export const shortTakeProfitBars: BacktestBar[] = [
    makeBar("2026-02-02", 100, 101, 99, 100),
    makeBar("2026-02-03", 100, 101, 99, 100),
    makeBar("2026-02-04", 95, 96, 88, 90),
];

export const compoundingBars: BacktestBar[] = [
    makeBar("2026-01-05", 100, 101, 99, 100),
    makeBar("2026-01-06", 100, 101, 99, 100),
    makeBar("2026-01-07", 110, 111, 109, 110),
    makeBar("2026-01-08", 100, 101, 99, 100),
    makeBar("2026-01-09", 110, 111, 109, 110),
];

export const basicLongSignals: BacktestSignal[] = ["LONG", null, null];
export const compoundingSignals: BacktestSignal[] = ["LONG", null, "LONG", null, null];
export const shortSignals: BacktestSignal[] = ["SHORT", null, null];
