import { describe, expect, it } from "vitest";

import {
  resolveExitOnBar,
  runSignalBacktest,
  type BacktestBar,
  type BacktestConfig,
  type BacktestSignal,
} from "@/lib/backtest";

const baseConfig: BacktestConfig = {
  ticker: "NVDA",
  strategy: "MACD + EMA Cross",
  lookback: 30,
  stopLoss: 5,
  takeProfit: 10,
  positionSize: 100,
  capital: 1000,
  slippageBps: 0,
  feeBpsPerSide: 0,
};

function makeBar(date: string, open: number, high: number, low: number, close: number, volume = 1_000_000): BacktestBar {
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

describe("backtest engine", () => {
  it("enters on the next bar instead of the signal bar", () => {
    const bars = [
      makeBar("2026-01-05", 100, 110, 95, 104),
      makeBar("2026-01-06", 101, 103, 100, 102),
      makeBar("2026-01-07", 102, 114, 101, 113),
    ];
    const signals: BacktestSignal[] = ["LONG", null, null];

    const result = runSignalBacktest(baseConfig, bars, signals);

    expect(result.totalTrades).toBe(1);
    expect(result.trades[0].signalDate).toBe("2026-01-05");
    expect(result.trades[0].entryDate).toBe("2026-01-06");
    expect(result.trades[0].exitDate).toBe("2026-01-07");
    expect(result.trades[0].entry).toBe(101);
  });

  it("fills a long stop at the bar open when price gaps through the stop", () => {
    const bars = [
      makeBar("2026-01-05", 100, 101, 99, 100),
      makeBar("2026-01-06", 100, 102, 99, 101),
      makeBar("2026-01-07", 90, 92, 88, 89),
    ];
    const signals: BacktestSignal[] = ["LONG", null, null];

    const result = runSignalBacktest(baseConfig, bars, signals);

    expect(result.totalTrades).toBe(1);
    expect(result.trades[0].exit).toBe(90);
    expect(result.trades[0].pnl).toBeCloseTo(-100);
    expect(result.trades[0].tradingDaysHeld).toBe(2);
    expect(result.trades[0].calendarDaysHeld).toBe(2);
  });

  it("uses a pessimistic stop-first policy when both stop and target are touched", () => {
    const resolution = resolveExitOnBar(
      makeBar("2026-01-06", 100, 112, 94, 105),
      "LONG",
      95,
      110,
    );

    expect(resolution).toEqual({ rawExit: 95, reason: "stop" });
  });

  it("tracks same-session exits as one trading day and one calendar day", () => {
    const bars = [
      makeBar("2026-01-05", 100, 101, 99, 100),
      makeBar("2026-01-06", 100, 112, 94, 108),
      makeBar("2026-01-07", 108, 109, 107, 108),
    ];
    const signals: BacktestSignal[] = ["LONG", null, null];

    const result = runSignalBacktest(baseConfig, bars, signals);

    expect(result.totalTrades).toBe(1);
    expect(result.trades[0].exitDate).toBe("2026-01-06");
    expect(result.trades[0].holdingBars).toBe(1);
    expect(result.trades[0].tradingDaysHeld).toBe(1);
    expect(result.trades[0].calendarDaysHeld).toBe(1);
  });

  it("compounds position size from updated equity between trades", () => {
    const bars = [
      makeBar("2026-01-05", 100, 101, 99, 100),
      makeBar("2026-01-06", 100, 101, 99, 100),
      makeBar("2026-01-07", 110, 111, 109, 110),
      makeBar("2026-01-08", 100, 101, 99, 100),
      makeBar("2026-01-09", 110, 111, 109, 110),
    ];
    const signals: BacktestSignal[] = ["LONG", null, "LONG", null, null];

    const result = runSignalBacktest(baseConfig, bars, signals);

    expect(result.totalTrades).toBe(2);
    expect(result.trades[0].pnl).toBeGreaterThan(result.trades[1].pnl);
    expect(result.finalEquity).toBe(1210);
  });
});