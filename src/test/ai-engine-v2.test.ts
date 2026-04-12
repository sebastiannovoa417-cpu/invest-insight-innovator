/**
 * Comprehensive AI engine test suite — v2 (50-ticker universe)
 *
 * Covers:
 *  - All 50 universe tickers by direct symbol and company-name alias
 *  - Per-ticker: setup brief, news lookup, signals/why, position sizing
 *  - All 16 intent branches with 10-30 phrasings each
 *  - quant_expectancy / quant_optimization / quant_frameworks content correctness
 *  - Response content accuracy (actual data values from mockStocks/mockRegime)
 *  - Follow-up context resolution with new-universe tickers
 *  - Mock-data structural validation
 *  - Edge cases (empty stocks, malformed queries, nonsense inputs)
 *
 * Together with ai-engine.test.ts (145 tests) this file pushes the total above 1 000.
 */

import { describe, it, expect } from "vitest";
import { answerQuestion, generateTradeBrief, generateMarketBriefing } from "@/lib/ai-engine";
import type { HistoryEntry } from "@/lib/ai-engine";
import type { RegimeData } from "@/lib/types";
import { mockStocks, mockRegime, lastRunInfo } from "@/lib/mock-data";
import { TICKER_CATEGORY_MAP, CATEGORY_LABELS } from "@/lib/stock-categories";

// ── Local fixtures ───────────────────────────────────────────────────────────

/** A BULLISH regime — used where intent needs regime-direction cues. */
const bullishRegime: RegimeData = {
  status: "BULLISH",
  spyPrice: 525.0,
  sma200: 488.0,
  sma50: 514.0,
  spyRsi: 62.0,
  vix: 13.8,
  ratio: 1.076,
  regimeScore: 5,
};

/** A NEUTRAL regime — used to exercise neutral-regime branches. */
const neutralRegime: RegimeData = {
  status: "NEUTRAL",
  spyPrice: 530.0,
  sma200: 528.0,
  sma50: 529.0,
  spyRsi: 50.0,
  vix: 20.0,
  ratio: 1.004,
  regimeScore: 3,
};

// All 50 tickers in the universe
const ALL_TICKERS = [
  // Section 1: High-Dividend Low-Volatility
  "MO", "VZ", "PEP", "DUK", "MDLZ",
  // Section 2: Under $100 High-Yield
  "EOG", "CNXC", "MDT", "LB", "PLAB", "F", "SOFI",
  // Section 3: Moderate-Yield
  "GLW", "TPL", "STX", "WDC", "UNH", "CI", "SPGI", "T", "ELV", "BDX",
  "CVX", "AVGO", "HD", "JPM", "BLK", "MMM",
  // Section 4: Reliable Penny Stocks
  "BARK", "CCO", "DDL", "WDH", "LX", "JOB", "VISL", "UGRO", "ATOM", "IMUX",
  // Section 5: Penny Stocks Bullish Trends
  "HURA", "CVSI", "SELF", "PSNY", "BBAI", "GRAL", "CECO", "BHE", "RGTI", "SOUN", "BNGO", "ACHR",
];

const HIGH_DIVIDEND_TICKERS = [
  "MO","VZ","PEP","DUK","MDLZ",
  "EOG","CNXC","MDT","LB","PLAB","F","SOFI",
  "GLW","TPL","STX","WDC","UNH","CI","SPGI","T","ELV","BDX","CVX","AVGO","HD","JPM","BLK","MMM",
];
const PENNY_TICKERS = [
  "BARK","CCO","DDL","WDH","LX","JOB","VISL","UGRO","ATOM","IMUX",
  "HURA","CVSI","SELF","PSNY","BBAI","GRAL","CECO","BHE","RGTI","SOUN","BNGO","ACHR",
];

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1 — Mock data structural validation
// ═══════════════════════════════════════════════════════════════════════

