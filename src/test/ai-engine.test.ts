import { describe, it, expect } from "vitest";
import {
  generateTradeBrief,
  generateMarketBriefing,
  answerQuestion,
  scoreKnowledgeMatch,
  rankKnowledgeMatches,
  filterBrokerWorkflows,
  buildSources,
  questionMentionsBroker,
} from "@/lib/ai-engine";
import type {
  TradingKnowledgeRecord,
  KnowledgeSourceRecord,
  KnowledgeMatch,
  BrokerWorkflowRecord,
  HistoryEntry,
} from "@/lib/ai-engine";
import type { Stock, RegimeData } from "@/lib/types";

// ── Fixtures ───────────────────────────────────────────────────────────────────────────────

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

// ── generateTradeBrief ────────────────────────────────────────────────────────────────────────────

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

// ── generateMarketBriefing ────────────────────────────────────────────────────────────────────────────

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

// ── answerQuestion ───────────────────────────────────────────────────────────────────────────────

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

  it("returns a contextual briefing for unrecognised questions (no help-menu)", () => {
    const result = answerQuestion("purple monkey dishwasher", stocks, mockRegime);
    expect(result).not.toContain("Universe summary");
    expect(result).toContain("Regime:");
    expect(result).toContain("Top setups right now");
  });

  it("returns earnings info when asked", () => {
    const earningsStock = { ...mockLongStock, earningsWarning: true };
    const result = answerQuestion("Any earnings this week?", [earningsStock], mockRegime);
    expect(result).toContain("NVDA");
  });

  it("handles casual 'what's hot right now' → top_setups intent", () => {
    const result = answerQuestion("what's hot right now", stocks, mockRegime);
    expect(result).toMatch(/Top 5|setup|NVDA/i);
  });

  it("handles casual 'how's the market today' → regime intent", () => {
    const result = answerQuestion("how's the market today", stocks, mockRegime);
    expect(result).toMatch(/BULLISH|BEARISH|NEUTRAL/);
  });

  it("handles casual 'any good buys' → long_candidates intent", () => {
    const result = answerQuestion("any good buys", stocks, mockRegime);
    expect(result).toMatch(/LONG|NVDA/i);
  });

  it("handles 'should I buy NVDA' → ticker_lookup intent", () => {
    const result = answerQuestion("should I buy NVDA", stocks, mockRegime);
    expect(result).toContain("NVDA");
  });

  it("resolves company name 'nvidia' to NVDA ticker", () => {
    const result = answerQuestion("tell me about nvidia", stocks, mockRegime);
    expect(result).toContain("NVDA");
  });

  it("resolves company name 'tesla' to TSLA ticker", () => {
    const result = answerQuestion("what's happening with tesla", stocks, mockRegime);
    expect(result).toContain("TSLA");
  });

  it("handles 'give me ideas' → top_setups intent", () => {
    const result = answerQuestion("give me ideas", stocks, mockRegime);
    expect(result).toMatch(/Top 5 setups|NVDA|TSLA/i);
  });

  it("handles 'anything interesting' → top_setups intent", () => {
    const result = answerQuestion("anything interesting?", stocks, mockRegime);
    expect(result).toMatch(/Top 5 setups|NVDA|TSLA/i);
  });

  it("handles 'what is the market doing' → regime intent", () => {
    const result = answerQuestion("what is the market doing", stocks, mockRegime);
    expect(result).toMatch(/BULLISH|BEARISH|NEUTRAL/);
  });

  it("top_setups response includes regime bias note", () => {
    const result = answerQuestion("top setups", stocks, mockRegime);
    expect(result).toMatch(/BULLISH regime|BEARISH regime|NEUTRAL regime/);
  });

  it("long_candidates response includes regime context", () => {
    const result = answerQuestion("show me long candidates", stocks, mockRegime);
    expect(result).toMatch(/Regime is (BULLISH|BEARISH|NEUTRAL)/);
  });
});

// ── scoreKnowledgeMatch ──────────────────────────────────────────────────────

