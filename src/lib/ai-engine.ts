/**
 * Built-in AI engine — zero external API calls.
 * All analysis is derived from the app's in-memory Stock and RegimeData objects.
 */

import type { Stock, RegimeData } from "@/lib/types";

// ── Knowledge & Broker types (mirror of edge function) ────────────────────────

export interface TradingKnowledgeRecord {
    id: string;
    category: "swing_principles" | "risk_management" | "order_mechanics" | "broker_workflows" | "app_help";
    title: string;
    content: string;
    tags: string[];
    broker: string | null;
    platform: string | null;
    source_id: string | null;
}

export interface KnowledgeSourceRecord {
    id: string;
    publisher: string;
    trust_tier: string;
    url: string;
}

export interface KnowledgeMatch extends TradingKnowledgeRecord {
    sourceLabel: string | null;
    sourceUrl: string | null;
    trustTier: string | null;
}

export interface BrokerWorkflowRecord {
    id: string;
    broker: string;
    platform: string;
    instrument: string;
    order_types_supported: string[];
    steps_json: string[];
}

export interface SourceChip {
    label: string;
    url: string;
}

export interface HistoryEntry {
    role: "user" | "assistant";
    text: string;
}

const BROKER_KEYWORDS: Record<string, string> = {
    "robinhood": "Robinhood",
    "fidelity": "Fidelity",
    "interactive brokers": "Interactive Brokers",
    "ibkr": "Interactive Brokers",
    "webull": "Webull",
    "moomoo": "Moomoo",
};

export function scoreKnowledgeMatch(question: string, item: TradingKnowledgeRecord): number {
    const q = question.toLowerCase();
    let score = 0;

    if (q.includes(item.category.replace(/_/g, " "))) score += 2;
    if (item.broker && q.includes(item.broker.toLowerCase())) score += 4;
    if (item.platform && q.includes(item.platform.toLowerCase())) score += 1;

    for (const tag of item.tags ?? []) {
        if (q.includes(tag.toLowerCase())) score += 2;
    }

    const titleWords = item.title.toLowerCase().split(/\s+/);
    for (const word of titleWords) {
        if (word.length >= 4 && q.includes(word)) score += 1;
    }

    if (
        item.category === "app_help" &&
        /score|regime|setup|signal|bull|bear|long|short|atr|entry|stop|target|r:r|risk.reward|panel|dashboard|swingpulse|universe|watchlist|position|backtest|volume.ratio|52.week|earnings.warning/.test(q)
    ) {
        score += 1;
    }

    return score;
}

