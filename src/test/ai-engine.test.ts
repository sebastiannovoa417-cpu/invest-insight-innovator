import { describe, it, expect } from "vitest";
import { generateTradeBrief, generateMarketBriefing, answerQuestion } from "@/lib/ai-engine";
import type { Stock, RegimeData } from "@/lib/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const signals = {
  sma200: true,
  sma50: true,
  rsiMomentum: true,
  volume: true,
  macd: true,
  priceAction: true,
  trendStrength: false,
  earningsSetup: false,
};

const mockLongStock: Stock = {
  ticker: "NVDA",
  name: "NVIDIA Corp",
  tradeType: "LONG",
  bullScore: 6,
  bearScore: 2,
  price: 850.0,
  rsi: 58,
  volumeRatio: 1.8,
  volumeSpike: false,
  signals,
  entryAtr: 848.0,
  entryStructure: 845.0,
  bestEntry: 850.0,
  stopLoss: 820.0,
  target: 970.0,
  riskReward: 4.0,
  atr: 15.0,
  distance52w: 12.5,
  conflictTrend: false,
  news: [],
  earningsDate: undefined,
  earningsWarning: false,
  shortInterest: 1.2,
  updatedAt: "12:00 PM PDT",
};

const mockShortStock: Stock = {
  ...mockLongStock,
  ticker: "TSLA",
  name: "Tesla Inc",
  tradeType: "SHORT",
  bullScore: 2,
  bearScore: 5,
  rsi: 65,
};

const mockRegime: RegimeData = {
  status: "BULLISH",
  spyPrice: 520.0,
  sma200: 480.0,
  sma50: 510.0,
  spyRsi: 58,
  vix: 14.5,
  ratio: 1.083,
  regimeScore: 5,
};

// ── generateTradeBrief ────────────────────────────────────────────────────────

describe("generateTradeBrief", () => {
  it("returns a non-empty string", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(50);
  });

  it("includes the ticker in the output", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toContain("NVDA");
  });

  it("mentions LONG for a long setup", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toContain("LONG");
  });

  it("mentions SHORT for a short setup", () => {
    const result = generateTradeBrief(mockShortStock, mockRegime);
    expect(result).toContain("SHORT");
  });

  it("labels high-conviction when 6+ signals pass", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toContain("high-conviction");
  });

  it("labels low-confidence when fewer than 4 signals pass", () => {
    const lowSignals = { ...mockLongStock, signals: { ...signals, sma200: false, sma50: false, rsiMomentum: false, volume: false, macd: false } };
    const result = generateTradeBrief(lowSignals, mockRegime);
    expect(result).toContain("low-confidence");
  });

  it("includes earnings warning when earningsWarning is true", () => {
    const earningsStock = { ...mockLongStock, earningsWarning: true };
    const result = generateTradeBrief(earningsStock, mockRegime);
    expect(result).toContain("WARNING");
  });

  it("includes conflict note when conflictTrend is true", () => {
    const conflictStock = { ...mockLongStock, conflictTrend: true };
    const result = generateTradeBrief(conflictStock, mockRegime);
    expect(result).toContain("conflicting trend");
  });

  it("includes regime info when regime is provided", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toContain("BULLISH");
  });

  it("omits regime line when no regime is passed", () => {
    const result = generateTradeBrief(mockLongStock);
    expect(result).not.toContain("Current regime");
  });

  it("includes volume spike confirmation when volumeSpike is true", () => {
    const spikeStock = { ...mockLongStock, volumeSpike: true };
    const result = generateTradeBrief(spikeStock, mockRegime);
    expect(result).toContain("Volume spike");
  });
});

// ── generateMarketBriefing ────────────────────────────────────────────────────

describe("generateMarketBriefing", () => {
  it("returns a multi-paragraph string", () => {
    const result = generateMarketBriefing(mockRegime, [mockLongStock, mockShortStock]);
    expect(result).toContain("\n\n");
  });

  it("includes the regime status", () => {
    const result = generateMarketBriefing(mockRegime, [mockLongStock, mockShortStock]);
    expect(result).toContain("BULLISH");
  });

  it("handles empty stock array gracefully", () => {
    const result = generateMarketBriefing(mockRegime, []);
    expect(result).toContain("No LONG setups");
    expect(result).toContain("No SHORT setups");
  });
});

// ── answerQuestion ────────────────────────────────────────────────────────────

describe("answerQuestion", () => {
  const stocks = [mockLongStock, mockShortStock];

  it("answers regime questions", () => {
    const result = answerQuestion("What is the current regime?", stocks, mockRegime);
    expect(result).toContain("BULLISH");
    expect(result).toContain("SPY");
  });

  it("answers best R:R questions", () => {
    const result = answerQuestion("What has the best R:R?", stocks, mockRegime);
    expect(result).toContain("R:R");
    expect(result).toContain("NVDA");
  });

  it("answers SHORT candidate questions", () => {
    const result = answerQuestion("Show me short candidates", stocks, mockRegime);
    expect(result).toContain("TSLA");
  });

  it("answers LONG candidate questions", () => {
    const result = answerQuestion("Show me long candidates", stocks, mockRegime);
    expect(result).toContain("NVDA");
  });

  it("answers ticker-specific queries", () => {
    const result = answerQuestion("Tell me about NVDA", stocks, mockRegime);
    expect(result).toContain("NVDA");
    expect(result).toContain("LONG");
  });

  it("returns a default summary for unrecognised questions", () => {
    const result = answerQuestion("purple monkey dishwasher", stocks, mockRegime);
    expect(result).toContain("Universe summary");
  });

  it("returns earnings info when asked", () => {
    const earningsStock = { ...mockLongStock, earningsWarning: true };
    const result = answerQuestion("Any earnings this week?", [earningsStock], mockRegime);
    expect(result).toContain("NVDA");
  });
});