describe("scoreKnowledgeMatch", () => {
  const baseItem: TradingKnowledgeRecord = {
    id: "k1",
    category: "swing_principles",
    title: "Entry strategies for swing traders",
    content: "Use ATR-based entries to time your position.",
    tags: ["entry", "swing", "atr"],
    broker: null,
    platform: null,
    source_id: null,
  };

  it("returns 0 for a completely unrelated question", () => {
    expect(scoreKnowledgeMatch("tell me a joke", baseItem)).toBe(0);
  });

  it("scores higher when a tag appears in the question", () => {
    const score = scoreKnowledgeMatch("what is the best entry for atr setups", baseItem);
    expect(score).toBeGreaterThan(0);
  });

  it("scores extra when broker matches", () => {
    const brokerItem: TradingKnowledgeRecord = {
      ...baseItem,
      category: "broker_workflows",
      broker: "Fidelity",
      tags: [],
    };
    const withBroker = scoreKnowledgeMatch("how do i place a limit order on fidelity", brokerItem);
    const withoutBroker = scoreKnowledgeMatch("how do i place a limit order", brokerItem);
    expect(withBroker).toBeGreaterThan(withoutBroker);
  });

  it("scores app_help category question about regime", () => {
    const helpItem: TradingKnowledgeRecord = {
      ...baseItem,
      category: "app_help",
      title: "Regime panel explanation",
      tags: [],
    };
    const score = scoreKnowledgeMatch("what does regime mean in swingpulse", helpItem);
    expect(score).toBeGreaterThan(0);
  });

  it("matching title words adds score", () => {
    const score = scoreKnowledgeMatch("what are entry strategies", baseItem);
    expect(score).toBeGreaterThan(0);
  });
});

// ── rankKnowledgeMatches ──────────────────────────────────────────────────────

describe("rankKnowledgeMatches", () => {
  const items: TradingKnowledgeRecord[] = [
    { id: "k1", category: "swing_principles", title: "ATR entries", content: "ATR entry content", tags: ["atr", "entry"], broker: null, platform: null, source_id: "s1" },
    { id: "k2", category: "risk_management", title: "Stop loss basics", content: "Stop loss content", tags: ["stop", "risk"], broker: null, platform: null, source_id: null },
    { id: "k3", category: "broker_workflows", title: "Fidelity limit orders", content: "Fidelity content", tags: ["limit", "order"], broker: "Fidelity", platform: "Web", source_id: null },
  ];
  const sources: KnowledgeSourceRecord[] = [
    { id: "s1", publisher: "Investopedia", trust_tier: "high", url: "https://investopedia.com/atr" },
  ];

  it("returns empty array when no items match", () => {
    const result = rankKnowledgeMatches("purple monkey dishwasher", items, sources);
    expect(result).toHaveLength(0);
  });

  it("returns highest-scoring item first", () => {
    const result = rankKnowledgeMatches("how do i use atr for entry", items, sources);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe("k1");
  });

  it("attaches source metadata when source_id is present", () => {
    const result = rankKnowledgeMatches("atr entry strategy", items, sources);
    const atrItem = result.find((r) => r.id === "k1");
    expect(atrItem?.sourceLabel).toBe("Investopedia");
    expect(atrItem?.sourceUrl).toBe("https://investopedia.com/atr");
  });

  it("leaves sourceLabel null when no source_id", () => {
    const result = rankKnowledgeMatches("how do i use a stop loss for risk", items, sources);
    const stopItem = result.find((r) => r.id === "k2");
    expect(stopItem?.sourceLabel).toBeNull();
  });

  it("caps results at 6 items", () => {
    const manyItems: TradingKnowledgeRecord[] = Array.from({ length: 10 }, (_, i) => ({
      id: `k${i}`,
      category: "swing_principles" as const,
      title: `Entry setup ${i}`,
      content: "content",
      tags: ["entry", "swing"],
      broker: null,
      platform: null,
      source_id: null,
    }));
    const result = rankKnowledgeMatches("entry swing setup", manyItems, []);
    expect(result.length).toBeLessThanOrEqual(6);
  });
});

// ── filterBrokerWorkflows ─────────────────────────────────────────────────────

describe("filterBrokerWorkflows", () => {
  const workflows: BrokerWorkflowRecord[] = [
    { id: "w1", broker: "Robinhood", platform: "Mobile", instrument: "Stock", order_types_supported: ["market", "limit"], steps_json: ["Step 1", "Step 2"] },
    { id: "w2", broker: "Fidelity", platform: "Web", instrument: "Stock", order_types_supported: ["limit"], steps_json: ["A", "B"] },
    { id: "w3", broker: "Interactive Brokers", platform: "TWS", instrument: "Options", order_types_supported: ["limit", "stop"], steps_json: ["X", "Y"] },
  ];

  it("returns empty when no broker keyword appears", () => {
    expect(filterBrokerWorkflows("how do I trade stocks", workflows)).toHaveLength(0);
  });

  it("matches robinhood keyword", () => {
    const result = filterBrokerWorkflows("how do I place a limit order on robinhood", workflows);
    expect(result).toHaveLength(1);
    expect(result[0].broker).toBe("Robinhood");
  });

  it("matches ibkr alias for Interactive Brokers", () => {
    const result = filterBrokerWorkflows("how do I trade options on ibkr", workflows);
    expect(result).toHaveLength(1);
    expect(result[0].broker).toBe("Interactive Brokers");
  });

  it("matches multiple brokers mentioned in one question", () => {
    const result = filterBrokerWorkflows("compare robinhood and fidelity order entry", workflows);
    expect(result).toHaveLength(2);
    const brokers = result.map((r) => r.broker);
    expect(brokers).toContain("Robinhood");
    expect(brokers).toContain("Fidelity");
  });
});

