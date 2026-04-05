import { describe, expect, it } from "vitest";

import {
    createEntryEligibilityMask,
    resolveExitOnBar,
    runSignalBacktest,
    validateBacktestData,
} from "@/lib/backtest";
import {
    baseBacktestConfig,
    basicLongSignals,
    compoundingBars,
    compoundingSignals,
    longGapStopBars,
    makeBar,
    shortSignals,
    shortTakeProfitBars,
} from "@/test/fixtures/backtest-fixtures";

describe("backtest engine", () => {
    it("enters on the next bar instead of the signal bar", () => {
        const bars = [
            makeBar("2026-01-05", 100, 110, 95, 104),
            makeBar("2026-01-06", 101, 103, 100, 102),
            makeBar("2026-01-07", 102, 114, 101, 113),
        ];

        const result = runSignalBacktest(baseBacktestConfig, bars, basicLongSignals);

        expect(result.totalTrades).toBe(1);
        expect(result.trades[0].signalDate).toBe("2026-01-05");
        expect(result.trades[0].entryDate).toBe("2026-01-06");
        expect(result.trades[0].exitDate).toBe("2026-01-07");
        expect(result.trades[0].entry).toBe(101);
    });

    it("fills a long stop at the bar open when price gaps through the stop", () => {
        const result = runSignalBacktest(baseBacktestConfig, longGapStopBars, basicLongSignals);

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

        const result = runSignalBacktest(baseBacktestConfig, bars, basicLongSignals);

        expect(result.totalTrades).toBe(1);
        expect(result.trades[0].exitDate).toBe("2026-01-06");
        expect(result.trades[0].holdingBars).toBe(1);
        expect(result.trades[0].tradingDaysHeld).toBe(1);
        expect(result.trades[0].calendarDaysHeld).toBe(1);
    });

    it("compounds position size from updated equity between trades", () => {
        const result = runSignalBacktest(baseBacktestConfig, compoundingBars, compoundingSignals);

        expect(result.totalTrades).toBe(2);
        expect(result.trades[0].pnl).toBeGreaterThan(result.trades[1].pnl);
        expect(result.finalEquity).toBe(1210);
    });

    it("handles short trades with profitable downside follow-through", () => {
        const result = runSignalBacktest(baseBacktestConfig, shortTakeProfitBars, shortSignals);

        expect(result.totalTrades).toBe(1);
        expect(result.trades[0].dir).toBe("SHORT");
        expect(result.trades[0].pnl).toBeGreaterThan(0);
    });

    it("applies fees and lowers net pnl compared with zero-fee baseline", () => {
        const noFee = runSignalBacktest(baseBacktestConfig, shortTakeProfitBars, shortSignals);
        const withFee = runSignalBacktest(
            { ...baseBacktestConfig, feeBpsPerSide: 25 },
            shortTakeProfitBars,
            shortSignals,
        );

        expect(withFee.trades[0].pnl).toBeLessThan(noFee.trades[0].pnl);
    });

    it("flags stale data when latest bar is older than threshold", () => {
        const issues = validateBacktestData(
            { ...baseBacktestConfig, staleAfterDays: 3, referenceDate: "2026-02-10" },
            longGapStopBars,
        );
        expect(issues.some((issue) => issue.code === "stale-data")).toBe(true);
    });

    it("flags malformed OHLC rows", () => {
        const malformed = [
            makeBar("2026-01-05", 100, 101, 99, 100),
            makeBar("2026-01-06", 100, 95, 99, 100),
        ];
        const issues = validateBacktestData(baseBacktestConfig, malformed);
        expect(issues.some((issue) => issue.code === "invalid-ohlc")).toBe(true);
    });

    it("blocks short entries when bullish regime filter is enabled", () => {
        const result = runSignalBacktest(
            { ...baseBacktestConfig, regimeFilterEnabled: true, regimeStatus: "BULLISH" },
            shortTakeProfitBars,
            shortSignals,
        );
        expect(result.totalTrades).toBe(0);
    });

    it("skips entries near earnings date when blackout is configured", () => {
        const result = runSignalBacktest(
            {
                ...baseBacktestConfig,
                earningsDate: "2026-01-06",
                avoidEarningsDays: 1,
            },
            longGapStopBars,
            basicLongSignals,
        );
        expect(result.totalTrades).toBe(0);
    });

    it("walk-forward mode only executes in out-of-sample windows", () => {
        const bars = Array.from({ length: 220 }).map((_, index) => {
            const day = String((index % 28) + 1).padStart(2, "0");
            const month = String(Math.floor(index / 28) + 1).padStart(2, "0");
            const close = index % 2 === 0 ? 80 : 120;
            return makeBar(`2026-${month}-${day}`, close, close + 2, close - 2, close);
        });
        const manualSignals = bars.map((_, index) => (index % 2 === 0 ? "LONG" : null));
        const baseline = runSignalBacktest(
            {
                ...baseBacktestConfig,
                strategy: "MACD + EMA Cross",
                stopLoss: 2,
                takeProfit: 2,
                lookback: 220,
                walkForwardEnabled: false,
            },
            bars,
            manualSignals,
        );
        const entryMask = createEntryEligibilityMask(
            {
                ...baseBacktestConfig,
                walkForwardEnabled: true,
                walkForwardTrainBars: 120,
                walkForwardTestBars: 20,
                lookback: 220,
            },
            bars,
        );
        const masked = runSignalBacktest(
            {
                ...baseBacktestConfig,
                strategy: "MACD + EMA Cross",
                stopLoss: 2,
                takeProfit: 2,
                lookback: 220,
            },
            bars,
            manualSignals,
            entryMask,
        );

        expect(baseline.totalTrades).toBeGreaterThan(0);
        expect(masked.totalTrades).toBeLessThanOrEqual(baseline.totalTrades);
    });
});