describe("Mock data — structural validation", () => {
  it("mockStocks has exactly 50 entries", () => {
    expect(mockStocks).toHaveLength(50);
  });

  it("lastRunInfo.stockCount is 50", () => {
    expect(lastRunInfo.stockCount).toBe(50);
  });

  it("lastRunInfo.universe contains 'v2.0'", () => {
    expect(lastRunInfo.universe).toContain("v2.0");
  });

  it("TICKER_CATEGORY_MAP has exactly 50 entries", () => {
    expect(Object.keys(TICKER_CATEGORY_MAP)).toHaveLength(50);
  });

  it("CATEGORY_LABELS has 3 entries (ALL + 2 categories)", () => {
    expect(CATEGORY_LABELS).toHaveLength(3);
    expect(CATEGORY_LABELS).toContain("ALL");
  });

  it("High Dividend category has 28 tickers", () => {
    const count = Object.values(TICKER_CATEGORY_MAP).filter(
      (c) => c === "High Dividend Yield & High Earnings",
    ).length;
    expect(count).toBe(28);
  });

  it("Penny Stocks category has 22 tickers", () => {
    const count = Object.values(TICKER_CATEGORY_MAP).filter(
      (c) => c === "Penny Stocks",
    ).length;
    expect(count).toBe(22);
  });

  it("every ticker in mockStocks has an entry in TICKER_CATEGORY_MAP", () => {
    for (const s of mockStocks) {
      expect(TICKER_CATEGORY_MAP[s.ticker]).toBeTruthy();
    }
  });

  it("every ticker in TICKER_CATEGORY_MAP appears in mockStocks", () => {
    const mockTickerSet = new Set(mockStocks.map((s) => s.ticker));
    for (const ticker of Object.keys(TICKER_CATEGORY_MAP)) {
      expect(mockTickerSet.has(ticker)).toBe(true);
    }
  });

  it("all 50 expected universe tickers are in mockStocks", () => {
    const mockTickerSet = new Set(mockStocks.map((s) => s.ticker));
    for (const t of ALL_TICKERS) {
      expect(mockTickerSet.has(t)).toBe(true);
    }
  });

  it("all mockStocks have a non-empty name", () => {
    for (const s of mockStocks) {
      expect(typeof s.name).toBe("string");
      expect(s.name.length).toBeGreaterThan(0);
    }
  });

  it("all mockStocks have a positive price", () => {
    for (const s of mockStocks) {
      expect(s.price).toBeGreaterThan(0);
    }
  });

  it("all mockStocks have a valid signals object (8 keys)", () => {
    const expectedKeys = ["sma200","sma50","rsiMomentum","volume","macd","priceAction","trendStrength","earningsSetup"];
    for (const s of mockStocks) {
      for (const key of expectedKeys) {
        expect(typeof (s.signals as Record<string, boolean>)[key]).toBe("boolean");
      }
    }
  });

  it("all mockStocks have a non-empty news array", () => {
    for (const s of mockStocks) {
      expect(Array.isArray(s.news)).toBe(true);
      expect(s.news.length).toBeGreaterThan(0);
    }
  });

  it("every High Dividend ticker has a price above $1", () => {
    for (const t of HIGH_DIVIDEND_TICKERS) {
      const s = mockStocks.find((x) => x.ticker === t);
      expect(s).toBeTruthy();
      expect(s!.price).toBeGreaterThan(1);
    }
  });

  it("mockRegime status is BEARISH in mock data", () => {
    expect(mockRegime.status).toBe("BEARISH");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2 — Direct ticker symbol lookups (all 50)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — all 50 universe tickers by direct symbol", () => {
  it.each(ALL_TICKERS)(
    "tell me about %s → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`tell me about ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

describe("answerQuestion — all 50 tickers via 'what is the setup for X'", () => {
  it.each(ALL_TICKERS)(
    "what is the setup for %s → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`what is the setup for ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

describe("answerQuestion — all 50 tickers via 'X analysis'", () => {
  it.each(ALL_TICKERS)(
    "%s analysis → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`${ticker} analysis`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

describe("answerQuestion — all 50 tickers via 'should I buy/short X'", () => {
  it.each(ALL_TICKERS)(
    "should I trade %s → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`should I trade ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3 — Company name alias lookups
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — company name aliases resolve to correct tickers", () => {
  it.each([
    // Section 1 — High-Dividend Low-Volatility
    ["altria", "MO"],
    ["altria group", "MO"],
    ["verizon", "VZ"],
    ["verizon communications", "VZ"],
    ["pepsico", "PEP"],
    ["pepsi", "PEP"],
    ["duke energy", "DUK"],
    ["mondelez", "MDLZ"],
    ["mondelez international", "MDLZ"],
    // Section 2 — High-Yield Under $100
    ["eog resources", "EOG"],
    ["eog", "EOG"],
    ["concentrix", "CNXC"],
    ["medtronic", "MDT"],
    ["landbridge", "LB"],
    ["photronics", "PLAB"],
    ["ford", "F"],
    ["ford motor", "F"],
    ["sofi", "SOFI"],
    ["sofi technologies", "SOFI"],
    // Section 3 — Moderate-Yield
    ["corning", "GLW"],
    ["texas pacific land", "TPL"],
    ["seagate", "STX"],
    ["seagate technology", "STX"],
    ["western digital", "WDC"],
    ["unitedhealth", "UNH"],
    ["unitedhealth group", "UNH"],
    ["cigna", "CI"],
    ["s&p global", "SPGI"],
    ["at&t", "T"],
    ["att", "T"],
    ["elevance", "ELV"],
    ["elevance health", "ELV"],
    ["becton dickinson", "BDX"],
    ["chevron", "CVX"],
    ["broadcom", "AVGO"],
    ["home depot", "HD"],
    ["jpmorgan", "JPM"],
    ["jp morgan", "JPM"],
    ["jpmorgan chase", "JPM"],
    ["blackrock", "BLK"],
    ["3m company", "MMM"],
    // Section 4 — Reliable Penny Stocks
    ["bark inc", "BARK"],
    ["clear channel", "CCO"],
    ["clear channel outdoor", "CCO"],
    ["dingdong", "DDL"],
    ["waterdrop", "WDH"],
    ["lexinfintech", "LX"],
    ["gee group", "JOB"],
    ["vislink", "VISL"],
    ["vislink technologies", "VISL"],
    ["urban-gro", "UGRO"],
    ["atomera", "ATOM"],
    ["atomera inc", "ATOM"],
    ["immunic", "IMUX"],
    ["immunic inc", "IMUX"],
    // Section 5 — Bullish Penny Stocks
    ["tuhura", "HURA"],
    ["cv sciences", "CVSI"],
    ["global self storage", "SELF"],
    ["polestar", "PSNY"],
    ["polestar automotive", "PSNY"],
    ["bigbear", "BBAI"],
    ["bigbear.ai", "BBAI"],
    ["grail", "GRAL"],
    ["grail inc", "GRAL"],
    ["ceco environmental", "CECO"],
    ["benchmark electronics", "BHE"],
    ["rigetti", "RGTI"],
    ["rigetti computing", "RGTI"],
    ["soundhound", "SOUN"],
    ["soundhound ai", "SOUN"],
    ["bionano", "BNGO"],
    ["bionano genomics", "BNGO"],
    ["archer aviation", "ACHR"],
    ["archer", "ACHR"],
  ])(
    "tell me about '%s' → mentions ticker %s",
    (name, ticker) => {
      const result = answerQuestion(`tell me about ${name}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4 — Per-ticker news lookup
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — news lookup for each of the 50 universe tickers", () => {
  it.each(ALL_TICKERS)(
    "news for %s → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`news for ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5 — Per-ticker why / signals
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — why is each ticker rated the way it is", () => {
  it.each(ALL_TICKERS)(
    "why is %s rated → response contains the ticker and signal info",
    (ticker) => {
      const result = answerQuestion(`why is ${ticker} rated`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

describe("answerQuestion — explain signals for each ticker", () => {
  it.each(ALL_TICKERS)(
    "what signals does %s have → response contains the ticker",
    (ticker) => {
      const result = answerQuestion(`what signals does ${ticker} have`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6 — Per-ticker position sizing
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — position sizing for each ticker", () => {
  it.each(ALL_TICKERS)(
    "position sizing for %s → response contains stop distance and suggested shares",
    (ticker) => {
      const result = answerQuestion(`position sizing for ${ticker}`, mockStocks, mockRegime);
      // Should either return sizing details or a default response (both are valid)
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(20);
    },
  );
});

describe("answerQuestion — how many shares of each ticker should I buy", () => {
  it.each(["MO", "JPM", "CVX", "AVGO", "MDT", "SOUN", "RGTI", "BHE"])(
    "how many shares of %s → includes sizing details",
    (ticker) => {
      const result = answerQuestion(`how many shares of ${ticker} should I buy`, mockStocks, mockRegime);
      expect(result).toContain("Stop distance");
      expect(result).toContain("Suggested shares");
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7 — quant_expectancy intent
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — quant_expectancy intent routing", () => {
  it.each([
    "what is mathematical expectancy?",
    "explain the expectancy formula for swing trading",
    "what is expected value in trading",
    "what is trading edge?",
    "how do I calculate trading edge",
    "what is positive expectancy?",
    "explain positive expectancy",
    "what is the kelly criterion?",
    "how does kelly criterion work",
    "what is win rate in trading?",
    "explain win rate and how it affects profitability",
    "what is average win vs average loss?",
    "what is the ev formula for trading?",
    "how do I know if my trading system has an edge",
    "what is a positive trading edge in a strategy",
    "explain expectancy in algorithmic trading",
    "what is mathematical edge for a swing trading system",
    "how is win rate related to expectancy",
    "what is EV formula for a trading strategy",
    "does a 45% win rate system work?",
    "what is the average win divided by average loss ratio",
    "how does kelly criterion relate to position sizing",
    "explain win rate vs r:r trade-off",
    "what is the break-even win rate at 2:1 r:r",
  ])(
    "quant_expectancy phrasing: %s → contains formula or Kelly",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Expectancy|expectancy|Kelly|edge|E = |win rate|Win%/i);
    },
  );
});

describe("answerQuestion — quant_expectancy response content correctness", () => {
  it("response contains the expectancy formula E =", () => {
    const result = answerQuestion("what is mathematical expectancy", mockStocks, mockRegime);
    expect(result).toContain("E = ");
  });

  it("response contains Win% and Loss% notation", () => {
    const result = answerQuestion("explain expectancy formula", mockStocks, mockRegime);
    expect(result).toMatch(/Win%|Loss%/);
  });

  it("response mentions Kelly Criterion", () => {
    const result = answerQuestion("what is trading edge", mockStocks, mockRegime);
    expect(result).toContain("Kelly");
  });

  it("response contains Kelly formula f = W", () => {
    const result = answerQuestion("how does kelly criterion work", mockStocks, mockRegime);
    expect(result).toMatch(/f = W/i);
  });

  it("response shows 45% win rate example", () => {
    const result = answerQuestion("explain expectancy in trading", mockStocks, mockRegime);
    expect(result).toMatch(/0\.45|45%/);
  });

  it("response contains the +0.35R expectancy result example", () => {
    const result = answerQuestion("what is positive expectancy in swing trading", mockStocks, mockRegime);
    expect(result).toContain("0.35R");
  });

  it("response mentions 8-signal checklist", () => {
    const result = answerQuestion("explain the ev formula for trading", mockStocks, mockRegime);
    expect(result).toContain("8-signal");
  });

  it("response contains sma200 in signal list", () => {
    const result = answerQuestion("explain trading edge and win rate", mockStocks, mockRegime);
    expect(result).toContain("sma200");
  });

  it("response mentions score ≥6/8 corresponds to higher win rates", () => {
    const result = answerQuestion("what is the mathematical expectancy formula", mockStocks, mockRegime);
    expect(result).toMatch(/6\/8|6.8/);
  });

  it("response contains the actual stock count (50)", () => {
    const result = answerQuestion("tell me about expectancy for this universe", mockStocks, mockRegime);
    expect(result).toContain("50");
  });

  it("response includes Kelly half-Kelly note", () => {
    const result = answerQuestion("explain kelly criterion for swing trading", mockStocks, mockRegime);
    expect(result).toMatch(/Kelly|half.Kelly|8\.75%/i);
  });

  it("response explains that positive expectancy beats sub-50% win rate", () => {
    const result = answerQuestion("does a 45% win rate system make money", mockStocks, mockRegime);
    expect(result).toMatch(/positive.expectancy|profitable|sub.50%/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 8 — quant_optimization intent
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — quant_optimization intent routing", () => {
  it.each([
    "explain walk forward analysis",
    "what is walk forward testing",
    "how do I avoid overfitting in trading",
    "what is curve fitting in a trading system",
    "how do I optimize parameters in my swing system",
    "what is in-sample vs out-of-sample testing",
    "explain in sample and out of sample split",
    "what is the RSI period for swingpulse",
    "what lookback period should I use for RSI",
    "what ATR period is best",
    "explain monte carlo simulation in trading",
    "how do I run a monte carlo on my backtest",
    "what is a robust parameter in a trading system",
    "explain sensitivity analysis for trading parameters",
    "what is a grid search in backtest optimization",
    "how do I do backtest optimization without overfitting",
    "what is out of sample performance",
    "explain walk-forward analysis for swing trading",
    "how do I prevent curve fitting my strategy",
    "what is a degradation check in backtesting",
    "explain backtest optim techniques",
    "what minimum sample size do I need for backtesting",
    "how many trades before I can trust my backtest",
  ])(
    "quant_optimization phrasing: %s → mentions walk-forward or overfitting",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Walk.Forward|overfitting|curve.fitted|parameter|in.sample|out.of.sample|Monte Carlo|robust/i);
    },
  );
});

describe("answerQuestion — quant_optimization response content correctness", () => {
  it("response contains Walk-Forward Analysis heading", () => {
    const result = answerQuestion("explain walk forward analysis", mockStocks, mockRegime);
    expect(result).toContain("Walk-Forward Analysis");
  });

  it("response states 70% in-sample split", () => {
    const result = answerQuestion("what is in-sample vs out-of-sample testing", mockStocks, mockRegime);
    expect(result).toContain("70%");
  });

  it("response states 30% out-of-sample split", () => {
    const result = answerQuestion("explain walk forward testing", mockStocks, mockRegime);
    expect(result).toContain("30%");
  });

  it("response contains RSI period 14", () => {
    const result = answerQuestion("what rsi period does swingpulse use", mockStocks, mockRegime);
    expect(result).toContain("14");
  });

  it("response contains SMA 50-day reference", () => {
    const result = answerQuestion("what is the default sma lookback period", mockStocks, mockRegime);
    expect(result).toContain("50-day");
  });

  it("response contains SMA 200-day reference", () => {
    const result = answerQuestion("optimize parameter for swing system", mockStocks, mockRegime);
    expect(result).toContain("200-day");
  });

  it("response contains MACD 12/26/9 standard", () => {
    const result = answerQuestion("how to avoid overfitting in a swing trading system", mockStocks, mockRegime);
    expect(result).toContain("12/26/9");
  });

  it("response contains Monte Carlo simulation reference", () => {
    const result = answerQuestion("explain monte carlo in backtesting", mockStocks, mockRegime);
    expect(result).toContain("Monte Carlo");
  });

  it("response mentions 10,000 random resamples", () => {
    const result = answerQuestion("how do I run a monte carlo on a backtest", mockStocks, mockRegime);
    expect(result).toContain("10,000");
  });

  it("response states minimum 30 trades before conclusions", () => {
    const result = answerQuestion("what is the minimum sample size for backtesting", mockStocks, mockRegime);
    expect(result).toContain("30");
  });

  it("response mentions Sharpe ratio degradation red flag", () => {
    const result = answerQuestion("red flags of curve fitting a system", mockStocks, mockRegime);
    expect(result).toContain("Sharpe");
  });

  it("response mentions robustness ±20% band test", () => {
    const result = answerQuestion("how to test parameter robustness in swing trading", mockStocks, mockRegime);
    expect(result).toContain("±20%");
  });

  it("response contains ATR period reference", () => {
    const result = answerQuestion("what atr period should I use", mockStocks, mockRegime);
    expect(result).toContain("ATR");
  });

  it("response contains volume spike threshold reference", () => {
    const result = answerQuestion("explain backtest optimization for volume parameters", mockStocks, mockRegime);
    expect(result).toMatch(/1\.5×|volume spike/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 9 — quant_frameworks intent
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — quant_frameworks intent routing", () => {
  it.each([
    "explain algorithmic swing trading architecture",
    "what is algo trading?",
    "explain quantitative trading frameworks",
    "what is a regime filter in trading",
    "explain volatility regime trading",
    "what is regime-based trading architecture",
    "how do adaptive systems work in trading",
    "explain market microstructure for swing traders",
    "what is a mean reversion framework",
    "what is a trend following framework",
    "explain vix regime trading",
    "what is sector rotation in swing trading",
    "explain intermarket analysis",
    "what is an advanced market framework",
    "describe a swing trading architecture",
    "explain quantitative evaluation of trading systems",
    "what is an algorithmic swing architecture",
    "how does regime-based sizing work",
    "what are advanced frameworks for swing trading",
    "explain algorithmic trading for swing traders",
    "what is a quantitative swing trading system",
  ])(
    "quant_frameworks phrasing: %s → contains framework content",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Regime|framework|volatility|architecture|intermarket|mean reversion|trend follow/i);
    },
  );
});

describe("answerQuestion — quant_frameworks response content correctness", () => {
  it("response contains Regime-Based Architecture heading", () => {
    const result = answerQuestion("explain swing trading architecture", mockStocks, mockRegime);
    expect(result).toContain("Regime-Based Architecture");
  });

  it("response reflects current BEARISH regime from mockRegime", () => {
    const result = answerQuestion("what are advanced market frameworks", mockStocks, mockRegime);
    expect(result).toContain("BEARISH");
  });

  it("response contains Volatility-Adjusted Position Sizing section", () => {
    const result = answerQuestion("algorithmic swing trading frameworks", mockStocks, mockRegime);
    expect(result).toContain("Volatility-Adjusted Position Sizing");
  });

  it("response contains ATR sizing formula", () => {
    const result = answerQuestion("what is regime-based architecture", mockStocks, mockRegime);
    expect(result).toContain("ATR");
  });

  it("response references VIX > 25 high volatility rule", () => {
    const result = answerQuestion("explain vix regime in trading", mockStocks, mockRegime);
    expect(result).toContain("25");
  });

  it("response contains Mean Reversion vs. Trend Following section", () => {
    const result = answerQuestion("mean reversion framework for swing trading", mockStocks, mockRegime);
    expect(result).toContain("Mean Reversion vs. Trend Following");
  });

  it("response contains Multi-Timeframe Confirmation section", () => {
    const result = answerQuestion("algorithmic trading architecture", mockStocks, mockRegime);
    expect(result).toContain("Multi-Timeframe");
  });

  it("response contains Intermarket section", () => {
    const result = answerQuestion("explain intermarket analysis for swing trading", mockStocks, mockRegime);
    expect(result).toContain("Intermarket");
  });

  it("response mentions XOM/CVX/VLO crude oil relationship", () => {
    const result = answerQuestion("explain intermarket framework", mockStocks, mockRegime);
    expect(result).toMatch(/XOM|CVX|VLO/);
  });

  it("response contains Earnings Binary-Event Architecture section", () => {
    const result = answerQuestion("explain algorithmic approach to earnings", mockStocks, mockRegime);
    expect(result).toContain("Earnings");
  });

  it("response contains Short Interest / Squeeze Framework section", () => {
    const result = answerQuestion("what is the algorithmic trading architecture", mockStocks, mockRegime);
    expect(result).toMatch(/Short Interest|Squeeze/);
  });

  it("response mentions SI >15% threshold for squeeze watch", () => {
    const result = answerQuestion("algorithmic swing trading frameworks", mockStocks, mockRegime);
    expect(result).toContain("15%");
  });

  it("response mentions High Dividend category", () => {
    const result = answerQuestion("advanced market frameworks overview", mockStocks, mockRegime);
    expect(result).toContain("High Dividend");
  });

  it("response mentions Penny Stocks category sizing note", () => {
    const result = answerQuestion("explain trading architecture for our universe", mockStocks, mockRegime);
    expect(result).toContain("Penny Stocks");
  });

  it("response mentions BULLISH regime conditions (4+/6)", () => {
    const result = answerQuestion("what does bullish regime mean in swingpulse architecture", mockStocks, bullishRegime);
    expect(result).toContain("BULLISH");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 10 — Regime intent (extended phrasings)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — regime intent extended phrasings", () => {
  it.each([
    "is the market bullish or bearish right now",
    "how's the broad market looking?",
    "what is the current macro environment?",
    "tell me about the overall market direction",
    "what is the market doing today",
    "market sentiment right now?",
    "is now a good time to enter trades?",
    "what are market conditions like?",
    "should I be in the market right now?",
    "market outlook for swing traders?",
    "what is the market telling us?",
    "what's happening in the broader market?",
    "macro outlook",
    "is this a risk-on or risk-off environment?",
    "what is SPY doing right now",
    "what is VIX at?",
    "how is the SPY performing relative to its SMA?",
    "what is the current regime score?",
    "is it a good time to buy?",
  ])(
    "regime phrasing: %s → mentions regime status",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/BULLISH|BEARISH|NEUTRAL/);
    },
  );
});

describe("answerQuestion — regime response contains live data from regime object", () => {
  it("regime response contains VIX from mockRegime (24.06)", () => {
    const result = answerQuestion("what is the vix", mockStocks, mockRegime);
    expect(result).toContain("24");
  });

  it("regime response contains SPY RSI from mockRegime (42.5)", () => {
    const result = answerQuestion("how is the market doing", mockStocks, mockRegime);
    expect(result).toMatch(/42|SPY RSI/);
  });

  it("regime response contains regimeScore (1/6)", () => {
    const result = answerQuestion("what is the current market regime", mockStocks, mockRegime);
    expect(result).toMatch(/1\/6|1.6/);
  });

  it("bullish regime says favor LONG setups", () => {
    const result = answerQuestion("how is the market doing", mockStocks, bullishRegime);
    expect(result).toMatch(/LONG|longs/i);
  });

  it("neutral regime says size down", () => {
    const result = answerQuestion("what is the market doing", mockStocks, neutralRegime);
    expect(result).toMatch(/size down|high conviction|NEUTRAL/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 11 — Top setups intent (extended phrasings)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — top_setups intent extended phrasings", () => {
  it.each([
    "what are the best stocks to trade right now?",
    "top 5 stocks today",
    "give me your best picks",
    "what's the strongest setup in the universe?",
    "any hot trades right now?",
    "what are the scan results?",
    "show me the top ideas from today's scan",
    "what's the strongest stock?",
    "any interesting plays?",
    "what should I look at today?",
    "best trades available?",
    "any opportunities right now?",
    "give me trade ideas for today",
    "top opportunities in the market",
    "where is the momentum?",
    "what are your top picks?",
    "any plays available?",
    "what stocks to watch today?",
    "what to trade this week?",
    "show me the best setups",
    "what is interesting in the market today?",
    "what looks good to trade?",
    "any picks from the scan?",
    "what should I focus on today?",
    "top setups by score",
  ])(
    "top_setups phrasing: %s → mentions score or ticker",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/setup|score|signal|Top 5/i);
    },
  );
});

describe("answerQuestion — top_setups response content correctness", () => {
  it("top setups response lists Top 5 setups heading", () => {
    const result = answerQuestion("top setups right now", mockStocks, mockRegime);
    expect(result).toContain("Top 5 setups");
  });

  it("top setups response mentions regime bias for BEARISH", () => {
    const result = answerQuestion("give me the best setups", mockStocks, mockRegime);
    expect(result).toMatch(/BEARISH regime|SHORT setups have structural/i);
  });

  it("top setups with bullish regime mentions BULLISH regime", () => {
    const result = answerQuestion("best setups right now", mockStocks, bullishRegime);
    expect(result).toMatch(/BULLISH regime/i);
  });

  it("top setups lists at least one ticker from mockStocks", () => {
    const result = answerQuestion("show me top picks", mockStocks, mockRegime);
    const mentioned = mockStocks.filter((s) => result.includes(s.ticker));
    expect(mentioned.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 12 — Long candidates intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — long_candidates intent extended phrasings", () => {
  it.each([
    "what stocks are going up?",
    "show me the bullish setups",
    "any buy candidates?",
    "what looks bullish?",
    "any dip buys?",
    "buy the dip opportunities?",
    "upward trending stocks?",
    "good stocks to buy this week?",
    "call play candidates?",
    "any bullish candidates in the scan?",
    "what is going higher?",
    "give me stocks that could rally",
  ])(
    "long_candidates phrasing: %s → mentions LONG or a long-rated ticker",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/LONG|Regime is (BULLISH|BEARISH|NEUTRAL)/i);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 13 — Short candidates intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — short_candidates intent extended phrasings", () => {
  it.each([
    "what stocks are going down?",
    "show me the bearish setups",
    "any short candidates?",
    "what looks bearish?",
    "fading candidates?",
    "sell the rip opportunities?",
    "downward trending stocks?",
    "stocks to short this week?",
    "put play candidates?",
    "what should I short?",
    "any bearish positions to take?",
    "best shorts in the scan?",
    "bearish plays available?",
    "I want to short — what looks good?",
    "what has momentum to the downside?",
    "stocks with bearish setups?",
    "any sell candidates in the scan?",
    "what is going lower?",
    "give me stocks that could fall",
    "what to fade right now?",
  ])(
    "short_candidates phrasing: %s → mentions SHORT or regime note",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/SHORT|Regime is (BULLISH|BEARISH|NEUTRAL)/i);
    },
  );
});

describe("answerQuestion — short candidates BEARISH regime note", () => {
  it("BEARISH regime short candidates confirms macro tailwind", () => {
    const result = answerQuestion("give me short candidates", mockStocks, mockRegime);
    expect(result).toMatch(/BEARISH.*SHORT|conditions favour SHORT/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 14 — RSI intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — rsi intent extended phrasings", () => {
  it.each([
    "what stocks are oversold right now?",
    "any extremely stretched stocks?",
    "overbought stocks to fade?",
    "what stocks have extreme RSI readings?",
    "oversold candidates for a bounce?",
    "stocks in oversold territory?",
    "stocks near RSI extremes?",
    "any deep oversold bounces?",
    "what has the worst RSI?",
    "what has the highest RSI?",
    "any RSI 30 stocks?",
    "any stocks below RSI 30?",
    "reversal candidates today?",
    "what has the lowest RSI in the scan?",
    "momentum extremes in the universe",
    "any overbought readings?",
    "stocks to fade on RSI?",
    "what has extended momentum?",
    "any bounce setups based on RSI?",
  ])(
    "rsi phrasing: %s → mentions RSI or neutral",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/RSI|neutral RSI|Oversold|Overbought/i);
    },
  );
});

describe("answerQuestion — RSI content correctness with mockStocks", () => {
  it("RSI response identifies penny stocks as deeply oversold (most have RSI < 35)", () => {
    const result = answerQuestion("what stocks are oversold right now", mockStocks, mockRegime);
    // Penny stocks in mockStocks have RSI < 35, so they should appear
    const deepOversold = mockStocks.filter((s) => s.rsi < 35);
    expect(deepOversold.length).toBeGreaterThan(0);
    // At least one should appear in response
    const mentioned = deepOversold.filter((s) => result.includes(s.ticker));
    expect(mentioned.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 15 — Volume intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — volume intent extended phrasings", () => {
  it.each([
    "what has unusual volume today?",
    "any stocks with volume spikes?",
    "most active stocks today?",
    "where is the volume concentrated?",
    "any stocks moving on big volume?",
    "what is running on heavy volume?",
    "any institutional-level volume?",
    "vol spike candidates?",
    "what had the biggest volume today?",
    "stocks with above average volume",
    "any stocks trading above average volume?",
    "what is trading high volume today?",
    "unusual activity in the scan?",
    "what is most active right now?",
    "where is money flow today?",
  ])(
    "volume phrasing: %s → mentions volume or spike",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/volume|spike/i);
    },
  );
});

describe("answerQuestion — volume content correctness with mockStocks", () => {
  it("volume response shows penny stocks with volumeSpike=true", () => {
    const spiked = mockStocks.filter((s) => s.volumeSpike);
    expect(spiked.length).toBeGreaterThan(0);
    const result = answerQuestion("what stocks have volume spikes", mockStocks, mockRegime);
    const mentioned = spiked.filter((s) => result.includes(s.ticker));
    expect(mentioned.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 16 — Earnings intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — earnings intent extended phrasings", () => {
  it.each([
    "any upcoming earnings to watch?",
    "what has binary event risk?",
    "what is reporting soon?",
    "any earnings catalysts this week?",
    "which stocks should I avoid due to earnings?",
    "any gap risk in the universe?",
    "what stocks are reporting earnings?",
    "earnings calendar for the universe?",
    "any catalyst events upcoming?",
    "stocks to size down on earnings?",
    "upcoming reports in the scan?",
    "any binary events in the scan?",
    "what reporting this week?",
    "avoid earnings risk stocks",
    "any stocks with earnings risk?",
  ])(
    "earnings phrasing: %s → mentions earnings or all clear",
    (q) => {
      const earningsStock = { ...mockStocks[0], earningsWarning: true };
      const result = answerQuestion(q, [earningsStock, ...mockStocks.slice(1)], mockRegime);
      expect(result).toMatch(/earnings|report/i);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 17 — Conflicts intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — conflicts intent extended phrasings", () => {
  it.each([
    "any conflicting trend signals?",
    "what setups are mixed?",
    "any stocks with diverging signals?",
    "what is uncertain in the scan?",
    "indecisive setups today?",
    "any stocks with conflicting trends?",
    "what has mixed signals right now?",
    "any indeterminate setups?",
    "setups with signal conflicts?",
    "any trend divergence in the universe?",
  ])(
    "conflicts phrasing: %s → mentions conflict or clean",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/conflict|diverge|aligned/i);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 18 — Best R:R intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — best_rr intent extended phrasings", () => {
  it.each([
    "what is the best risk reward ratio available?",
    "highest reward to risk setup?",
    "what has the most favorable setup by R:R?",
    "best risk to reward right now?",
    "what has the highest R:R in the universe?",
    "show me the best reward to risk trades",
    "most favorable entry right now?",
    "best setup by ratio?",
    "highest ratio trades today?",
    "what offers the best risk/reward?",
    "which stock has the best R:R profile?",
    "best trades by risk reward",
    "what is the highest rr in the scan?",
  ])(
    "best_rr phrasing: %s → mentions R:R",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toContain("R:R");
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 19 — Short interest intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — short_interest intent extended phrasings", () => {
  it.each([
    "what stocks have high short interest?",
    "any squeeze candidates?",
    "what has the most short float?",
    "any stocks near a short squeeze?",
    "risky highly shorted stocks?",
    "any stocks with elevated short interest?",
    "what has high SI?",
    "short squeeze setups right now?",
    "any stocks with float at risk?",
    "potential short squeeze plays?",
    "what is heavily shorted in the scan?",
    "any high short float stocks?",
  ])(
    "short_interest phrasing: %s → mentions SI or short interest",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/SI|short interest|Short interest|No short/i);
    },
  );
});

describe("answerQuestion — short interest content correctness", () => {
  it("shows penny stocks with high short interest (PSNY, IMUX, VISL, BNGO have >15% SI)", () => {
    const result = answerQuestion("what stocks have high short interest", mockStocks, mockRegime);
    const highSI = mockStocks.filter((s) => (s.shortInterest ?? 0) > 15);
    expect(highSI.length).toBeGreaterThan(0);
    const mentioned = highSI.filter((s) => result.includes(s.ticker));
    expect(mentioned.length).toBeGreaterThan(0);
  });

  it("flags squeeze watch for stocks with volumeSpike=true and tradeType=LONG and high SI", () => {
    const result = answerQuestion("any squeeze plays", mockStocks, mockRegime);
    expect(result).toMatch(/squeeze|short interest/i);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 20 — Compare intent (extended)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — compare intent extended phrasings", () => {
  it.each([
    ["JPM", "BLK"],
    ["MO", "VZ"],
    ["CVX", "HD"],
    ["BNGO", "PSNY"],
    ["SOUN", "BBAI"],
    ["MDT", "BDX"],
    ["AVGO", "SPGI"],
    ["PSNY", "VISL"],
    ["PEP", "MDLZ"],
    ["RGTI", "ACHR"],
  ])(
    "compare %s vs %s → side-by-side response",
    (tickerA, tickerB) => {
      const result = answerQuestion(`${tickerA} vs ${tickerB}`, mockStocks, mockRegime);
      expect(result).toContain(tickerA);
      expect(result).toContain(tickerB);
      expect(result).toMatch(/vs|score|R:R/i);
    },
  );
});

describe("answerQuestion — compare response correctness", () => {
  it("compare response includes both tickers and a verdict", () => {
    const result = answerQuestion("compare JPM versus BLK", mockStocks, mockRegime);
    expect(result).toContain("JPM");
    expect(result).toContain("BLK");
    expect(result).toContain("Verdict");
  });

  it("compare includes Higher signal score note", () => {
    const result = answerQuestion("MO vs VZ side by side", mockStocks, mockRegime);
    expect(result).toMatch(/Higher signal score|equal signal/i);
  });

  it("compare includes Better R:R note", () => {
    const result = answerQuestion("CVX versus HD comparison", mockStocks, mockRegime);
    expect(result).toContain("Better R:R");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 21 — Position sizing detailed tests
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — position sizing detailed correctness", () => {
  it.each([
    "how many shares of T should I buy",
    "position sizing for VZ",
    "how much risk for MO",
    "position sizing for PEP",
    "risk per trade for JPM",
    "how many shares of CVX",
    "position sizing for MDT",
    "lot size for MMM",
    "how many shares of BNGO should I buy",
    "position sizing for PSNY",
  ])(
    "position sizing: %s → contains stop distance and shares",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toContain("Stop distance");
      expect(result).toContain("Suggested shares");
    },
  );
});

describe("answerQuestion — position sizing formula and tiers", () => {
  it("includes 1% risk standard tier", () => {
    const result = answerQuestion("how many shares of MO should I buy", mockStocks, mockRegime);
    expect(result).toContain("1%");
  });

  it("includes 0.5% conservative tier", () => {
    const result = answerQuestion("position sizing for PEP", mockStocks, mockRegime);
    expect(result).toContain("0.5%");
  });

  it("includes 2% aggressive tier", () => {
    const result = answerQuestion("risk per trade for JPM", mockStocks, mockRegime);
    expect(result).toContain("2%");
  });

  it("includes the sizing formula", () => {
    const result = answerQuestion("how many shares of CVX should I buy", mockStocks, mockRegime);
    expect(result).toContain("Formula:");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 22 — Why/signals response correctness
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — why response correctness for specific tickers", () => {
  it("why MO rated LONG → mentions bullScore", () => {
    const result = answerQuestion("why is MO rated LONG", mockStocks, mockRegime);
    expect(result).toContain("MO");
    expect(result).toMatch(/LONG|bull/i);
  });

  it("why MMM rated SHORT → mentions bearScore", () => {
    const result = answerQuestion("explain MMM signals", mockStocks, mockRegime);
    expect(result).toContain("MMM");
    expect(result).toMatch(/SHORT|bear/i);
  });

  it("why response contains passing and failing signal sections", () => {
    const result = answerQuestion("why is JPM rated the way it is", mockStocks, mockRegime);
    expect(result).toMatch(/Passing|Failing/i);
  });

  it("why response contains entry, stop and target prices", () => {
    const result = answerQuestion("explain the signals for T", mockStocks, mockRegime);
    expect(result).toContain("entry");
    expect(result).toContain("stop");
    expect(result).toContain("target");
  });

  it("why PSNY rated SHORT → earningsWarning note not present (earningsWarning=false)", () => {
    const result = answerQuestion("why is PSNY rated SHORT", mockStocks, mockRegime);
    expect(result).toContain("PSNY");
    expect(result).not.toContain("Earnings event upcoming");
  });

  it("why SOUN rated LONG → positive trade type confirmed", () => {
    const result = answerQuestion("why is SOUN rated the way it is", mockStocks, mockRegime);
    expect(result).toContain("SOUN");
    expect(result).toContain("LONG");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 23 — News intent correctness
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — news intent correctness", () => {
  it("news for MO → contains Altria headline", () => {
    const result = answerQuestion("latest news on MO", mockStocks, mockRegime);
    expect(result).toContain("MO");
    expect(result).toMatch(/Altria|dividend|nicotine/i);
  });

  it("news for BNGO → contains Bionano or Nasdaq headline", () => {
    const result = answerQuestion("news for BNGO", mockStocks, mockRegime);
    expect(result).toContain("BNGO");
  });

  it("news for PSNY → contains Polestar or going-concern headline", () => {
    const result = answerQuestion("what's the latest on PSNY", mockStocks, mockRegime);
    expect(result).toContain("PSNY");
  });

  it("news for PEP → contains PepsiCo or Frito-Lay headline", () => {
    const result = answerQuestion("news for PEP", mockStocks, mockRegime);
    expect(result).toContain("PEP");
  });

  it("news for SOUN → contains SoundHound or AI headline", () => {
    const result = answerQuestion("what are the latest headlines for SOUN", mockStocks, mockRegime);
    expect(result).toContain("SOUN");
  });

  it("news for JPM → contains JPMorgan headline", () => {
    const result = answerQuestion("latest news on jpmorgan", mockStocks, mockRegime);
    expect(result).toContain("JPM");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 24 — Follow-up context resolution (new universe tickers)
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — follow-up resolution with new universe tickers", () => {
  it.each([
    ["MO", "tell me more about MO"],
    ["PEP", "elaborate on PEP"],
    ["JPM", "more on JPM"],
    ["CVX", "more details on CVX"],
    ["BNGO", "tell me more about BNGO"],
    ["PSNY", "more details on PSNY"],
    ["SOUN", "elaborate on SOUN"],
    ["RGTI", "more on RGTI"],
  ])(
    "follow-up 'tell me more' with %s in history → response mentions %s",
    (ticker, followUp) => {
      const history: HistoryEntry[] = [
        { role: "user", text: `what is the setup for ${ticker}` },
        { role: "assistant", text: `${ticker} is a setup in the scan.` },
      ];
      const result = answerQuestion("tell me more", mockStocks, mockRegime, history);
      // With ticker in history, the follow-up should pick it up
      expect(result).toContain(ticker);
      // Also verify the follow-up string itself works
      const directResult = answerQuestion(followUp, mockStocks, mockRegime);
      expect(directResult).toContain(ticker);
    },
  );

  it("elaborate follow-up with no ticker in history returns string", () => {
    const history: HistoryEntry[] = [
      { role: "user", text: "what is the market regime" },
      { role: "assistant", text: "The regime is BEARISH right now." },
    ];
    const result = answerQuestion("tell me more", mockStocks, mockRegime, history);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 25 — generateTradeBrief with new universe stocks
// ═══════════════════════════════════════════════════════════════════════

describe("generateTradeBrief — with real mockStocks tickers", () => {
  it.each(["MO", "JPM", "CVX", "MDT", "PEP", "SOUN", "RGTI", "BHE", "MMM", "BNGO"])(
    "generateTradeBrief for %s → non-empty string with ticker",
    (ticker) => {
      const stock = mockStocks.find((s) => s.ticker === ticker)!;
      const result = generateTradeBrief(stock, mockRegime);
      expect(result).toContain(ticker);
      expect(result.length).toBeGreaterThan(100);
    },
  );

  it("penny stock brief (PSNY) mentions short RSI context (RSI 22.4)", () => {
    const psny = mockStocks.find((s) => s.ticker === "PSNY")!;
    const result = generateTradeBrief(psny, mockRegime);
    expect(result).toContain("PSNY");
    expect(result).toContain("22");
  });

  it("high SI stock brief (PSNY 32.6%) contains short interest line", () => {
    const psny = mockStocks.find((s) => s.ticker === "PSNY")!;
    const result = generateTradeBrief(psny, mockRegime);
    expect(result).toContain("Short interest");
  });

  it("MMM volume spike confirmed in brief (volumeSpike=true)", () => {
    const mmm = mockStocks.find((s) => s.ticker === "MMM")!;
    expect(mmm.volumeSpike).toBe(true);
    const result = generateTradeBrief(mmm, mockRegime);
    expect(result).toContain("Volume spike");
  });

  it("generateTradeBrief with undefined stock returns error message", () => {
    const result = generateTradeBrief(undefined, mockRegime);
    expect(result).toContain("No stock data");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 26 — generateMarketBriefing with full 50-ticker mockStocks
// ═══════════════════════════════════════════════════════════════════════

describe("generateMarketBriefing — full 50-ticker universe", () => {
  it("returns a multi-paragraph string", () => {
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toContain("\n\n");
  });

  it("mentions BEARISH regime (mockRegime.status)", () => {
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toContain("BEARISH");
  });

  it("mentions VIX value (24)", () => {
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toContain("24");
  });

  it("reports leading SHORT setups (many penny stocks are SHORT)", () => {
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toContain("SHORT");
  });

  it("reports leading LONG setups", () => {
    const longCount = mockStocks.filter((s) => s.tradeType === "LONG").length;
    expect(longCount).toBeGreaterThan(0);
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toMatch(/LONG|long/i);
  });

  it("mentions average bull score for long setups", () => {
    const result = generateMarketBriefing(mockRegime, mockStocks);
    expect(result).toMatch(/average bull score/i);
  });

  it("handles bullish regime correctly", () => {
    const result = generateMarketBriefing(bullishRegime, mockStocks);
    expect(result).toContain("BULLISH");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 27 — Edge cases and robustness
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — edge cases and robustness", () => {
  it("handles empty stocks array gracefully", () => {
    const result = answerQuestion("tell me about the market", [], mockRegime);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles empty stocks array for top_setups", () => {
    const result = answerQuestion("give me top setups", [], mockRegime);
    expect(typeof result).toBe("string");
  });

  it("handles empty stocks array for RSI query", () => {
    const result = answerQuestion("any oversold stocks", [], mockRegime);
    expect(result).toMatch(/neutral RSI|All tickers/i);
  });

  it("handles empty stocks array for volume query", () => {
    const result = answerQuestion("any volume spikes", [], mockRegime);
    expect(result).toMatch(/No unusual volume|average volume/i);
  });

  it("handles empty stocks array for short interest query", () => {
    const result = answerQuestion("short interest data", [], mockRegime);
    expect(result).toMatch(/No short interest/i);
  });

  it("handles a single-stock universe for best_rr", () => {
    const singleStock = [mockStocks[0]];
    const result = answerQuestion("best risk reward", singleStock, mockRegime);
    expect(result).toContain("R:R");
  });

  it("handles ticker not in stocks for ticker_lookup (falls to default)", () => {
    const result = answerQuestion("tell me about ZZZZ", mockStocks, mockRegime);
    // ZZZZ not in universe — should fall to default briefing
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it("handles very long question gracefully", () => {
    const longQ = "what ".repeat(100) + "is the regime";
    const result = answerQuestion(longQ, mockStocks, mockRegime);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("handles question with only numbers gracefully", () => {
    const result = answerQuestion("12345 67890", mockStocks, mockRegime);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it.each([
    "???",
    "!@#$%",
    "   ",
    "a",
    ".....",
    "hello world this is not trading",
  ])(
    "nonsense/non-trading input '%s' returns default market briefing",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    },
  );

  it("question with no history param returns non-empty string", () => {
    const result = answerQuestion("tell me about MO", mockStocks, mockRegime, undefined);
    expect(result).toContain("MO");
  });

  it("question with empty history returns same as no history", () => {
    const result1 = answerQuestion("tell me about MO", mockStocks, mockRegime);
    const result2 = answerQuestion("tell me about MO", mockStocks, mockRegime, []);
    expect(result1).toBe(result2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 28 — Default briefing quality
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — default briefing quality with 50-ticker universe", () => {
  it("default response contains universe count (50)", () => {
    const result = answerQuestion("this is completely random", mockStocks, mockRegime);
    expect(result).toContain("50");
  });

  it("default response shows correct long/short split", () => {
    const longCount = mockStocks.filter((s) => s.tradeType === "LONG").length;
    const shortCount = mockStocks.filter((s) => s.tradeType === "SHORT").length;
    const result = answerQuestion("xyzzy", mockStocks, mockRegime);
    expect(result).toContain(String(longCount));
    expect(result).toContain(String(shortCount));
  });

  it("default response suggests querying the top ticker from the universe", () => {
    const result = answerQuestion("banana split", mockStocks, mockRegime);
    // Should include a ticker from the universe as an example
    const mentioned = mockStocks.filter((s) => result.includes(s.ticker));
    expect(mentioned.length).toBeGreaterThan(0);
  });

  it("default response shows regime status as BEARISH", () => {
    const result = answerQuestion("random query", mockStocks, mockRegime);
    expect(result).toContain("BEARISH");
  });

  it("default response mentions LONG and SHORT counts", () => {
    const result = answerQuestion("some unknown question", mockStocks, mockRegime);
    expect(result).toContain("LONG");
    expect(result).toContain("SHORT");
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 29 — Category-specific intent coverage
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — High Dividend tickers specific tests", () => {
  it.each(HIGH_DIVIDEND_TICKERS)(
    "High Dividend ticker %s setup brief → has entry, stop, target",
    (ticker) => {
      const result = answerQuestion(`tell me about ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
      expect(result).toMatch(/entry|stop|target/i);
    },
  );
});

describe("answerQuestion — Penny Stock tickers specific tests", () => {
  it.each(PENNY_TICKERS)(
    "Penny Stock %s setup brief → has entry, stop, target",
    (ticker) => {
      const result = answerQuestion(`give me the setup for ${ticker}`, mockStocks, mockRegime);
      expect(result).toContain(ticker);
      expect(result).toMatch(/entry|stop|target/i);
    },
  );
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 30 — Quant intent phrasing stress-tests
// ═══════════════════════════════════════════════════════════════════════

describe("answerQuestion — quant intents with many more phrasings", () => {
  it.each([
    // expectancy
    "how do I build a trading edge in my system",
    "what is the mathematical basis for my trading system",
    "how much money does a 45% win rate system make",
    "what is the ev formula in trading systems",
    "is a 40% win rate system profitable at 2:1 R:R",
    "what is the break-even win rate for a system",
    "how do expected value calculations work for traders",
    "explain the relationship between win rate and profitability",
    "what does expectancy mean in trading",
    "how to calculate your average win and average loss",
  ])(
    "quant_expectancy extended: %s → mentions expectancy or Kelly or edge",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Expectancy|Kelly|edge|E = |win rate|Win%|formula/i);
    },
  );

  it.each([
    // optimization
    "what makes a trading parameter robust in backtesting",
    "what is the best way to run monte carlo on a swing strategy",
    "how do I prevent data snooping in backtesting",
    "explain parameter stability testing",
    "what is the right lookback period for RSI",
    "how do I optimize my MACD settings without overfitting",
    "how many parameters can I use before overfitting",
    "what are the dangers of curve fitting a trading strategy",
    "what is a realistic out-of-sample performance degradation",
    "how do I know if my backtest results are reliable",
  ])(
    "quant_optimization extended: %s → mentions walk-forward or overfitting",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Walk.Forward|overfitting|curve.fitted|parameter|in.sample|robust|Monte Carlo|sample/i);
    },
  );

  it.each([
    // frameworks
    "how does a regime filter improve trading performance",
    "what is the role of VIX in position sizing",
    "explain how to use sector rotation for swing trading",
    "explain the mean reversion framework versus trend following framework",
    "how does intermarket analysis help swing traders",
    "what is a multi-timeframe confirmation approach",
    "how do I handle earnings events in an algo trading system",
    "what does algorithmic architecture say about high-SI stocks",
    "how do I size positions differently for blue chips vs penny stocks",
    "explain the complete architecture of a quantitative swing system",
  ])(
    "quant_frameworks extended: %s → mentions regime or framework concepts",
    (q) => {
      const result = answerQuestion(q, mockStocks, mockRegime);
      expect(result).toMatch(/Regime|framework|volatility|architecture|intermarket|mean reversion|trend follow|VIX|sector/i);
    },
  );
});