// ── buildSources ─────────────────────────────────────────────────────────────

describe("buildSources", () => {
  const makeMatch = (id: string, label: string | null, url: string | null): KnowledgeMatch => ({
    id,
    category: "swing_principles",
    title: "T",
    content: "C",
    tags: [],
    broker: null,
    platform: null,
    source_id: null,
    sourceLabel: label,
    sourceUrl: url,
    trustTier: null,
  });

  it("returns empty when no matches have source metadata", () => {
    const result = buildSources([makeMatch("k1", null, null)]);
    expect(result).toHaveLength(0);
  });

  it("deduplicates identical source label+url pairs", () => {
    const result = buildSources([
      makeMatch("k1", "Investopedia", "https://investopedia.com"),
      makeMatch("k2", "Investopedia", "https://investopedia.com"),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("Investopedia");
  });

  it("caps output at 3 sources", () => {
    const matches = [
      makeMatch("k1", "Source A", "https://a.com"),
      makeMatch("k2", "Source B", "https://b.com"),
      makeMatch("k3", "Source C", "https://c.com"),
      makeMatch("k4", "Source D", "https://d.com"),
    ];
    expect(buildSources(matches)).toHaveLength(3);
  });

  it("includes label and url on each chip", () => {
    const result = buildSources([makeMatch("k1", "MarketWatch", "https://mw.com/article")]);
    expect(result[0]).toEqual({ label: "MarketWatch", url: "https://mw.com/article" });
  });
});

// ── questionMentionsBroker ────────────────────────────────────────────────────

describe("questionMentionsBroker", () => {
  it("returns true for robinhood", () => {
    expect(questionMentionsBroker("how do i place a stop order on robinhood")).toBe(true);
  });

  it("returns true for ibkr alias", () => {
    expect(questionMentionsBroker("what order types does ibkr support")).toBe(true);
  });

  it("returns false when no broker mentioned", () => {
    expect(questionMentionsBroker("what is the best setup today")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(questionMentionsBroker("How do I buy on WEBULL")).toBe(true);
  });
});

// ── generateTradeBrief (new fields from Phase 2) ─────────────────────────────

describe("generateTradeBrief — new Phase 2 fields", () => {
  it("includes passing signal names", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toMatch(/Signals passing \(\d+\):/);
    expect(result).toContain("sma200");
    expect(result).toContain("macd");
  });

  it("includes failing signal names", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toMatch(/Failing \(\d+\):/);
    expect(result).toContain("trendStrength");
  });

  it("includes short interest when non-zero", () => {
    const result = generateTradeBrief(mockLongStock, mockRegime);
    expect(result).toContain("Short interest: 1.2%");
  });

  it("omits short interest line when shortInterest is undefined", () => {
    const noSI = { ...mockLongStock, shortInterest: undefined };
    const result = generateTradeBrief(noSI, mockRegime);
    expect(result).not.toContain("Short interest:");
  });

  it("omits short interest line when shortInterest is 0", () => {
    const zeroSI = { ...mockLongStock, shortInterest: 0 };
    const result = generateTradeBrief(zeroSI, mockRegime);
    expect(result).not.toContain("Short interest:");
  });
});

// ── answerQuestion — new params & intents (Phase 1 & 2) ──────────────────────

describe("answerQuestion — history-based follow-up resolution", () => {
  const stocks = [mockLongStock, mockShortStock];

  it("resolves 'tell me more' follow-up using ticker from history", () => {
    const history: HistoryEntry[] = [
      { role: "user", text: "what is happening with NVDA" },
      { role: "assistant", text: "NVDA is rated LONG with a score of 6/8." },
    ];
    const result = answerQuestion("tell me more", stocks, mockRegime, history);
    expect(result).toContain("NVDA");
  });

  it("resolves 'elaborate' follow-up using ticker from history", () => {
    const history: HistoryEntry[] = [
      { role: "user", text: "show me TSLA" },
      { role: "assistant", text: "TSLA is rated SHORT." },
    ];
    const result = answerQuestion("elaborate", stocks, mockRegime, history);
    expect(result).toContain("TSLA");
  });

  it("returns default response when follow-up has no ticker in history", () => {
    const history: HistoryEntry[] = [
      { role: "user", text: "what is the regime today" },
      { role: "assistant", text: "Regime is BULLISH." },
    ];
    // No ticker in history — should fall through to default / regime intent
    const result = answerQuestion("tell me more", stocks, mockRegime, history);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it("works without history param (backwards-compatible)", () => {
    const result = answerQuestion("tell me about NVDA", stocks, mockRegime);
    expect(result).toContain("NVDA");
  });
});

describe("answerQuestion — broker_workflow intent", () => {
  const stocks = [mockLongStock, mockShortStock];
  const mockWorkflow: BrokerWorkflowRecord = {
    id: "w1",
    broker: "Robinhood",
    platform: "Mobile",
    instrument: "Stock",
    order_types_supported: ["market", "limit"],
    steps_json: ["Open the app", "Tap the stock", "Choose order type", "Confirm"],
  };

  it("returns numbered workflow steps when brokerWorkflows are provided", () => {
    const result = answerQuestion(
      "how do I place a limit order on robinhood",
      stocks,
      mockRegime,
      undefined,
      undefined,
      [mockWorkflow],
    );
    expect(result).toContain("Robinhood");
    expect(result).toContain("1.");
    expect(result).toContain("Open the app");
  });

  it("returns fallback message when no workflows provided for broker question", () => {
    const result = answerQuestion(
      "how do I place a limit order on robinhood",
      stocks,
      mockRegime,
      undefined,
      undefined,
      [],
    );
    expect(result).toContain("No stored workflow found");
  });

  it("fallback message suggests broker name examples", () => {
    const result = answerQuestion(
      "how to place an order on robinhood",
      stocks,
      mockRegime,
      undefined,
      undefined,
      [],
    );
    expect(result).toMatch(/Robinhood|Fidelity|Webull/);
  });
});

describe("answerQuestion — knowledgeMatches injection into default response", () => {
  const stocks = [mockLongStock, mockShortStock];
  const mockKnowledge: KnowledgeMatch = {
    id: "k1",
    category: "swing_principles",
    title: "ATR Position Sizing",
    content: "Use ATR to determine stop distance and size your position accordingly.",
    tags: ["atr", "position", "sizing"],
    broker: null,
    platform: null,
    source_id: null,
    sourceLabel: "Investopedia",
    sourceUrl: "https://investopedia.com/atr",
    trustTier: "high",
  };

  it("includes knowledge title and content in default response", () => {
    const result = answerQuestion(
      "some random unrecognised question",
      stocks,
      mockRegime,
      undefined,
      [mockKnowledge],
    );
    expect(result).toContain("ATR Position Sizing");
    expect(result).toContain("Use ATR to determine stop distance");
  });

  it("includes source attribution when sourceLabel and sourceUrl are set", () => {
    const result = answerQuestion(
      "some random unrecognised question",
      stocks,
      mockRegime,
      undefined,
      [mockKnowledge],
    );
    expect(result).toContain("Investopedia");
    expect(result).toContain("https://investopedia.com/atr");
  });

  it("does not include knowledge block when knowledgeMatches is empty", () => {
    const result = answerQuestion("some random unrecognised question", stocks, mockRegime, undefined, []);
    expect(result).not.toContain("**");
  });

  it("injects at most 2 knowledge blocks", () => {
    const manyMatches: KnowledgeMatch[] = Array.from({ length: 5 }, (_, i) => ({
      ...mockKnowledge,
      id: `k${i}`,
      title: `Article Title ${i}`,
      content: `Content for article ${i}`,
    }));
    const result = answerQuestion("unrecognised question", stocks, mockRegime, undefined, manyMatches);
    const occurrences = (result.match(/Article Title/g) ?? []).length;
    expect(occurrences).toBeLessThanOrEqual(2);
  });
});

// ── answerQuestion — diverse random phrasings (stress-test intent routing) ───

describe("answerQuestion — diverse random phrasings", () => {
  const stocks = [mockLongStock, mockShortStock];

  // Regime variations
  it.each([
    "is now a good time to trade?",
    "what is macro sentiment like?",
    "how are markets doing overall?",
    "market vibe today?",
    "should I be trading right now?",
    "what's the market direction?",
    "what is the market outlook?",
  ])("regime phrasing: %s → mentions BULLISH/BEARISH/NEUTRAL", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/BULLISH|BEARISH|NEUTRAL/);
  });

  // Top-setups variations
  it.each([
    "any plays today?",
    "any opportunities right now?",
    "scan results please",
    "show me picks",
    "what should I watch?",
    "what to trade today?",
    "any good trades?",
    "top ideas right now",
  ])("top-setups phrasing: %s → mentions a ticker or setup", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/NVDA|TSLA|setup|signal|score/i);
  });

  // Long candidate variations
  it.each([
    "any bullish stocks?",
    "what's going up?",
    "buy the dip candidates",
    "call plays",
    "any upward trends?",
    "good buys right now",
  ])("long-candidates phrasing: %s → mentions NVDA or LONG", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/LONG|NVDA/i);
  });

  // Short candidate variations
  it.each([
    "what to short today?",
    "bearish plays available?",
    "sell the rip candidates",
    "put plays available?",
    "what is going down?",
    "any downtrends?",
  ])("short-candidates phrasing: %s → mentions TSLA or SHORT", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/SHORT|TSLA/i);
  });

  // RSI variations
  it.each([
    "any oversold stocks?",
    "what is extremely stretched?",
    "mean reversion candidates?",
    "any bounce candidates?",
    "reversal plays?",
    "any overbought stocks?",
  ])("rsi phrasing: %s → mentions RSI or neutral range", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/RSI|neutral RSI|Oversold|Overbought/i);
  });

  // Volume variations
  it.each([
    "what is most active today?",
    "unusual volume stocks?",
    "any big volume moves?",
    "active today?",
    "high volume stocks right now",
    "unusual activity?",
    "vol spike stocks?",
  ])("volume phrasing: %s → mentions volume or no spikes", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/volume|spike/i);
  });

  // Earnings variations
  it.each([
    "any binary events coming up?",
    "what is reporting this week?",
    "upcoming earnings this week?",
    "catalyst risk tickers?",
    "avoid earnings stocks",
    "upcoming reports?",
  ])("earnings phrasing: %s → mentions earnings or all clear", (q) => {
    const earningsStock = { ...mockLongStock, earningsWarning: true };
    const result = answerQuestion(q, [earningsStock, mockShortStock], mockRegime);
    expect(result).toMatch(/earnings|report/i);
  });

  // Conflict variations
  it.each([
    "any mixed signals?",
    "what setups are diverging?",
    "uncertain setups today?",
    "indecisive stocks?",
  ])("conflicts phrasing: %s → mentions conflict or no conflicts", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/conflict|diverge|aligned/i);
  });

  // R:R variations
  it.each([
    "best risk reward setups?",
    "highest reward to risk?",
    "most favorable setup?",
    "best ratio trades?",
    "best rr right now",
  ])("best_rr phrasing: %s → mentions R:R", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toContain("R:R");
  });

  // Short interest variations
  it.each([
    "short squeeze potential?",
    "high short interest stocks?",
    "squeeze plays?",
    "risky stocks right now?",
  ])("short_interest phrasing: %s → mentions SI or no data", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toMatch(/SI|short interest|Short interest|No short interest/i);
  });

  // Position sizing
  it.each([
    "how many shares of NVDA should I buy?",
    "position sizing for NVDA",
    "how much should I buy of NVDA?",
    "what lot size for NVDA?",
    "NVDA risk per trade",
  ])("position_size phrasing: %s → mentions entry and stop distance", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toContain("Stop distance");
    expect(result).toContain("Suggested shares");
  });

  // Compare
  it("compare phrasing: 'NVDA versus TSLA' → side-by-side", () => {
    const result = answerQuestion("NVDA versus TSLA comparison", stocks, mockRegime);
    expect(result).toContain("vs");
    expect(result).toContain("NVDA");
    expect(result).toContain("TSLA");
  });

  // Ticker lookup via various phrasings
  it.each([
    "should I short TSLA?",
    "break down NVDA for me",
    "what do you think about NVDA?",
    "NVDA analysis please",
    "give me the setup for TSLA",
  ])("ticker lookup: %s → mentions the ticker", (q) => {
    const ticker = q.includes("TSLA") ? "TSLA" : "NVDA";
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toContain(ticker);
  });

  // Truly nonsensical questions should still return a coherent default
  it.each([
    "purple monkey dishwasher",
    "asdfghjkl",
    "???",
    "banana",
    "this is not a trading question at all",
  ])("nonsensical: %s → returns default market briefing", (q) => {
    const result = answerQuestion(q, stocks, mockRegime);
    expect(result).toContain("Regime:");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(20);
  });
});
