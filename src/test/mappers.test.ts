import { describe, it, expect } from "vitest";
import { mapDbStock, mapDbRegime, mapDbPosition, mapDbAlert } from "@/lib/types";

// ── mapDbStock ────────────────────────────────────────────────────────────────

const rawStock = {
  id: "abc123",
  ticker: "AAPL",
  name: "Apple Inc.",
  trade_type: "LONG",
  bull_score: 6,
  bear_score: 2,
  price: 195.5,
  rsi: 57.3,
  volume_ratio: 1.4,
  volume_spike: false,
  signals: {
    sma200: true,
    sma50: true,
    rsiMomentum: true,
    volume: false,
    macd: true,
    priceAction: false,
    trendStrength: true,
    earningsSetup: false,
  },
  entry_atr: 193.0,
  entry_structure: 191.0,
  best_entry: 195.5,
  stop_loss: 185.0,
  target: 237.0,
  risk_reward: 3.95,
  atr: 2.45,
  distance_52w: 8.3,
  conflict_trend: false,
  news: [{ title: "Apple hits new high", date: "Mar 25", source: "Reuters", sentiment: "bullish", url: null }],
  earnings_date: "2025-04-29",
  earnings_warning: false,
  short_interest: 0.7,
  updated_at: "2025-04-29T16:00:00.000Z",
  run_id: null,
  created_at: "2025-04-29T16:00:00.000Z",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("mapDbStock", () => {
  it("maps snake_case fields to camelCase", () => {
    const stock = mapDbStock(rawStock);
    expect(stock.ticker).toBe("AAPL");
    expect(stock.tradeType).toBe("LONG");
    expect(stock.bullScore).toBe(6);
    expect(stock.bearScore).toBe(2);
    expect(stock.volumeRatio).toBe(1.4);
    expect(stock.volumeSpike).toBe(false);
    expect(stock.bestEntry).toBe(195.5);
    expect(stock.stopLoss).toBe(185.0);
    expect(stock.riskReward).toBe(3.95);
    expect(stock.distance52w).toBe(8.3);
    expect(stock.conflictTrend).toBe(false);
    expect(stock.earningsWarning).toBe(false);
    expect(stock.earningsDate).toBe("2025-04-29");
    expect(stock.shortInterest).toBe(0.7);
  });

  it("maps signals object correctly", () => {
    const stock = mapDbStock(rawStock);
    expect(stock.signals.sma200).toBe(true);
    expect(stock.signals.sma50).toBe(true);
    expect(stock.signals.volume).toBe(false);
    expect(stock.signals.earningsSetup).toBe(false);
  });

  it("maps news array", () => {
    const stock = mapDbStock(rawStock);
    expect(stock.news).toHaveLength(1);
    expect(stock.news[0].title).toBe("Apple hits new high");
  });

  it("falls back to ticker when name is null", () => {
    const noName = { ...rawStock, name: null };
    const stock = mapDbStock(noName);
    expect(stock.name).toBe("AAPL");
  });

  it("defaults optional numeric fields to 0 when null", () => {
    const nullFields = { ...rawStock, rsi: null, volume_ratio: null, entry_atr: null, stop_loss: null };
    const stock = mapDbStock(nullFields);
    expect(stock.rsi).toBe(0);
    expect(stock.volumeRatio).toBe(0);
    expect(stock.entryAtr).toBe(0);
    expect(stock.stopLoss).toBe(0);
  });

  it("defaults signals to false when signals field is null", () => {
    const noSignals = { ...rawStock, signals: null };
    const stock = mapDbStock(noSignals);
    expect(stock.signals.sma200).toBe(false);
    expect(stock.signals.macd).toBe(false);
  });

  it("returns undefined earningsDate when null", () => {
    const noEarnings = { ...rawStock, earnings_date: null };
    const stock = mapDbStock(noEarnings);
    expect(stock.earningsDate).toBeUndefined();
  });
});

// ── mapDbRegime ───────────────────────────────────────────────────────────────

const rawRegime = {
  id: "regime-uuid",
  status: "BULLISH",
  spy_price: 520.0,
  sma_200: 480.0,
  sma_50: 510.0,
  spy_rsi: 58.0,
  vix: 14.5,
  ratio: 1.083,
  regime_score: 5,
  run_id: null,
  updated_at: "2025-04-29T16:00:00.000Z",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("mapDbRegime", () => {
  it("maps all fields correctly", () => {
    const regime = mapDbRegime(rawRegime);
    expect(regime.status).toBe("BULLISH");
    expect(regime.spyPrice).toBe(520.0);
    expect(regime.sma200).toBe(480.0);
    expect(regime.sma50).toBe(510.0);
    expect(regime.spyRsi).toBe(58.0);
    expect(regime.vix).toBe(14.5);
    expect(regime.ratio).toBe(1.083);
    expect(regime.regimeScore).toBe(5);
  });
});

// ── mapDbPosition ─────────────────────────────────────────────────────────────

const rawPosition = {
  id: "pos-uuid",
  user_id: "user-uuid",
  ticker: "NVDA",
  direction: "LONG",
  entry_price: 850.0,
  shares: 10,
  entry_date: "2025-04-01",
  stop_loss: 820.0,
  target: 970.0,
  status: "open",
  exit_price: null,
  exit_date: null,
  notes: null,
  realized_pnl: null,
  created_at: "2025-04-01T10:00:00.000Z",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("mapDbPosition", () => {
  it("maps all fields correctly", () => {
    const pos = mapDbPosition(rawPosition);
    expect(pos.id).toBe("pos-uuid");
    expect(pos.ticker).toBe("NVDA");
    expect(pos.direction).toBe("LONG");
    expect(pos.entryPrice).toBe(850.0);
    expect(pos.shares).toBe(10);
    expect(pos.status).toBe("open");
    expect(pos.exitPrice).toBeNull();
    expect(pos.realizedPnl).toBeNull();
  });

  it("maps closed position with realized P&L", () => {
    const closed = { ...rawPosition, status: "closed", exit_price: 900.0, realized_pnl: 500.0 };
    const pos = mapDbPosition(closed);
    expect(pos.status).toBe("closed");
    expect(pos.exitPrice).toBe(900.0);
    expect(pos.realizedPnl).toBe(500.0);
  });
});

// ── mapDbAlert ────────────────────────────────────────────────────────────────

const rawAlert = {
  id: "alert-uuid",
  user_id: "user-uuid",
  ticker: "TSLA",
  condition: "price_above",
  threshold: "250.00",
  status: "active",
  triggered_at: null,
  created_at: "2025-04-01T10:00:00.000Z",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

describe("mapDbAlert", () => {
  it("maps all fields correctly", () => {
    const alert = mapDbAlert(rawAlert);
    expect(alert.id).toBe("alert-uuid");
    expect(alert.ticker).toBe("TSLA");
    expect(alert.condition).toBe("price_above");
    expect(alert.threshold).toBe(250);
    expect(alert.status).toBe("active");
    expect(alert.triggeredAt).toBeNull();
  });

  it("converts threshold string to number", () => {
    const alert = mapDbAlert({ ...rawAlert, threshold: "99.5" });
    expect(typeof alert.threshold).toBe("number");
    expect(alert.threshold).toBeCloseTo(99.5);
  });
});
