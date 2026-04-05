import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BacktestPanel } from "@/components/BacktestPanel";
import { mockStocks } from "@/lib/mock-data";
import type { PriceBar } from "@/hooks/use-price-history";

vi.mock("@/hooks/use-price-history", () => ({
    usePriceHistory: vi.fn(),
}));

vi.mock("@/hooks/use-data", () => ({
    useRegime: vi.fn(),
}));

vi.mock("recharts", async () => {
    const Box = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
    const Nil = () => null;
    return {
        ResponsiveContainer: Box,
        AreaChart: Nil,
        BarChart: Nil,
        Area: Nil,
        Bar: Nil,
        XAxis: Nil,
        YAxis: Nil,
        CartesianGrid: Nil,
        Tooltip: Nil,
        Cell: Nil,
        ReferenceLine: Nil,
    };
});

import { usePriceHistory } from "@/hooks/use-price-history";
import { useRegime } from "@/hooks/use-data";

function buildDowntrendBars(count = 180): PriceBar[] {
    return Array.from({ length: count }).map((_, index) => {
        const month = String(Math.floor(index / 28) + 1).padStart(2, "0");
        const day = String((index % 28) + 1).padStart(2, "0");
        const close = 300 - index;
        return {
            ticker: "NVDA",
            date: `2026-${month}-${day}`,
            open: close + 0.4,
            high: close + 1,
            low: close - 1,
            close,
            volume: 1_200_000,
        };
    });
}

function readTotalTrades(): number {
    const label = screen.getByText("TOTAL TRADES");
    const valueNode = label.previousElementSibling;
    const raw = (valueNode?.textContent ?? "").trim();
    if (!raw || raw === "—") return 0;
    return Number(raw.split(",").join(""));
}

describe("BacktestPanel controls", () => {
    it("regime gating toggle changes resulting trades", async () => {
        vi.mocked(usePriceHistory).mockReturnValue({
            data: buildDowntrendBars(),
            isLoading: false,
            isError: false,
        } as ReturnType<typeof usePriceHistory>);

        vi.mocked(useRegime).mockReturnValue({
            data: {
                status: "BEARISH",
                spyPrice: 500,
                sma200: 480,
                sma50: 490,
                spyRsi: 44,
                vix: 20,
                ratio: 1,
                regimeScore: 0,
            },
            isLoading: false,
            isError: false,
        } as ReturnType<typeof useRegime>);

        render(<BacktestPanel stocks={[mockStocks.find((s) => s.ticker === "NVDA") ?? mockStocks[0]]} />);

        fireEvent.change(screen.getByTitle("Backtest strategy"), {
            target: { value: "RSI Mean Reversion" },
        });

        await waitFor(() => {
            expect(readTotalTrades()).toBeGreaterThan(0);
        });

        fireEvent.click(screen.getByLabelText(/REGIME GATING/i));

        await waitFor(() => {
            expect(readTotalTrades()).toBe(0);
        });
    });

    it("walk-forward toggle reduces or preserves trade count", async () => {
        vi.mocked(usePriceHistory).mockReturnValue({
            data: buildDowntrendBars(320),
            isLoading: false,
            isError: false,
        } as ReturnType<typeof usePriceHistory>);

        vi.mocked(useRegime).mockReturnValue({
            data: {
                status: "NEUTRAL",
                spyPrice: 500,
                sma200: 480,
                sma50: 490,
                spyRsi: 50,
                vix: 16,
                ratio: 1,
                regimeScore: 0,
            },
            isLoading: false,
            isError: false,
        } as ReturnType<typeof useRegime>);

        render(<BacktestPanel stocks={[mockStocks.find((s) => s.ticker === "NVDA") ?? mockStocks[0]]} />);

        fireEvent.change(screen.getByTitle("Backtest strategy"), {
            target: { value: "RSI Mean Reversion" },
        });

        await waitFor(() => {
            expect(readTotalTrades()).toBeGreaterThan(0);
        });

        const baselineTrades = readTotalTrades();
        fireEvent.click(screen.getByLabelText(/WALK-FORWARD MODE/i));

        await waitFor(() => {
            expect(readTotalTrades()).toBeLessThanOrEqual(baselineTrades);
        });
    });
});
