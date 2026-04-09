// @ts-nocheck — Deno Edge Function; VS Code TS compiler does not understand Deno imports.
// Built-in analysis engine — no external AI API required.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockSignals {
  sma200: boolean;
  sma50: boolean;
  rsiMomentum: boolean;
  volume: boolean;
  macd: boolean;
  priceAction: boolean;
  trendStrength: boolean;
  earningsSetup: boolean;
}

interface NewsItem {
  title: string;
  date: string;
  source?: string;
  sentiment?: string;
  url?: string;
}

interface Stock {
  ticker: string;
  name: string;
  tradeType: string;
  bullScore: number;
  bearScore: number;
  price: number;
  rsi: number;
  volumeRatio: number;
  signals: StockSignals;
  bestEntry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  atr: number;
  distance52w: number;
  news: NewsItem[];
  earningsWarning: boolean;
  shortInterest?: number;
  conflictTrend?: boolean;
  volumeSpike?: boolean;
}

interface RegimeData {
  status: string;
  spyPrice: number;
  sma200: number;
  spyRsi: number;
  vix: number;
  regimeScore: number;
}

interface KnowledgeSourceRecord {
  id: string;
  publisher: string;
  trust_tier: string;
  url: string;
}

interface TradingKnowledgeRecord {
  id: string;
  category: "swing_principles" | "risk_management" | "order_mechanics" | "broker_workflows" | "app_help";
  title: string;
  content: string;
  tags: string[];
  broker: string | null;
  platform: string | null;
  source_id: string | null;
}

interface KnowledgeMatch extends TradingKnowledgeRecord {
  sourceLabel: string | null;
  sourceUrl: string | null;
  trustTier: string | null;
}

