import { describe, it, expect } from "vitest";

/**
 * Pure math tests for the risk calculator logic used in DetailPanel.
 * These calculations are extracted here to verify correctness without
 * requiring a React DOM environment.
 */

function computeRiskCalc(
  accountSize: number,
  riskPct: number,
  entryPrice: number,
  stopLoss: number,
) {
  const accountVal = Math.max(accountSize, 1);
  const riskPctVal = Math.min(Math.max(riskPct, 0.1), 100);
  const stopDistance = Math.abs(entryPrice - stopLoss);
  const riskDollars = (accountVal * riskPctVal) / 100;
  const suggestedShares = stopDistance > 0
    ? Math.floor(riskDollars / stopDistance)
    : 0;
  const maxRisk = suggestedShares * stopDistance;
  return { riskDollars, suggestedShares, maxRisk };
}

describe("Risk Calculator", () => {
  it("calculates riskDollars correctly", () => {
    const { riskDollars } = computeRiskCalc(10_000, 1, 100, 95);
    expect(riskDollars).toBeCloseTo(100);
  });

  it("calculates suggestedShares = floor(riskDollars / stopDistance)", () => {
    // account=10000, risk=1% → $100 at risk; stop distance=$5 → 20 shares
    const { suggestedShares } = computeRiskCalc(10_000, 1, 100, 95);
    expect(suggestedShares).toBe(20);
  });

  it("floors suggestedShares (no fractional shares)", () => {
    // $100 / $3 = 33.33 → floors to 33
    const { suggestedShares } = computeRiskCalc(10_000, 1, 100, 97);
    expect(suggestedShares).toBe(33);
  });

  it("maxRisk = suggestedShares * stopDistance", () => {
    const { suggestedShares, maxRisk } = computeRiskCalc(10_000, 1, 100, 95);
    expect(maxRisk).toBeCloseTo(suggestedShares * 5);
  });

  it("returns 0 shares when stop equals entry (no risk distance)", () => {
    const { suggestedShares } = computeRiskCalc(10_000, 1, 100, 100);
    expect(suggestedShares).toBe(0);
  });

  it("works for short setups (stopLoss > entry)", () => {
    // SHORT: entry=50, stop=55, distance=5; $100 risk → 20 shares
    const { suggestedShares } = computeRiskCalc(10_000, 1, 50, 55);
    expect(suggestedShares).toBe(20);
  });

  it("clamps riskPct to minimum 0.1%", () => {
    const { riskDollars } = computeRiskCalc(10_000, 0, 100, 95);
    expect(riskDollars).toBeCloseTo(10); // 0.1% of 10000
  });

  it("clamps riskPct to maximum 100%", () => {
    const { riskDollars } = computeRiskCalc(10_000, 999, 100, 95);
    expect(riskDollars).toBeCloseTo(10_000); // 100% of 10000
  });

  it("handles large account sizes correctly", () => {
    const { suggestedShares } = computeRiskCalc(500_000, 2, 200, 190);
    // risk = $10,000; stop distance = $10 → 1000 shares
    expect(suggestedShares).toBe(1_000);
  });

  it("handles small account size (accountVal min-clamped to 1)", () => {
    const { riskDollars } = computeRiskCalc(0, 1, 100, 95);
    expect(riskDollars).toBeCloseTo(0.01); // 1% of 1
  });

  it("maxRisk never exceeds the intended risk dollars (due to flooring)", () => {
    const { riskDollars, maxRisk } = computeRiskCalc(10_000, 1, 100, 97);
    expect(maxRisk).toBeLessThanOrEqual(riskDollars);
  });
});