export function rankKnowledgeMatches(
    question: string,
    rows: TradingKnowledgeRecord[],
    sourceRows: KnowledgeSourceRecord[],
): KnowledgeMatch[] {
    const sourcesById = new Map(sourceRows.map((s) => [s.id, s]));
    return rows
        .map((item) => {
            const source = item.source_id ? sourcesById.get(item.source_id) : undefined;
            return {
                ...item,
                sourceLabel: source?.publisher ?? null,
                sourceUrl: source?.url ?? null,
                trustTier: source?.trust_tier ?? null,
            };
        })
        .map((item) => ({ item, score: scoreKnowledgeMatch(question, item) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map((entry) => entry.item);
}

export function filterBrokerWorkflows(question: string, rows: BrokerWorkflowRecord[]): BrokerWorkflowRecord[] {
    const q = question.toLowerCase();
    const mentioned = new Set<string>();
    for (const [keyword, name] of Object.entries(BROKER_KEYWORDS)) {
        if (q.includes(keyword)) mentioned.add(name);
    }
    if (mentioned.size === 0) return [];
    return rows.filter((wf) => mentioned.has(wf.broker));
}

export function buildSources(matches: KnowledgeMatch[]): SourceChip[] {
    const deduped = new Map<string, SourceChip>();
    for (const match of matches) {
        if (!match.sourceLabel || !match.sourceUrl) continue;
        const key = `${match.sourceLabel}::${match.sourceUrl}`;
        if (!deduped.has(key)) {
            deduped.set(key, { label: match.sourceLabel, url: match.sourceUrl });
        }
        if (deduped.size >= 3) break;
    }
    return [...deduped.values()];
}

export function questionMentionsBroker(question: string): boolean {
    const q = question.toLowerCase();
    return Object.keys(BROKER_KEYWORDS).some((k) => q.includes(k));
}

// ── Company name → ticker aliases (covers the 50-ticker universe + common aliases) ─
const COMPANY_NAMES: Record<string, string> = {
    // ── High Dividend Yield & High Earnings ──────────────────────────────────
    "at&t": "T",
    "att": "T",
    "verizon": "VZ",
    "altria": "MO",
    "philip morris": "PM",
    "pm international": "PM",
    "coca-cola": "KO",
    "coca cola": "KO",
    "coke": "KO",
    "pepsico": "PEP",
    "pepsi": "PEP",
    "johnson & johnson": "JNJ",
    "johnson and johnson": "JNJ",
    "jnj": "JNJ",
    "pfizer": "PFE",
    "ibm": "IBM",
    "chevron": "CVX",
    "exxonmobil": "XOM",
    "exxon": "XOM",
    "exxon mobil": "XOM",
    "jpmorgan": "JPM",
    "jp morgan": "JPM",
    "jpmorgan chase": "JPM",
    "bank of america": "BAC",
    "bofa": "BAC",
    "abbvie": "ABBV",
    "mcdonalds": "MCD",
    "mcdonald's": "MCD",
    "home depot": "HD",
    "caterpillar": "CAT",
    "ups": "UPS",
    "united parcel service": "UPS",
    "valero": "VLO",
    "enterprise products": "EPD",
    "realty income": "O",
    "williams companies": "WMB",
    "lyondellbasell": "LYB",
    "lyb": "LYB",
    "wells fargo": "WFC",
    "3m": "MMM",
    "3m company": "MMM",
    // ── Penny Stocks ─────────────────────────────────────────────────────────
    "sundial": "SNDL",
    "sundial growers": "SNDL",
    "tilray": "TLRY",
    "tilray brands": "TLRY",
    "workhorse": "WKHS",
    "workhorse group": "WKHS",
    "nikola": "NKLA",
    "nikola corp": "NKLA",
    "microvision": "MVIS",
    "clover health": "CLOV",
    "ocugen": "OCGN",
    "mindmed": "MNMD",
    "genius brands": "GNUS",
    "bionano": "BNGO",
    "bionano genomics": "BNGO",
    "hyliion": "HYLN",
    "chargepoint": "CHPT",
    "charge point": "CHPT",
    "blink charging": "BLNK",
    "bit digital": "BTBT",
    "katapult": "KPLT",
    "exela": "XELA",
    "exela technologies": "XELA",
    "verb technology": "VERB",
    "enveric": "ENVB",
    "enveric biosciences": "ENVB",
    "athenex": "ATNX",
    "nrx pharmaceuticals": "NRXP",
    "seanergy": "SHIP",
    "castor maritime": "CTRM",
    "camber energy": "CEI",
    "siga technologies": "SIGA",
    "siga": "SIGA",
    "ideanomics": "IDEX",
    // ── Legacy / common aliases ────────────────────────────────────────────
    "nvidia": "NVDA",
    "nvidia corp": "NVDA",
    "tesla": "TSLA",
    "apple": "AAPL",
    "microsoft": "MSFT",
    "meta": "META",
    "facebook": "META",
    "amazon": "AMZN",
    "google": "GOOGL",
    "alphabet": "GOOGL",
    "netflix": "NFLX",
    "amd": "AMD",
    "advanced micro devices": "AMD",
    "intel": "INTC",
    "sofi": "SOFI",
    "mara": "MARA",
    "marathon digital": "MARA",
    "coinbase": "COIN",
    "palantir": "PLTR",
    "arm": "ARM",
    "arm holdings": "ARM",
    "nio": "NIO",
    "rivian": "RIVN",
    "super micro": "SMCI",
    "supermicro": "SMCI",
    "robinhood": "HOOD",
    "shopify": "SHOP",
    "snowflake": "SNOW",
    "uber": "UBER",
    "lyft": "LYFT",
};

// ── Trade Brief ────────────────────────────────────────────────────────────────

/**
 * Generates a detailed trade commentary for a single stock.
 *
 * Args:
 *   stock: The stock to analyse.
 *   regime: Optional market regime context.
 *
 * Returns:
 *   Multi-sentence prose trade brief.
 */
export function generateTradeBrief(stock: Stock, regime?: RegimeData): string {
    const direction = stock.tradeType;
    const signalCount = Object.values(stock.signals).filter(Boolean).length;
    const totalSignals = Object.values(stock.signals).length;

    const strengthLabel =
        signalCount >= 6 ? "high-conviction" :
            signalCount >= 4 ? "moderate" :
                "low-confidence";

    const rrQuality =
        stock.riskReward >= 3 ? "well-defined" :
            stock.riskReward >= 2 ? "acceptable" : "tight";

    const setupLine =
        `${stock.ticker} shows ${signalCount}/${totalSignals} ${direction} signals — a ${strengthLabel} setup` +
        (regime ? ` in a ${regime.status} market.` : ".");

    const priceLine =
        `Entry $${stock.bestEntry.toFixed(2)} / stop $${stock.stopLoss.toFixed(2)} / target $${stock.target.toFixed(2)} ` +
        `delivers a ${stock.riskReward.toFixed(2)}:1 R:R — risk is ${rrQuality}.`;

    const contextLine =
        `ATR of $${stock.atr.toFixed(2)} accommodates normal noise; the setup sits ${stock.distance52w.toFixed(1)}% from its 52-week extreme.`;

    const passing = Object.entries(stock.signals).filter(([, v]) => v).map(([k]) => k);
    const failing = Object.entries(stock.signals).filter(([, v]) => !v).map(([k]) => k);
    const signalsLine =
        `Signals passing (${passing.length}): ${passing.join(", ") || "none"}. ` +
        `Failing (${failing.length}): ${failing.join(", ") || "none"}.`;

    const siNote =
        stock.shortInterest != null && stock.shortInterest > 0
            ? `Short interest: ${stock.shortInterest.toFixed(1)}%.`
            : "";

    const rsiNote =
        direction === "LONG"
            ? stock.rsi < 40
                ? `RSI at ${stock.rsi.toFixed(0)} is in oversold territory — watch for a mean-reversion bounce to form.`
                : stock.rsi > 70
                    ? `RSI at ${stock.rsi.toFixed(0)} is extended — consider waiting for a pullback before adding.`
                    : `RSI at ${stock.rsi.toFixed(0)} is constructive — momentum is healthy without being overextended.`
            : stock.rsi > 60
                ? `RSI at ${stock.rsi.toFixed(0)} is overbought — fade opportunity with confirmed price weakness.`
                : stock.rsi < 30
                    ? `RSI at ${stock.rsi.toFixed(0)} is oversold — snap-back risk is elevated; size down.`
                    : `RSI at ${stock.rsi.toFixed(0)} is neutral — confirm entry with price action before committing.`;

    const volNote =
        stock.volumeSpike
            ? "Volume spike confirms institutional participation — strong money flow behind the move."
            : stock.volumeRatio > 1.5
                ? `Volume running ${stock.volumeRatio.toFixed(1)}× average — above-normal activity, watch for follow-through.`
                : "Volume is running at average — setup lacks strong institutional confirmation today.";

    const regimeLine =
        regime
            ? `Market regime: ${regime.status} (SPY $${regime.spyPrice.toFixed(2)} / SMA200 $${regime.sma200.toFixed(2)}, VIX ${regime.vix.toFixed(1)}).`
            : "";

    const conflictNote =
        stock.conflictTrend
            ? "⚠ conflicting trend detected — short-term momentum diverges from long-term structure; wait for resolution before sizing up."
            : "";

    const earningsNote =
        stock.earningsWarning
            ? "WARNING: earnings event within 2 weeks — elevated gap risk; reduce size or avoid new entries."
            : "";

    return [setupLine, priceLine, contextLine, signalsLine, siNote, rsiNote, volNote, regimeLine, conflictNote, earningsNote]
        .filter(Boolean)
        .join(" ")
        .trim();
}

// ── Market Briefing ────────────────────────────────────────────────────────────

/**
 * Generates a 4-paragraph market briefing covering regime, top LONG setups,
 * top SHORT setups, and risk events.
 *
 * Args:
 *   regime: Current market regime data.
 *   stocks: Full universe of scored stocks.
 *
 * Returns:
 *   Multi-paragraph briefing string (paragraphs separated by double newline).
 */
export function generateMarketBriefing(regime: RegimeData, stocks: Stock[]): string {
    const longStocks = stocks
        .filter((s) => s.tradeType === "LONG")
        .sort((a, b) => b.bullScore - a.bullScore);
    const shortStocks = stocks
        .filter((s) => s.tradeType === "SHORT")
        .sort((a, b) => b.bearScore - a.bearScore);

    const topLong = longStocks.slice(0, 3);
    const topShort = shortStocks.slice(0, 3);
    const earningsWarnings = stocks.filter((s) => s.earningsWarning);
    const conflicts = stocks.filter((s) => s.conflictTrend);

    const avgBull = longStocks.reduce((sum, s) => sum + s.bullScore, 0) / (longStocks.length || 1);
    const avgBear = shortStocks.reduce((sum, s) => sum + s.bearScore, 0) / (shortStocks.length || 1);

    const volLabel =
        regime.vix > 25 ? "elevated" : regime.vix > 18 ? "moderate" : "low";
    const rsiLabel =
        regime.spyRsi > 70 ? "overbought" : regime.spyRsi < 30 ? "oversold" : "neutral";
    const spyVsSma = regime.spyPrice > regime.sma200 ? "above" : "below";
    const smaDistance = Math.abs(((regime.spyPrice - regime.sma200) / regime.sma200) * 100).toFixed(1);

    const regimeBiasNote =
        regime.status === "BULLISH"
            ? "Conditions favour initiating longs on pullbacks to structure — keep stops tight."
            : regime.status === "BEARISH"
                ? "Conditions favour shorts; reduce LONG exposure and require higher conviction for any buys."
                : "Mixed backdrop — size down and wait for clearer trend before committing capital.";

    const regimePara =
        `Regime is ${regime.status} — SPY at $${regime.spyPrice.toFixed(2)} is ${smaDistance}% ${spyVsSma} its 200-day SMA ($${regime.sma200.toFixed(2)}), ` +
        `VIX at ${regime.vix.toFixed(1)} signals ${volLabel} volatility, and SPY RSI of ${regime.spyRsi.toFixed(1)} keeps the broad market in ${rsiLabel} territory. ` +
        regimeBiasNote;

    const describeLong = (s: Stock) => {
        const passing = Object.entries(s.signals).filter(([, v]) => v).map(([k]) => k).slice(0, 3);
        const keySignals = passing.length > 0 ? ` (${passing.join(", ")})` : "";
        return `${s.ticker} leads with ${s.bullScore}/8 bull signals and a ${s.riskReward.toFixed(1)}:1 R:R${keySignals}`;
    };

    const describeShort = (s: Stock) => {
        const passing = Object.entries(s.signals).filter(([, v]) => v).map(([k]) => k).slice(0, 3);
        const keySignals = passing.length > 0 ? ` (${passing.join(", ")})` : "";
        return `${s.ticker} shows ${s.bearScore}/8 bear signals and a ${s.riskReward.toFixed(1)}:1 R:R${keySignals}`;
    };

    const longPara =
        topLong.length > 0
            ? `Leading LONG setups: ${topLong.map(describeLong).join("; ")}. ` +
            `The universe holds ${longStocks.length} long-rated ticker${longStocks.length !== 1 ? "s" : ""} ` +
            `with an average bull score of ${avgBull.toFixed(1)}.`
            : "No LONG setups meet minimum score criteria in the current regime.";

    const shortPara =
        topShort.length > 0
            ? `Leading SHORT setups: ${topShort.map(describeShort).join("; ")}. ` +
            `${shortStocks.length} ticker${shortStocks.length !== 1 ? "s are" : " is"} short-rated ` +
            `with an average bear score of ${avgBear.toFixed(1)}.`
            : "No SHORT setups are flagged in the current scan.";

    const riskParts: string[] = [];
    if (earningsWarnings.length > 0) {
        const tickers = earningsWarnings.map((s) => s.ticker).join(", ");
        riskParts.push(
            `${earningsWarnings.length > 1 ? tickers + " carry" : tickers + " carries"} earnings events this week — ` +
            `binary gap risk is elevated; reduce size or stand aside on new entries.`,
        );
    }
    if (conflicts.length > 0) {
        riskParts.push(
            `${conflicts.length} ticker${conflicts.length !== 1 ? "s" : ""} show conflicting trend signals ` +
            `(${conflicts.map((s) => s.ticker).join(", ")}) — wait for resolution before committing capital.`,
        );
    }
    if (riskParts.length === 0) {
        riskParts.push(
            "No material earnings risks or trend conflicts flagged across the universe.",
        );
    }
    const riskPara = (riskParts.length > 1 ? "Risk flags: " : "") + riskParts.join(" ");

    return [regimePara, longPara, shortPara, riskPara].join("\n\n");
}

type QuestionIntent =
    | "regime"
    | "news"
    | "why"
    | "best_rr"
    | "top_setups"
    | "short_candidates"
    | "long_candidates"
    | "earnings"
    | "conflicts"
    | "volume"
    | "rsi"
    | "compare"
    | "position_size"
    | "short_interest"
    | "broker_workflow"
    | "ticker_lookup"
    | "quant_expectancy"
    | "quant_optimization"
    | "quant_frameworks"
    | "default";

function normalizeQuestion(question: string): string {
    return question
        .toLowerCase()
        .replace(/[?.!,;]/g, "")
        .replace(/\b(r\/r|rr)\b/g, "risk reward")
        .replace(/\bma\b/g, "moving average")
        .replace(/\bema\b/g, "exponential moving average")
        .replace(/\bsma\b/g, "simple moving average")
        .replace(/\batr\b/g, "average true range")
        .replace(/\bvol\b/g, "volume")
        .replace(/\bhow's\b/g, "how is")
        .replace(/\bwhat's\b/g, "what is")
        .replace(/\bwhere's\b/g, "where is")
        .replace(/\s+/g, " ")
        .trim();
}

function extractQuestionTickers(question: string, stocks: Stock[]): string[] {
    const tokenSet = new Set(question.toUpperCase().split(/\W+/).filter(Boolean));
    const tickerSet = new Set(stocks.map((s) => s.ticker));
    const matched = new Set(stocks.map((s) => s.ticker).filter((ticker) => tokenSet.has(ticker)));
    // Also match company name aliases against the lowercased question
    const lower = question.toLowerCase();
    for (const [name, ticker] of Object.entries(COMPANY_NAMES)) {
        if (tickerSet.has(ticker) && lower.includes(name)) {
            matched.add(ticker);
        }
    }
    return [...matched];
}

function hasAnyPhrase(input: string, phrases: string[]): boolean {
    return phrases.some((phrase) => input.includes(phrase));
}

function detectIntent(question: string, stocks: Stock[]): QuestionIntent {
    const q = normalizeQuestion(question);
    const tickers = extractQuestionTickers(question, stocks);

    // Highest-priority specific intents first.
    if (hasAnyPhrase(q, ["short interest", "float", "squeeze", "squeeze potential", "risky stocks", "high short"])) return "short_interest";

    // Quantitative / algorithmic trading knowledge — checked before broad-catching intents
    // so that phrasing like "explain expectancy", "walk-forward analysis", or "algo architecture"
    // is not swallowed by the "why", "rsi", or "regime" handlers.
    if (hasAnyPhrase(q, [
        "expectancy", "mathematical expectancy", "expected value", "win rate", "ev formula",
        "positive expectancy", "trading edge", "kelly criterion", "average win", "average loss",
        "break-even win rate", "break even win rate", "mathematical edge", "has an edge",
        "system edge", "mathematical basis",
    ])) return "quant_expectancy";
    if (hasAnyPhrase(q, [
        "parameter optim", "optimize parameter", "overfitting", "curve fitting",
        "walk forward", "walk-forward", "in sample", "in-sample", "out of sample", "out-of-sample",
        "lookback period", "atr period", "rsi period", "average true range period",
        "backtest optim", "grid search", "monte carlo", "sensitivity analysis", "robust parameter",
        "data snooping", "parameter stability", "minimum sample", "backtest strateg", "backtest result",
        "degradation check", "how many trades", "backtest reliable", "parameter robust",
    ])) return "quant_optimization";
    if (hasAnyPhrase(q, [
        "algorithmic", "algo trading", "quantitative", "regime filter", "volatility regime",
        "regime-based", "market framework", "adaptive", "market microstructure",
        "mean reversion framework", "trend following framework", "vix regime", "sector rotation",
        "intermarket", "advanced framework", "swing architecture", "trading architecture",
    ])) return "quant_frameworks";

    if (hasAnyPhrase(q, ["position size", "position sizing", "how much should i buy", "how many shares", "share count", "risk per trade", "lot size", "how much to buy", "max shares", "risk amount", "how much risk"])) return "position_size";
    if (hasAnyPhrase(q, ["compare", " versus ", " vs "]) || tickers.length >= 2) return "compare";
    if (hasAnyPhrase(q, ["news", "headline", "latest on"])) return "news";
    // "explain" on its own is too broad; only treat it as a "why" signal when a ticker is present.
    if (hasAnyPhrase(q, ["why", "signals for", "what signals"]) || (q.includes("explain") && tickers.length >= 1)) return "why";

    if (hasAnyPhrase(q, ["regime", "market condition", "overall market", "broad market", "market update", "market today", "market this week", "how is the market", "what is the market doing", "what is happening in the market", "spy", "vix", "market vibe", "macro", "market sentiment", "market direction", "good time to trade", "good time to buy", "market outlook", "market doing"])) return "regime";
    if (hasAnyPhrase(q, ["best r:r", "best rr", "risk reward", "reward risk", "best ratio", "highest reward", "best setup by reward", "best risk reward", "most favorable setup", "highest ratio"])) return "best_rr";
    if (hasAnyPhrase(q, ["strongest", "top setup", "top pick", "best setup", "best trade", "what is hot", "any winners", "best picks", "top ideas", "hot stocks", "what should i look at", "what to trade", "top stocks", "what looks good", "what looks interesting", "give me ideas", "give me trade ideas", "trade ideas", "any plays", "any opportunities", "anything interesting", "what is interesting", "scan results", "any picks", "good trades", "any ideas", "show me picks", "what to watch", "what should i watch"])) return "top_setups";
    if (hasAnyPhrase(q, ["earnings", "report", "catalyst", "upcoming reports", "avoid earnings", "upcoming earnings", "catalyst risk", "binary events", "reporting this week", "what is reporting"])) return "earnings";
    if (hasAnyPhrase(q, ["conflict", "mixed signal", "mixed setup", "mixed setups", "setups are mixed", "diverge", "uncertain setups", "indecisive", "indeterminate"])) return "conflicts";
    if (hasAnyPhrase(q, ["volume", "vol spike", "high volume", "active stocks", "big volume", "unusual volume", "most active", "unusual activity", "what is moving", "active today", "high volume stocks", "volume spike", "money flow"])) return "volume";
    if (hasAnyPhrase(q, ["rsi", "oversold", "overbought", "momentum", "extended", "stretched", "mean reversion", "bounce candidate", "reversal plays", "reversal candidate", "oversold stocks", "overbought stocks", "extreme rsi", "stretched stocks"])) return "rsi";

    // Broad direction intents should not steal sizing/short-interest questions.
    if (hasAnyPhrase(q, [" short ", "short setups", "bearish candidate", "sell candidate", "what to short", "bearish plays", "sell candidates", "going down", "what is going down", "downtrend", "bearish stocks", "put plays", "fading plays", "sell the rip"])) return "short_candidates";
    if (hasAnyPhrase(q, [" long ", "long setups", "bullish candidate", "buy candidate", "what to buy", "bullish plays", "buy candidates", "good buys", "should i buy", "worth buying", "going up", "what is going up", "buy the dip", "dip buy", "bullish stocks", "bullish setup", "bullish setups", "call plays", "upward trend", "upside"])) return "long_candidates";

    if (
        Object.keys(BROKER_KEYWORDS).some((k) => q.includes(k)) &&
        hasAnyPhrase(q, ["how to", "how do i", "place order", "buy order", "limit order", "stop order", "order type", "trade on", "steps", "tutorial", "guide", "set up", "place a"])
    ) return "broker_workflow";

    if (tickers.length >= 1) return "ticker_lookup";
    return "default";
}

// ── Chat Q&A ──────────────────────────────────────────────────────────────────

/**
 * Answers a natural-language trading question using only app data.
 *
 * Args:
 *   question: The user's question string.
 *   stocks: Full universe of scored stocks.
 *   regime: Current market regime data.
 *
 * Returns:
 *   Plain-text answer string.
 */
export function answerQuestion(
    question: string,
    stocks: Stock[],
    regime: RegimeData,
    history?: HistoryEntry[],
    knowledgeMatches?: KnowledgeMatch[],
    brokerWorkflows?: BrokerWorkflowRecord[],
): string {
    // ── Follow-up context resolution ──────────────────────────────────────────
    // If the question is a short follow-up (e.g. "tell me more", "which one?"),
    // extract ticker context from recent history and prepend it so intent
    // detection works correctly.
    const FOLLOW_UP_RE = /^(tell me more|more details?|elaborate|explain more|what about it|how so|and that|which one|the (first|second|top) one)/i;
    const effectiveQuestion =
        FOLLOW_UP_RE.test(question.trim()) && (history ?? []).length > 0
            ? (() => {
                const tickerSet = new Set(stocks.map((s) => s.ticker));
                const mentioned: string[] = [];
                const mentionedSet = new Set<string>();
                for (const msg of [...(history ?? [])].reverse().slice(0, 4)) {
                    for (const word of msg.text.toUpperCase().split(/\W+/)) {
                        if (tickerSet.has(word) && !mentionedSet.has(word)) {
                            mentioned.push(word);
                            mentionedSet.add(word);
                        }
                    }
                    if (mentioned.length >= 2) break;
                }
                return mentioned.length > 0 ? `${question} about ${mentioned.join(", ")}` : question;
            })()
            : question;

    const intent = detectIntent(effectiveQuestion, stocks);
    const questionTickers = extractQuestionTickers(effectiveQuestion, stocks);

    // ── Regime / market conditions ────────────────────────────────────────────
    if (intent === "regime") {
        const bias =
            regime.status === "BULLISH"
                ? "Favor LONG setups with tight stops — avoid chasing extended moves; wait for pullbacks to key moving averages."
                : regime.status === "BEARISH"
                    ? "Favor SHORT setups — long positions carry elevated reversal risk; reduce size or require 6+/8 signals."
                    : "Mixed regime — size down and require higher conviction (6+/8 signals) before entry in either direction.";
        const volLabel = regime.vix > 25 ? "elevated" : regime.vix > 18 ? "moderate" : "low";
        const rsiLabel = regime.spyRsi > 70 ? "overbought" : regime.spyRsi < 30 ? "oversold" : "neutral";
        const vs200 = regime.spyPrice > regime.sma200 ? "above" : "below";
        const vs50 = regime.spyPrice > regime.sma50 ? "above" : "below";
        const sma200dist = Math.abs(((regime.spyPrice - regime.sma200) / regime.sma200) * 100).toFixed(1);
        return (
            `Regime: ${regime.status} (${regime.regimeScore}/6 conditions met).\n` +
            `SPY $${regime.spyPrice.toFixed(2)} — ${sma200dist}% ${vs200} SMA200 $${regime.sma200.toFixed(2)}, ${vs50} SMA50 $${regime.sma50.toFixed(2)}.\n` +
            `VIX ${regime.vix.toFixed(1)} (${volLabel} volatility). SPY RSI ${regime.spyRsi.toFixed(1)} (${rsiLabel}).\n\n` +
            `Bias: ${bias}`
        );
    }

    // ── News for a specific ticker ────────────────────────────────────────────
    if (intent === "news") {
        const newsT = questionTickers[0];
        const newsStock = newsT ? stocks.find((s) => s.ticker === newsT) : undefined;
        if (newsStock && newsStock.news.length > 0) {
            return (
                `Recent news for ${newsStock.ticker} (${newsStock.name}):\n\n` +
                newsStock.news.slice(0, 5).map((item, i) =>
                    `${i + 1}. [${item.sentiment?.toUpperCase() ?? "NEUTRAL"}] ${item.title}\n` +
                    `   ${item.source ?? "Unknown"} · ${item.date}` +
                    (item.summary ? `\n   ${item.summary}` : "")
                ).join("\n\n")
            );
        }
    }

    // ── Why is a ticker rated LONG/SHORT? ─────────────────────────────────────
    if (intent === "why") {
        const whyT = questionTickers[0];
        const whyStock = whyT ? stocks.find((s) => s.ticker === whyT) : undefined;
        if (whyStock) {
            const passing = Object.entries(whyStock.signals).filter(([, v]) => v).map(([k]) => k);
            const failing = Object.entries(whyStock.signals).filter(([, v]) => !v).map(([k]) => k);
            const score = whyStock.tradeType === "LONG" ? whyStock.bullScore : whyStock.bearScore;
            const strengthLabel = score >= 6 ? "high-conviction" : score >= 4 ? "moderate" : "low-confidence";
            return (
                `${whyStock.ticker} is a ${whyStock.tradeType} setup — ${score}/8 signals aligned, ${strengthLabel}.\n\n` +
                `✅ Passing (${passing.length}): ${passing.join(", ") || "none"}\n` +
                `❌ Failing (${failing.length}): ${failing.join(", ") || "none"}\n\n` +
                `Setup: entry $${whyStock.bestEntry.toFixed(2)} | stop $${whyStock.stopLoss.toFixed(2)} | target $${whyStock.target.toFixed(2)} | R:R ${whyStock.riskReward.toFixed(2)}:1\n` +
                (whyStock.shortInterest != null ? `Short interest: ${whyStock.shortInterest.toFixed(1)}%\n` : "") +
                (whyStock.conflictTrend ? "⚠ Conflicting trend — wait for resolution before entry.\n" : "") +
                (whyStock.earningsWarning ? "⚠ Earnings event upcoming — size down or avoid.\n" : "")
            );
        }
    }

    // ── Best R:R ─────────────────────────────────────────────────────────────────────────────
    if (intent === "best_rr") {
        const sorted = [...stocks].sort((a, b) => b.riskReward - a.riskReward).slice(0, 5);
        const top = sorted[0];
        const regimeFit = top
            ? (top.tradeType === "LONG" && regime.status === "BULLISH") ||
              (top.tradeType === "SHORT" && regime.status === "BEARISH")
                ? "favors"
                : regime.status === "NEUTRAL"
                    ? "is neutral on"
                    : "disfavors"
            : "is neutral on";
        const alignmentNote = top
            ? `Top-ranked ${top.ticker} is a ${top.tradeType} setup — the ${regime.status} regime ${regimeFit} this direction. ` +
              `${regimeFit === "disfavors" ? "Consider sizing down or waiting for regime alignment." : "R:R and regime are aligned — this is the highest-priority candidate."}`
            : "";
        return (
            `Top 5 setups by R:R ratio:\n` +
            sorted
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — ${s.riskReward.toFixed(2)}:1 ` +
                        `(${s.tradeType}, entry $${s.bestEntry.toFixed(2)}, stop $${s.stopLoss.toFixed(2)}, target $${s.target.toFixed(2)})` +
                        (s.earningsWarning ? " ⚠ earnings" : "") +
                        (s.conflictTrend ? " ⚠ conflict" : ""),
                )
                .join("\n") +
            (alignmentNote ? `\n\n${alignmentNote}` : "")
        );
    }

    // ── Strongest / top setups ────────────────────────────────────────────────
    if (intent === "top_setups") {
        const getScore = (s: Stock) =>
            s.tradeType === "LONG" ? s.bullScore : s.bearScore;
        const top5 = [...stocks].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
        const topRegimeBias =
            regime.status === "BULLISH"
                ? "BULLISH regime — LONG setups have structural support; favor longs over shorts right now."
                : regime.status === "BEARISH"
                    ? "BEARISH regime — SHORT setups have structural support. Size down on LONGs."
                    : "NEUTRAL regime — require ≥6/8 signals before entering either direction.";
        return (
            `Top 5 setups by signal score:\n` +
            top5
                .map((s, i) => {
                    const score = getScore(s);
                    const passing = Object.entries(s.signals).filter(([, v]) => v).map(([k]) => k);
                    const keySignals = passing.slice(0, 3).join(" + ");
                    return (
                        `${i + 1}. ${s.ticker} (${s.tradeType}) — ${score}/8 signals, R:R ${s.riskReward.toFixed(2)}:1` +
                        (keySignals ? ` | ${keySignals}` : "") +
                        (s.earningsWarning ? " ⚠ earnings" : "") +
                        (s.conflictTrend ? " ⚠ conflict" : "")
                    );
                })
                .join("\n") +
            `\n\n${topRegimeBias}`
        );
    }

    // ── SHORT candidates ─────────────────────────────────────────────────────
    if (intent === "short_candidates") {
        const shorts = [...stocks]
            .filter((s) => s.tradeType === "SHORT")
            .sort((a, b) => b.bearScore - a.bearScore);
        if (shorts.length === 0)
            return "No tickers are currently rated SHORT in the scan.";
        const shortRegimeNote =
            regime.status === "BULLISH"
                ? `⚠ Regime is BULLISH — SHORT setups face structural headwinds. Require 6+/8 bear signals and use reduced size.\n\n`
                : regime.status === "BEARISH"
                    ? `Regime is BEARISH — conditions favour SHORT entries. These setups have macro tailwinds.\n\n`
                    : `Regime is NEUTRAL — trade selectively, prefer high-conviction setups (6+/8 signals).\n\n`;
        return (
            shortRegimeNote +
            `${shorts.length} SHORT setup${shorts.length !== 1 ? "s" : ""} in the universe:\n` +
            shorts
                .slice(0, 6)
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — bear score ${s.bearScore}/8, entry $${s.bestEntry.toFixed(2)}, ` +
                        `stop $${s.stopLoss.toFixed(2)}, target $${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.conflictTrend ? " ⚠ conflict" : "") +
                        (s.earningsWarning ? " ⚠ earnings" : ""),
                )
                .join("\n")
        );
    }

    // ── LONG candidates ──────────────────────────────────────────────────────
    if (intent === "long_candidates") {
        const longs = [...stocks]
            .filter((s) => s.tradeType === "LONG")
            .sort((a, b) => b.bullScore - a.bullScore);
        if (longs.length === 0)
            return "No tickers are currently rated LONG in the scan.";
        const longRegimeNote =
            regime.status === "BEARISH"
                ? `⚠ Regime is BEARISH — LONG setups face structural headwinds. Require 6+/8 signals and reduce size.\n\n`
                : regime.status === "BULLISH"
                    ? `Regime is BULLISH — conditions favour LONG entries. These setups have macro tailwinds.\n\n`
                    : `Regime is NEUTRAL — trade selectively, prefer high-conviction setups (6+/8 signals).\n\n`;
        return (
            longRegimeNote +
            `${longs.length} LONG setup${longs.length !== 1 ? "s" : ""} in the universe:\n` +
            longs
                .slice(0, 6)
                .map(
                    (s, i) =>
                        `${i + 1}. ${s.ticker} — bull score ${s.bullScore}/8, entry $${s.bestEntry.toFixed(2)}, ` +
                        `stop $${s.stopLoss.toFixed(2)}, target $${s.target.toFixed(2)}, R:R ${s.riskReward.toFixed(2)}:1` +
                        (s.earningsWarning ? " ⚠ earnings" : "") +
                        (s.conflictTrend ? " ⚠ conflict" : ""),
                )
                .join("\n")
        );
    }

    // ── Earnings risks ────────────────────────────────────────────────────────
    if (intent === "earnings") {
        const warned = stocks.filter((s) => s.earningsWarning);
        if (warned.length === 0)
            return "No earnings events flagged this week across the universe. All clear to trade normal size.";
        return (
            `${warned.length} ticker${warned.length !== 1 ? "s" : ""} with upcoming earnings events — binary gap risk is elevated:\n\n` +
            warned
                .map(
                    (s) =>
                        `• ${s.ticker} (${s.tradeType}, entry $${s.bestEntry.toFixed(2)}) — avoid new entries until after the report; ` +
                        `if already in, consider reducing size to lock in partial gains.`,
                )
                .join("\n") +
            "\n\nNext step: reduce position size to 50% or wait for the post-earnings reaction before adding."
        );
    }

    // ── Conflicting signals ───────────────────────────────────────────────────
    if (intent === "conflicts") {
        const conflicted = stocks.filter((s) => s.conflictTrend);
        if (conflicted.length === 0)
            return "No trend conflicts detected. All rated setups have aligned signals across timeframes — clean slate for entries.";
        return (
            `${conflicted.length} ticker${conflicted.length !== 1 ? "s" : ""} with conflicting trend signals — short-term momentum diverges from long-term structure:\n\n` +
            conflicted
                .map(
                    (s) =>
                        `• ${s.ticker} (${s.tradeType}, score ${s.tradeType === "LONG" ? s.bullScore : s.bearScore}/8) — ` +
                        `shorter-term price action is fighting the longer-term trend. Wait for these to re-align before entering.`,
                )
                .join("\n") +
            "\n\nNext step: remove these from your active watchlist until the conflict resolves — focus on clean setups."
        );
    }

    // ── Volume spikes ─────────────────────────────────────────────────────────
    if (intent === "volume") {
        const spiked = stocks
            .filter((s) => s.volumeSpike)
            .sort((a, b) => b.volumeRatio - a.volumeRatio);
        const aboveAvg = stocks
            .filter((s) => !s.volumeSpike && s.volumeRatio > 1.5)
            .sort((a, b) => b.volumeRatio - a.volumeRatio);
        if (spiked.length === 0 && aboveAvg.length === 0)
            return "No unusual volume activity detected — all tickers are trading at or below average volume today.";
        const parts: string[] = [];
        if (spiked.length > 0) {
            parts.push(
                `Volume spikes (institutional-level activity):\n` +
                spiked.map((s) =>
                    `• ${s.ticker} — ${s.volumeRatio.toFixed(1)}× average volume (${s.tradeType}, $${s.price.toFixed(2)})`
                ).join("\n")
            );
        }
        if (aboveAvg.length > 0) {
            parts.push(
                `Above-average volume (watch for follow-through):\n` +
                aboveAvg.slice(0, 4).map((s) =>
                    `• ${s.ticker} — ${s.volumeRatio.toFixed(1)}× average (${s.tradeType}, $${s.price.toFixed(2)})`
                ).join("\n")
            );
        }
        return parts.join("\n\n") + "\n\nVolume spikes often precede directional moves — cross-check with signal alignment before entering.";
    }

    // ── RSI extremes ─────────────────────────────────────────────────────────
    if (intent === "rsi") {
        const oversold = stocks
            .filter((s) => s.rsi < 35)
            .sort((a, b) => a.rsi - b.rsi);
        const overbought = stocks
            .filter((s) => s.rsi > 65)
            .sort((a, b) => b.rsi - a.rsi);
        if (oversold.length === 0 && overbought.length === 0)
            return "All tickers are trading in neutral RSI territory (35–65). No extreme momentum reads — wait for setups to develop.";
        const parts: string[] = ["RSI extremes across the universe:"];
        if (oversold.length > 0)
            parts.push(
                `Oversold (RSI < 35) — potential bounce candidates:\n` +
                oversold.map((s) => `• ${s.ticker} (RSI ${s.rsi.toFixed(1)}, ${s.tradeType})`).join("\n"),
            );
        if (overbought.length > 0)
            parts.push(
                `Overbought (RSI > 65) — potential fade candidates:\n` +
                overbought.map((s) => `• ${s.ticker} (RSI ${s.rsi.toFixed(1)}, ${s.tradeType})`).join("\n"),
            );
        parts.push("Always confirm RSI reads with price structure and signal alignment — RSI alone is not a trigger.");
        return parts.join("\n\n");
    }

    // ── Compare two tickers side by side ──────────────────────────────────────
    if (intent === "compare") {
        const twoTickers = questionTickers.slice(0, 2);
        if (twoTickers.length >= 2) {
            const a = stocks.find((s) => s.ticker === twoTickers[0])!;
            const b = stocks.find((s) => s.ticker === twoTickers[1])!;
            const scoreA = a.tradeType === "LONG" ? a.bullScore : a.bearScore;
            const scoreB = b.tradeType === "LONG" ? b.bullScore : b.bearScore;
            const betterScore = scoreA > scoreB ? a.ticker : scoreB > scoreA ? b.ticker : "Tied";
            const betterRR = a.riskReward >= b.riskReward ? a.ticker : b.ticker;
            const regimeFitA = (a.tradeType === "LONG" && regime.status === "BULLISH") || (a.tradeType === "SHORT" && regime.status === "BEARISH");
            const regimeFitB = (b.tradeType === "LONG" && regime.status === "BULLISH") || (b.tradeType === "SHORT" && regime.status === "BEARISH");
            const verdictParts: string[] = [];
            if (betterScore !== "Tied") verdictParts.push(`${betterScore} has the stronger signal score.`);
            else verdictParts.push("Both setups have equal signal scores.");
            verdictParts.push(`${betterRR} offers the better R:R.`);
            if (regimeFitA !== regimeFitB) verdictParts.push(`${regimeFitA ? a.ticker : b.ticker} aligns with the ${regime.status} regime.`);
            return (
                `${a.ticker} vs ${b.ticker} — side-by-side:\n\n` +
                `${a.ticker} (${a.tradeType}): score ${scoreA}/8, entry $${a.bestEntry.toFixed(2)}, stop $${a.stopLoss.toFixed(2)}, target $${a.target.toFixed(2)}, R:R ${a.riskReward.toFixed(2)}:1, RSI ${a.rsi.toFixed(0)}` +
                (a.earningsWarning ? " ⚠ earnings" : "") + (a.conflictTrend ? " ⚠ conflict" : "") + "\n" +
                `${b.ticker} (${b.tradeType}): score ${scoreB}/8, entry $${b.bestEntry.toFixed(2)}, stop $${b.stopLoss.toFixed(2)}, target $${b.target.toFixed(2)}, R:R ${b.riskReward.toFixed(2)}:1, RSI ${b.rsi.toFixed(0)}` +
                (b.earningsWarning ? " ⚠ earnings" : "") + (b.conflictTrend ? " ⚠ conflict" : "") + "\n\n" +
                `Higher signal score: ${betterScore}\nBetter R:R: ${betterRR}\n\n` +
                `Verdict: ${verdictParts.join(" ")}`
            );
        }
    }

    // ── Position sizing for a ticker ─────────────────────────────────────────
    if (intent === "position_size") {
        const sizeT = questionTickers[0];
        const sizeStock = sizeT ? stocks.find((s) => s.ticker === sizeT) : undefined;
        if (sizeStock) {
            const stopDistance = Math.abs(sizeStock.bestEntry - sizeStock.stopLoss);
            const shares1 = stopDistance > 0 ? Math.floor(100 / stopDistance) : 0;   // 1% risk
            const shares05 = stopDistance > 0 ? Math.floor(50 / stopDistance) : 0;   // 0.5% risk
            const shares2 = stopDistance > 0 ? Math.floor(200 / stopDistance) : 0;   // 2% risk
            const posValue = shares1 * sizeStock.bestEntry;
            const maxLoss = shares1 * stopDistance;
            const stopPct = ((stopDistance / sizeStock.bestEntry) * 100).toFixed(1);
            return (
                `Position sizing for ${sizeStock.ticker} — based on stop at $${sizeStock.stopLoss.toFixed(2)}:\n\n` +
                `Entry $${sizeStock.bestEntry.toFixed(2)} | Stop $${sizeStock.stopLoss.toFixed(2)}\n` +
                `Stop distance: $${stopDistance.toFixed(2)} (${stopPct}% of entry)\n\n` +
                `Suggested shares: ${shares1} (at 1% risk on $10,000)\n` +
                `Position value: ~$${posValue.toFixed(0)} | Max loss: $${maxLoss.toFixed(0)}\n\n` +
                `Scale by risk tolerance:\n` +
                `• Conservative 0.5%: ~${shares05} shares\n` +
                `• Standard 1%:       ~${shares1} shares  ← default\n` +
                `• Aggressive 2%:     ~${shares2} shares\n\n` +
                `Formula: shares = (account × risk%) ÷ stop-distance\n` +
                `Adjust account size and risk% to your own parameters.`
            );
        }
    }

    // ── Short interest ────────────────────────────────────────────────────────
    if (intent === "short_interest") {
        const siStocks = stocks
            .filter((s) => s.shortInterest != null && s.shortInterest > 0)
            .sort((a, b) => (b.shortInterest ?? 0) - (a.shortInterest ?? 0));
        if (siStocks.length === 0)
            return "No short interest data available in the current scan.";
        const highSI = siStocks.filter((s) => (s.shortInterest ?? 0) > 15);
        return (
            `Short interest data (${siStocks.length} tickers with SI > 0):\n\n` +
            siStocks.slice(0, 8).map((s) => {
                const si = s.shortInterest!.toFixed(1);
                const squeezeFlag = s.volumeSpike && s.tradeType === "LONG" ? " 🔥 squeeze watch" : "";
                return `• ${s.ticker} — ${si}% SI (${s.tradeType}, $${s.price.toFixed(2)}, RSI ${s.rsi.toFixed(0)})${squeezeFlag}`;
            }).join("\n") +
            "\n\n" +
            (highSI.length > 0
                ? `High SI (>15%): ${highSI.map((s) => s.ticker).join(", ")} — elevated short interest can fuel a squeeze on LONGs or confirm bearish conviction on SHORTs. High SI + volume spike = squeeze watch.`
                : "No tickers above 15% SI — squeeze risk is moderate across the universe.")
        );
    }

    // ── Broker order workflows ────────────────────────────────────────────────
    if (intent === "broker_workflow") {
        if (brokerWorkflows && brokerWorkflows.length > 0) {
            const parts = brokerWorkflows.map((wf) =>
                `${wf.broker} (${wf.platform}) — ${wf.instrument}:\n` +
                (wf.steps_json as string[]).map((step, i) => `${i + 1}. ${step}`).join("\n")
            );
            return (
                `Here${parts.length > 1 ? " are the" : " is the"} step-by-step order workflow${parts.length > 1 ? "s" : ""}:\n\n` +
                parts.join("\n\n") +
                "\n\nNote: double-check your broker's current interface — UI and workflows may vary by account type or platform version."
            );
        }
        return (
            "No stored workflow found for that broker in the curated knowledge base. " +
            "Try asking with the full broker name (e.g., 'Robinhood', 'Fidelity', 'Webull', 'Interactive Brokers'). " +
            "If you have a live Supabase connection with broker_order_workflows data, this will return step-by-step instructions."
        );
    }

    // ── Mathematical Expectancy ───────────────────────────────────────────────
    if (intent === "quant_expectancy") {
        const longStocks = stocks.filter((s) => s.tradeType === "LONG");
        const shortStocks = stocks.filter((s) => s.tradeType === "SHORT");
        const avgRR = stocks.length > 0
            ? (stocks.reduce((sum, s) => sum + s.riskReward, 0) / stocks.length).toFixed(2)
            : "2.00";
        const avgBull = longStocks.length > 0
            ? (longStocks.reduce((sum, s) => sum + s.bullScore, 0) / longStocks.length).toFixed(1)
            : "0";
        const avgBear = shortStocks.length > 0
            ? (shortStocks.reduce((sum, s) => sum + s.bearScore, 0) / shortStocks.length).toFixed(1)
            : "0";
        return (
            `Mathematical Expectancy — Quantitative Edge Framework:\n\n` +
            `Formula: E = (Win% × Avg Win) − (Loss% × Avg Loss)\n` +
            `Where: Win% + Loss% = 1, Avg Win = R:R × risk-per-trade\n\n` +
            `For a system with 2:1 R:R and 45% win rate:\n` +
            `E = (0.45 × 2R) − (0.55 × 1R) = 0.90R − 0.55R = +0.35R per trade\n` +
            `Positive expectancy = edge exists. Negative = system bleeds capital over time.\n\n` +
            `SwingPulse signal scoring as expectancy proxy:\n` +
            `• 8-signal checklist (sma200, sma50, rsiMomentum, volume, macd, priceAction, trendStrength, earningsSetup)\n` +
            `• Score ≥6/8 → high-conviction setups — historically correspond to win rates above 50%\n` +
            `• Score ≤3/8 → low-confidence — reduce size or stand aside\n\n` +
            `Current universe stats:\n` +
            `• Average R:R across all ${stocks.length} tickers: ${avgRR}:1\n` +
            `• LONG setups (${longStocks.length}): avg bull score ${avgBull}/8\n` +
            `• SHORT setups (${shortStocks.length}): avg bear score ${avgBear}/8\n\n` +
            `Kelly Criterion (optional position sizing):\n` +
            `f = W − (1−W)/R   where W = win rate, R = R:R ratio\n` +
            `At W=0.45, R=2.0: f = 0.45 − 0.55/2 = 0.175 → 17.5% of capital (use ½-Kelly = 8.75% max)\n\n` +
            `Key insight: a positive-expectancy system with consistent execution will be profitable over a large sample of trades, even with a sub-50% win rate.`
        );
    }

    // ── Parameter Optimization ────────────────────────────────────────────────
    if (intent === "quant_optimization") {
        return (
            `Parameter Optimization — Avoiding Overfitting in Swing Systems:\n\n` +
            `Core principles:\n` +
            `1. Walk-Forward Analysis: divide historical data into in-sample (train) and out-of-sample (test) windows.\n` +
            `   Typical split: 70% in-sample for optimization, 30% out-of-sample for validation.\n\n` +
            `2. Robustness Test: optimal parameters should perform well across a ±20% band around the optimum.\n` +
            `   A parameter cliff (sharp performance drop on either side) = fragile, curve-fitted system.\n\n` +
            `3. SwingPulse parameter reference:\n` +
            `   • RSI period: 14 (Wilder standard — robust across timeframes)\n` +
            `   • SMA periods: 50-day and 200-day (decades-tested institutional benchmarks)\n` +
            `   • ATR period: 14-day for stop/target sizing\n` +
            `   • Volume spike threshold: 1.5× 20-day average\n` +
            `   • MACD: 12/26/9 (standard — avoid optimizing these without large sample)\n\n` +
            `4. Monte Carlo Simulation: randomly resample trade results 10,000 times.\n` +
            `   Compute 5th percentile drawdown — this is your expected worst-case. If unacceptable, reduce size.\n\n` +
            `5. Sample size requirement: minimum 30 trades (ideally 100+) before drawing statistical conclusions.\n` +
            `   Too few trades = outcomes dominated by randomness, not edge.\n\n` +
            `6. Degradation check: if out-of-sample performance < 50% of in-sample, the system is likely overfit.\n` +
            `   Re-parameterize with simpler rules or accept that edge may not generalize.\n\n` +
            `Red flags (curve-fitting signals):\n` +
            `• Too many parameters relative to trade count\n` +
            `• Performance sensitive to single-tick changes in threshold\n` +
            `• Only profitable during one specific market regime\n` +
            `• Sharpe ratio drops >40% in out-of-sample period`
        );
    }

    // ── Advanced Market Frameworks ────────────────────────────────────────────
    if (intent === "quant_frameworks") {
        const regimeStr = regime.status;
        const vixLabel = regime.vix > 25 ? "HIGH (>25)" : regime.vix > 18 ? "MODERATE (18-25)" : "LOW (<18)";
        return (
            `Advanced Market Frameworks for Algorithmic Swing Trading:\n\n` +
            `1. Regime-Based Architecture (SwingPulse's core model)\n` +
            `   Current: ${regimeStr} | VIX ${regime.vix.toFixed(1)} — ${vixLabel}\n` +
            `   • BULLISH (4+/6 conditions): full size LONG setups, reduce SHORT exposure\n` +
            `   • BEARISH (≤2/6 conditions): full size SHORT setups, require 6+/8 signals for LONGs\n` +
            `   • NEUTRAL (3/6 conditions): half size both directions, demand high conviction\n\n` +
            `2. Volatility-Adjusted Position Sizing\n` +
            `   Shares = (Account × Risk%) ÷ (ATR × Stop-Multiple)\n` +
            `   In high-VIX (>25): reduce risk% by 50% — ATR widens, stops must widen too.\n` +
            `   In low-VIX (<15): can use full risk% — tighter stops, better precision.\n\n` +
            `3. Mean Reversion vs. Trend Following Filters\n` +
            `   • Trend: RSI 50-70 zone, price above SMA50 and SMA200 (momentum confirms)\n` +
            `   • Mean Reversion: RSI <35 (oversold) or >65 (overbought) with price at structure\n` +
            `   SwingPulse uses trend-following signals — exits before mean reversion exhaustion.\n\n` +
            `4. Multi-Timeframe Confirmation\n` +
            `   Entry signals on daily chart should align with weekly trend direction.\n` +
            `   conflictTrend flag: SMA50 < SMA200 on a LONG setup = structural divergence — wait.\n\n` +
            `5. Intermarket & Sector Rotation Context\n` +
            `   • VIX rising + SPY below SMA200 = risk-off → favour defensive sectors (utilities, consumer staples)\n` +
            `   • VIX falling + SPY above SMA50 = risk-on → favour growth (tech, consumer discretionary)\n` +
            `   • Crude oil rising → XOM, CVX, VLO outperform; rising dollar → global earners (KO, PM, JNJ) compress\n\n` +
            `6. Earnings Binary-Event Architecture\n` +
            `   earningsWarning flag: earnings within 2 weeks → elevated gap risk.\n` +
            `   Protocol: close or halve position size before report; re-enter after reaction settles.\n\n` +
            `7. Short Interest / Squeeze Framework\n` +
            `   SI >15% + volumeSpike = squeeze watch. For LONG setups: catalytic; for SHORTs: dangerous.\n` +
            `   Days-to-cover = Short Float ÷ Average Daily Volume; >5 days elevates squeeze probability.\n\n` +
            `Universe split by category:\n` +
            `   • High Dividend Yield & High Earnings: 25 blue-chips — lower volatility, regime-resilient, income floor\n` +
            `   • Penny Stocks: 25 speculative plays — higher ATR, wider stops required, size down by 50%`
        );
    }

    // ── Specific ticker lookup (e.g. "Tell me about NVDA") ───────────────────
    if (intent === "ticker_lookup") {
        const ticker = questionTickers[0];
        const stock = stocks.find((s) => s.ticker === ticker);
        if (stock) return generateTradeBrief(stock, regime);
    }

    // -- Default -- contextual market briefing (best-effort for unrecognised questions) ---
    const defaultGetScore = (s: Stock) => s.tradeType === "LONG" ? s.bullScore : s.bearScore;
    const top3 = [...stocks].sort((a, b) => defaultGetScore(b) - defaultGetScore(a)).slice(0, 3);
    const longCount = stocks.filter((s) => s.tradeType === "LONG").length;
    const shortCount = stocks.filter((s) => s.tradeType === "SHORT").length;
    const defaultRegimeBias =
        regime.status === "BULLISH"
            ? "Favors LONG setups."
            : regime.status === "BEARISH"
                ? "Favors SHORT setups \u2014 reduce LONG size."
                : "Mixed \u2014 require high conviction before entry.";
    const earningsCount = stocks.filter((s) => s.earningsWarning).length;
    const conflictCount = stocks.filter((s) => s.conflictTrend).length;
    const riskNote =
        earningsCount > 0 && conflictCount > 0
            ? `\u26a0 ${earningsCount} earnings risk${earningsCount !== 1 ? "s" : ""}, ${conflictCount} trend conflict${conflictCount !== 1 ? "s" : ""} in the universe.`
            : earningsCount > 0
                ? `\u26a0 ${earningsCount} ticker${earningsCount !== 1 ? "s" : ""} with upcoming earnings \u2014 size down or wait.`
                : conflictCount > 0
                    ? `\u26a0 ${conflictCount} ticker${conflictCount !== 1 ? "s" : ""} with conflicting trend signals \u2014 wait for resolution.`
                    : "No earnings risks or trend conflicts flagged.";
    const setupLines = top3
        .map((s, i) => {
            const score = defaultGetScore(s);
            return `${i + 1}. ${s.ticker} (${s.tradeType}) \u2014 ${score}/8 signals, R:R ${s.riskReward.toFixed(2)}:1` +
                (s.earningsWarning ? " \u26a0 earnings" : "") +
                (s.conflictTrend ? " \u26a0 conflict" : "");
        })
        .join("\n");
    const topTicker = top3[0];
    const exampleTicker = topTicker ? topTicker.ticker : "NVDA";
    const MAX_KNOWLEDGE_BLOCKS_IN_DEFAULT_RESPONSE = 2;
    const knowledgeBlock = knowledgeMatches && knowledgeMatches.length > 0
        ? "\n\n" + knowledgeMatches.slice(0, MAX_KNOWLEDGE_BLOCKS_IN_DEFAULT_RESPONSE).map((m) => {
            const src = m.sourceLabel && m.sourceUrl ? `\nSource: ${m.sourceLabel} — ${m.sourceUrl}` : "";
            return `**${m.title}**\n${m.content}${src}`;
        }).join("\n\n")
        : "";
    return (
        `Regime: ${regime.status} (${regime.regimeScore}/6 conditions). VIX ${regime.vix.toFixed(1)}, SPY RSI ${regime.spyRsi.toFixed(1)}. ${defaultRegimeBias}\n` +
        `Universe: ${stocks.length} tickers \u2014 ${longCount} LONG, ${shortCount} SHORT.\n\n` +
        `Top setups right now:\n${setupLines}\n\n` +
        `${riskNote}` +
        knowledgeBlock +
        `\n\nTry: "tell me about ${exampleTicker}", "top setups", "why is ${exampleTicker} rated ${topTicker?.tradeType ?? "LONG"}?", or "how is the market?"`
    );
}