interface BrokerWorkflowRecord {
  id: string;
  broker: string;
  platform: string;
  instrument: string;
  order_types_supported: string[];
  steps_json: string[];
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_QUESTION_CHARS = 1000;
const MAX_HISTORY_MESSAGES = 10;
const MAX_HISTORY_CHARS = 1000;
const MAX_STOCKS_PER_CHAT = 50;

// ── Utility helpers ────────────────────────────────────────────────────────────

function safeFixed(value: unknown, decimals: number): string {
  const n = Number(value);
  return isFinite(n) ? n.toFixed(decimals) : "—";
}

function sanitizeHistory(input: unknown): HistoryMessage[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is { role: unknown; content: unknown } => typeof item === "object" && item !== null)
    .map((item): HistoryMessage => {
      const role: "user" | "assistant" = item.role === "assistant" ? "assistant" : "user";
      const content = typeof item.content === "string" ? item.content.slice(0, MAX_HISTORY_CHARS) : "";
      return { role, content };
    })
    .filter((item) => item.content.trim().length > 0)
    .slice(-MAX_HISTORY_MESSAGES);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function encodeEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

// ── Built-in trade analysis ────────────────────────────────────────────────────

function generateTradeAnalysis(stock: Stock, regime?: RegimeData): string {
  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? (stock.bearScore ?? 0) : (stock.bullScore ?? 0);
  const signals = stock.signals ?? {};
  const passingSignals = Object.entries(signals).filter(([, v]) => v).map(([k]) => k);
  const failingSignals = Object.entries(signals).filter(([, v]) => !v).map(([k]) => k);

  const strengthLabel = score >= 6 ? "high-conviction" : score >= 4 ? "moderate" : "low-confidence";
  const rrQuality =
    (Number(stock.riskReward) || 0) >= 3 ? "well-defined" :
    (Number(stock.riskReward) || 0) >= 2 ? "acceptable" : "tight";

  const rsi = Number(stock.rsi) || 50;
  const rsiNote = !isShort
    ? rsi < 40 ? `RSI at ${safeFixed(rsi, 0)} is oversold — watch for a mean-reversion bounce.`
      : rsi > 70 ? `RSI at ${safeFixed(rsi, 0)} is extended — consider waiting for a pullback.`
      : `RSI at ${safeFixed(rsi, 0)} is constructive — healthy momentum.`
    : rsi > 60 ? `RSI at ${safeFixed(rsi, 0)} is overbought — confirms fade opportunity.`
      : rsi < 30 ? `RSI at ${safeFixed(rsi, 0)} is oversold — snap-back risk; size down.`
      : `RSI at ${safeFixed(rsi, 0)} is neutral — confirm with price action.`;

  const volRatio = Number(stock.volumeRatio) || 0;
  const volNote = stock.volumeSpike
    ? "Volume spike confirms institutional participation."
    : volRatio > 1.5 ? `Volume ${safeFixed(volRatio, 1)}× average — above-normal activity.`
    : "Volume near average — lacks strong institutional confirmation.";

  const regimeLine = regime
    ? ` In a ${regime.status} regime (score ${safeFixed(regime.regimeScore, 0)}/6, VIX ${safeFixed(regime.vix, 1)}).`
    : "";

  const conflictNote = stock.conflictTrend
    ? " ⚠ Conflicting trend — short-term momentum diverges from long-term structure; wait for resolution."
    : "";
  const earningsNote = stock.earningsWarning
    ? " ⚠ Earnings within 14 days — size down or wait for post-event clarity."
    : "";
  const siNote = stock.shortInterest != null && Number(stock.shortInterest) > 0
    ? ` Short interest: ${safeFixed(stock.shortInterest, 1)}%.`
    : "";

  return (
    `${stock.ticker} (${stock.name ?? stock.ticker}) shows ${score}/8 ${stock.tradeType} signals — ${strengthLabel} setup.${regimeLine}\n\n` +
    `Entry $${safeFixed(stock.bestEntry, 2)} / stop $${safeFixed(stock.stopLoss, 2)} / target $${safeFixed(stock.target, 2)} → R:R ${safeFixed(stock.riskReward, 2)}:1 (${rrQuality}). ATR $${safeFixed(stock.atr, 2)}, ${safeFixed(stock.distance52w, 1)}% from 52-week extreme.\n\n` +
    `${rsiNote} ${volNote}${siNote}\n\n` +
    `Signals passing (${passingSignals.length}): ${passingSignals.join(", ") || "none"}. Failing (${failingSignals.length}): ${failingSignals.join(", ") || "none"}.` +
    conflictNote + earningsNote
  );
}

// ── Built-in chat answer ───────────────────────────────────────────────────────

function generateChatAnswer(
  question: string,
  stocks: Stock[],
  regime: RegimeData | undefined,
  knowledgeMatches: KnowledgeMatch[],
  brokerWorkflows: BrokerWorkflowRecord[],
): string {
  const q = question.toLowerCase();
  const getScore = (s: Stock) => s.tradeType === "LONG" ? (s.bullScore ?? 0) : (s.bearScore ?? 0);

  // ── Regime / market questions ──────────────────────────────────────────────
  if (/how.*(market|regime)|market (status|condition)|what.*(regime|market)|regime|spy\b/i.test(q)) {
    if (!regime) return "No live market regime data available. Connect to Supabase to see live regime.";
    const biasSentence =
      regime.status === "BULLISH" ? "Conditions favour LONG setups — lean into buying pullbacks."
      : regime.status === "BEARISH" ? "Bearish — reduce LONG exposure, prefer SHORTs or cash."
      : "Mixed — require high conviction before committing.";
    return (
      `Market Regime: **${regime.status}** (${safeFixed(regime.regimeScore, 0)}/6 conditions passing)\n\n` +
      `SPY $${safeFixed(regime.spyPrice, 2)} vs SMA200 $${safeFixed(regime.sma200, 2)}\n` +
      `SPY RSI: ${safeFixed(regime.spyRsi, 1)} | VIX: ${safeFixed(regime.vix, 1)}\n\n` +
      biasSentence
    );
  }

  // ── Top setups ──────────────────────────────────────────────────────────────
  if (/top|best|strongest|hottest|good buy|what.*look|any.*setup|setup/i.test(q)) {
    const top = [...stocks].sort((a, b) => getScore(b) - getScore(a)).slice(0, 5);
    if (top.length === 0) return "No stock data available right now.";
    const lines = top.map((s, i) => {
      const score = getScore(s);
      const flags = [
        s.earningsWarning ? "⚠ earnings" : "",
        s.conflictTrend ? "⚠ conflict" : "",
      ].filter(Boolean).join(" ");
      return `${i + 1}. **${s.ticker}** (${s.tradeType}) — ${score}/8 signals, $${safeFixed(s.price, 2)}, R:R ${safeFixed(s.riskReward, 1)}:1, RSI ${safeFixed(s.rsi, 0)} ${flags}`;
    }).join("\n");
    return `Top setups right now (${stocks.length} scanned):\n\n${lines}\n\nRegime: ${regime?.status ?? "UNKNOWN"}`;
  }

  // ── Broker workflow ─────────────────────────────────────────────────────────
  if (brokerWorkflows.length > 0) {
    const parts = brokerWorkflows.map((wf) =>
      `**${wf.broker}** (${wf.platform}) — ${wf.instrument}:\n` +
      (wf.steps_json as string[]).map((step, i) => `${i + 1}. ${step}`).join("\n")
    );
    return parts.join("\n\n") + "\n\n_Verify against your broker's current UI — steps may vary by account type._";
  }

  // ── Ticker-specific lookup ──────────────────────────────────────────────────
  const tickerMatches = (question.match(/\b([A-Z]{2,5})\b/g) ?? []).map((t) => t.toUpperCase());
  const mentionedStocks = [...new Set(tickerMatches)]
    .map((t) => stocks.find((s) => s.ticker === t))
    .filter((s): s is Stock => s !== undefined);

  if (mentionedStocks.length === 1) {
    return generateTradeAnalysis(mentionedStocks[0], regime);
  }

  // ── Comparison ──────────────────────────────────────────────────────────────
  if (mentionedStocks.length >= 2 && /vs|versus|compare|better/i.test(q)) {
    const [a, b] = mentionedStocks;
    const scoreA = getScore(a);
    const scoreB = getScore(b);
    const betterScore = scoreA > scoreB ? a.ticker : scoreB > scoreA ? b.ticker : "Tied";
    const betterRR = (Number(a.riskReward) || 0) >= (Number(b.riskReward) || 0) ? a.ticker : b.ticker;
    return (
      `**${a.ticker} vs ${b.ticker}**\n\n` +
      `${a.ticker} (${a.tradeType}): ${scoreA}/8 signals, $${safeFixed(a.price, 2)}, R:R ${safeFixed(a.riskReward, 2)}:1, RSI ${safeFixed(a.rsi, 0)}` +
      (a.earningsWarning ? " ⚠ earnings" : "") + "\n" +
      `${b.ticker} (${b.tradeType}): ${scoreB}/8 signals, $${safeFixed(b.price, 2)}, R:R ${safeFixed(b.riskReward, 2)}:1, RSI ${safeFixed(b.rsi, 0)}` +
      (b.earningsWarning ? " ⚠ earnings" : "") + "\n\n" +
      `Higher score: **${betterScore}** | Better R:R: **${betterRR}**`
    );
  }

  // ── Knowledge base answer ───────────────────────────────────────────────────
  if (knowledgeMatches.length > 0) {
    const blocks = knowledgeMatches.slice(0, 3).map((m) => {
      const src = m.sourceLabel && m.sourceUrl ? `\n_Source: ${m.sourceLabel} — ${m.sourceUrl}_` : "";
      return `**${m.title}**\n${m.content}${src}`;
    });
    return blocks.join("\n\n");
  }

  // ── Default: market overview ────────────────────────────────────────────────
  const top3 = [...stocks].sort((a, b) => getScore(b) - getScore(a)).slice(0, 3);
  const longCount = stocks.filter((s) => s.tradeType === "LONG").length;
  const shortCount = stocks.filter((s) => s.tradeType === "SHORT").length;
  const biasSentence =
    regime?.status === "BULLISH" ? "Favours LONG setups." :
    regime?.status === "BEARISH" ? "Favours SHORT setups — reduce LONG size." :
    "Mixed — require high conviction.";
  const setupLines = top3.map((s, i) =>
    `${i + 1}. ${s.ticker} (${s.tradeType}) — ${getScore(s)}/8 signals, R:R ${safeFixed(s.riskReward, 2)}:1`
  ).join("\n");
  const topTicker = top3[0]?.ticker ?? "NVDA";
  const secondTicker = top3[1]?.ticker ?? "AAPL";
  return (
    `Regime: ${regime?.status ?? "UNKNOWN"} (${safeFixed(regime?.regimeScore, 0)}/6 conditions). VIX ${safeFixed(regime?.vix, 1)}. ${biasSentence}\n` +
    `Universe: ${stocks.length} tickers — ${longCount} LONG, ${shortCount} SHORT.\n\n` +
    `Top setups:\n${setupLines}\n\n` +
    `Try: "tell me about ${topTicker}", "top setups", "compare ${topTicker} vs ${secondTicker}", or "how is the market?"`
  );
}

// ── Knowledge fetchers ─────────────────────────────────────────────────────────

function scoreKnowledgeMatch(question: string, item: TradingKnowledgeRecord): number {
  const q = question.toLowerCase();
  let score = 0;
  if (q.includes(item.category.replace(/_/g, " "))) score += 2;
  if (item.broker && q.includes(item.broker.toLowerCase())) score += 4;
  if (item.platform && q.includes(item.platform.toLowerCase())) score += 1;
  for (const tag of item.tags ?? []) {
    if (q.includes(tag.toLowerCase())) score += 2;
  }
  for (const word of item.title.toLowerCase().split(/\s+/)) {
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

async function fetchKnowledgeMatches(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authToken: string,
  question: string,
): Promise<KnowledgeMatch[]> {
  try {
    const commonHeaders = { "Authorization": `Bearer ${authToken}`, "apikey": supabaseAnonKey };
    const [knowledgeRes, sourcesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/trading_knowledge?select=id,category,title,content,tags,broker,platform,source_id`, { headers: commonHeaders }),
      fetch(`${supabaseUrl}/rest/v1/knowledge_sources?select=id,publisher,url,trust_tier`, { headers: commonHeaders }),
    ]);
    if (!knowledgeRes.ok || !sourcesRes.ok) return [];

    const knowledgeRows = await knowledgeRes.json() as TradingKnowledgeRecord[];
    const sourceRows = await sourcesRes.json() as KnowledgeSourceRecord[];
    const sourcesById = new Map(sourceRows.map((s) => [s.id, s]));

    return knowledgeRows
      .map((item) => {
        const src = item.source_id ? sourcesById.get(item.source_id) : undefined;
        return { ...item, sourceLabel: src?.publisher ?? null, sourceUrl: src?.url ?? null, trustTier: src?.trust_tier ?? null };
      })
      .map((item) => ({ item, score: scoreKnowledgeMatch(question, item) }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((e) => e.item);
  } catch {
    return [];
  }
}

function buildSources(matches: KnowledgeMatch[]): Array<{ label: string; url: string }> {
  const deduped = new Map<string, { label: string; url: string }>();
  for (const match of matches) {
    if (!match.sourceLabel || !match.sourceUrl) continue;
    const key = `${match.sourceLabel}::${match.sourceUrl}`;
    if (!deduped.has(key)) deduped.set(key, { label: match.sourceLabel, url: match.sourceUrl });
    if (deduped.size >= 3) break;
  }
  return [...deduped.values()];
}

async function fetchBrokerWorkflows(
  supabaseUrl: string,
  supabaseAnonKey: string,
  authToken: string,
  question: string,
): Promise<BrokerWorkflowRecord[]> {
  const BROKER_MAP: Record<string, string> = {
    "robinhood": "Robinhood",
    "fidelity": "Fidelity",
    "interactive brokers": "Interactive Brokers",
    "ibkr": "Interactive Brokers",
    "webull": "Webull",
    "moomoo": "Moomoo",
  };
  const q = question.toLowerCase();
  const mentionedBrokers = new Set<string>();
  for (const [key, val] of Object.entries(BROKER_MAP)) {
    if (q.includes(key)) mentionedBrokers.add(val);
  }
  if (mentionedBrokers.size === 0) return [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/broker_order_workflows?select=id,broker,platform,instrument,order_types_supported,steps_json`,
      { headers: { "Authorization": `Bearer ${authToken}`, "apikey": supabaseAnonKey } },
    );
    if (!res.ok) return [];
    const rows = await res.json() as BrokerWorkflowRecord[];
    return rows.filter((wf) => mentionedBrokers.has(wf.broker));
  } catch {
    return [];
  }
}

// ── Edge Function handler ──────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const authToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { "Authorization": `Bearer ${authToken}`, "apikey": supabaseAnonKey },
  });
  if (!userRes.ok) {
    return jsonResponse({ error: "Authentication required" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }

  const parsedBody = body as {
    type?: unknown;
    stock?: unknown;
    regime?: unknown;
    question?: unknown;
    stocks?: unknown;
    history?: unknown;
  };

  // Sanitize history (validates format even though the built-in path doesn't use it for LLM calls)
  sanitizeHistory(parsedBody.history);

  const requestType = typeof parsedBody.type === "string" ? parsedBody.type : "";
  const stock = parsedBody.stock as Stock | undefined;
  const regime = parsedBody.regime as RegimeData | undefined;
  const question = parsedBody.question;
  const stocks = parsedBody.stocks;

  let answerText: string;
  let sources: Array<{ label: string; url: string }> = [];
  let uncitedWarning = false;

  if (requestType === "trade" && stock) {
    answerText = generateTradeAnalysis(stock, regime);
  } else if (
    requestType === "chat" &&
    typeof question === "string" &&
    question.trim().length > 0 &&
    Array.isArray(stocks) &&
    stocks.length > 0
  ) {
    const normalizedQuestion = question.trim().slice(0, MAX_QUESTION_CHARS);
    const stockList = stocks.slice(0, MAX_STOCKS_PER_CHAT) as Stock[];
    let knowledgeMatches: KnowledgeMatch[] = [];
    let brokerWorkflows: BrokerWorkflowRecord[] = [];
    try {
      [knowledgeMatches, brokerWorkflows] = await Promise.all([
        fetchKnowledgeMatches(supabaseUrl, supabaseAnonKey, authToken, normalizedQuestion),
        fetchBrokerWorkflows(supabaseUrl, supabaseAnonKey, authToken, normalizedQuestion),
      ]);
    } catch (e) {
      console.error("knowledge retrieval failed", e);
    }
    sources = buildSources(knowledgeMatches);
    uncitedWarning = knowledgeMatches.length === 0 && brokerWorkflows.length === 0;
    answerText = generateChatAnswer(normalizedQuestion, stockList, regime, knowledgeMatches, brokerWorkflows);
  } else {
    return jsonResponse({ error: "Invalid request: missing required fields" }, 400);
  }

  // Emit as SSE — same format the streaming client in use-ai-analysis.ts already reads.
  const readable = new ReadableStream({
    start(controller) {
      controller.enqueue(encodeEvent({ meta: { sources, uncitedWarning } }));
      controller.enqueue(encodeEvent({ text: answerText }));
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
});
