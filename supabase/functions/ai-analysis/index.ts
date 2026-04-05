import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";

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

const MAX_QUESTION_CHARS = 500;
const MAX_HISTORY_MESSAGES = 6;
const MAX_HISTORY_CHARS = 500;
const MAX_STOCKS_PER_CHAT = 50;

function sanitizeHistory(input: unknown): HistoryMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter((item): item is { role: unknown; content: unknown } => {
      return typeof item === "object" && item !== null;
    })
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : "user";
      const content = typeof item.content === "string"
        ? item.content.slice(0, MAX_HISTORY_CHARS)
        : "";
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

function buildTradePrompt(stock: Stock, regime?: RegimeData): string {
  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;
  const signals = stock.signals;

  const passingSignals = Object.entries(signals).filter(([, value]) => value).map(([key]) => key);
  const failingSignals = Object.entries(signals).filter(([, value]) => !value).map(([key]) => key);

  const newsLines = stock.news.slice(0, 3).map((item) =>
    `- [${item.sentiment?.toUpperCase() ?? "NEUTRAL"}] ${item.title} (${item.source ?? ""} ${item.date})`
  ).join("\n");

  const regimeContext = regime
    ? `Market Regime: ${regime.status} (score ${regime.regimeScore}/6, SPY RSI ${regime.spyRsi.toFixed(1)}, VIX ${regime.vix.toFixed(1)})`
    : "";

  return `Analyze this swing trade setup and give a concise 3-4 sentence trader's take. Be direct and specific about the risk/reward.

TICKER: ${stock.ticker} (${stock.name})
DIRECTION: ${stock.tradeType}
SCORE: ${score}/8 ${isShort ? "bear" : "bull"} signals
PRICE: $${stock.price.toFixed(2)}
ENTRY: $${stock.bestEntry.toFixed(2)} | STOP: $${stock.stopLoss.toFixed(2)} | TARGET: $${stock.target.toFixed(2)}
R:R: ${stock.riskReward.toFixed(2)} | ATR: $${stock.atr.toFixed(2)}
RSI: ${stock.rsi.toFixed(1)} | VOL RATIO: ${stock.volumeRatio.toFixed(2)}x
52W DISTANCE: ${stock.distance52w > 0 ? "+" : ""}${stock.distance52w.toFixed(1)}%
${stock.shortInterest != null ? `SHORT INTEREST: ${stock.shortInterest.toFixed(1)}%` : ""}
${stock.earningsWarning ? "⚠ EARNINGS WARNING: upcoming earnings within 7 days" : ""}

PASSING SIGNALS (${passingSignals.length}): ${passingSignals.join(", ") || "none"}
FAILING SIGNALS (${failingSignals.length}): ${failingSignals.join(", ") || "none"}

${regimeContext}

RECENT NEWS:
${newsLines || "No recent news"}

Respond in 3-4 punchy sentences: signal quality, key risk, actionability. No preamble.`;
}

function buildChatPrompt(
  question: string,
  stocks: Stock[],
  regime: RegimeData | undefined,
  knowledgeMatches: KnowledgeMatch[],
  brokerWorkflows: BrokerWorkflowRecord[],
  uncitedWarning: boolean,
): string {
  const regimeContext = regime
    ? `MARKET REGIME: ${regime.status} (score ${regime.regimeScore}/6, VIX ${regime.vix.toFixed(1)}, SPY RSI ${regime.spyRsi.toFixed(1)})`
    : "MARKET REGIME: unavailable";

  const stockSummary = stocks.map((stock) => {
    const score = stock.tradeType === "SHORT" ? stock.bearScore : stock.bullScore;
    return `${stock.ticker} ${stock.tradeType} score=${score}/8 price=$${stock.price.toFixed(2)} entry=$${stock.bestEntry.toFixed(2)} rr=${stock.riskReward.toFixed(1)} rsi=${stock.rsi.toFixed(0)}${stock.earningsWarning ? " ⚠earnings" : ""}`;
  }).join("\n");

  const knowledgeBlock = knowledgeMatches.length > 0
    ? knowledgeMatches.slice(0, 5).map((item, index) => {
      const sourceLine = item.sourceLabel && item.sourceUrl
        ? `Source: ${item.sourceLabel} (${item.trustTier ?? "?"}) ${item.sourceUrl}`
        : "Source: none";
      return `${index + 1}. [${item.category}] ${item.title}\n${item.content}\n${sourceLine}`;
    }).join("\n\n")
    : "No curated knowledge matched this question.";

  const workflowBlock = brokerWorkflows.length > 0
    ? "\n\nBROKER ORDER WORKFLOWS:\n" + brokerWorkflows.map((wf) =>
      `${wf.broker} (${wf.platform}): ${(wf.steps_json as unknown as string[]).join(" → ")}`
    ).join("\n")
    : "";

  return `You are SwingPulse's built-in trading copilot for US stocks and ETFs.

SWINGPULSE GLOSSARY:
- Bull score (0–8): count of 8 LONG signals passing — sma200 (price > 200-day SMA), sma50 (price > 50-day SMA), rsiMomentum (RSI-14 > 50), volume (volume ratio > 1.5×), macd (MACD line above signal), priceAction (bullish close structure), trendStrength (ADX > 20), earningsSetup (no earnings within 7 days).
- Bear score (0–8): same 8 signals inverted for SHORT setups.
- tradeType: "LONG" when bullScore > bearScore; "SHORT" when bearScore > bullScore.
- Regime: BULLISH = SPY above SMA200 with ≥5 of 6 SPY macro conditions passing; BEARISH = SPY below SMA200; NEUTRAL = mixed. BULLISH favors LONGs; BEARISH favors SHORTs.
- regimeScore: count of 6 SPY conditions passing (SPY > SMA200, SPY > SMA50, SPY RSI-14 > 50, VIX < 20, SPY MACD bullish, SPY above prior-week high).
- bestEntry: suggested limit-order entry near nearest support/resistance level.
- stopLoss: ATR-based protective stop (1× ATR below entry for LONG, above for SHORT).
- target: profit-taking level (2× ATR from entry in trade direction).
- riskReward (R:R): (target − entry) ÷ (entry − stop). Prefer ≥ 2.0.
- ATR: Average True Range — mean daily high-low range in dollars over the last 14 days. Measures volatility.
- volumeRatio: today's volume ÷ 20-day average. > 1.5× indicates institutional participation.
- distance52w: % from 52-week high (LONG) or low (SHORT). Negative = below the high.
- shortInterest: % of float sold short. > 15% = elevated short-squeeze risk.
- earningsWarning: true when a company earnings report is ≤ 7 calendar days away — avoid new entries.

${regimeContext}

CURRENT UNIVERSE (${stocks.length} tickers):
${stockSummary}

CURATED KNOWLEDGE:
${knowledgeBlock}${workflowBlock}

TRADER QUESTION: ${question}

Rules:
- Classify intent as: market-regime | setup-ranking | ticker-specific | comparison | risk-sizing | broker-workflow | app-help | education.
- For ticker-specific or comparison: use live universe data above.
- For broker-workflow: use the BROKER ORDER WORKFLOWS section if present; otherwise use curated knowledge.
- For app-help or education: use CURATED KNOWLEDGE; cite sources when present.
- Never invent citations or imply a source was used if not supplied above.
- If curated knowledge is missing for an educational question, explicitly frame the answer as general guidance.
- Keep the answer under 200 words. Be direct and trader-focused.
- Structure: 1) Direct answer, 2) Key supporting data or logic, 3) Concrete next step the trader can take.
${uncitedWarning ? "\nNo curated source was found for this question. Make that limitation explicit in your answer." : ""}`;
}

function scoreKnowledgeMatch(question: string, item: TradingKnowledgeRecord): number {
  const normalizedQuestion = question.toLowerCase();
  let score = 0;

  if (normalizedQuestion.includes(item.category.replace(/_/g, " "))) score += 2;
  if (item.broker && normalizedQuestion.includes(item.broker.toLowerCase())) score += 4;
  if (item.platform && normalizedQuestion.includes(item.platform.toLowerCase())) score += 1;

  for (const tag of item.tags ?? []) {
    if (normalizedQuestion.includes(tag.toLowerCase())) score += 2;
  }

  const titleWords = item.title.toLowerCase().split(/\s+/);
  for (const word of titleWords) {
    if (word.length >= 4 && normalizedQuestion.includes(word)) score += 1;
  }

  // Boost app_help entries when question is about the app or its metrics
  if (
    item.category === "app_help" &&
    /score|regime|setup|signal|bull|bear|long|short|atr|entry|stop|target|r:r|risk.reward|panel|dashboard|swingpulse|universe|watchlist|position|backtest|volume.ratio|52.week|earnings.warning/.test(
      normalizedQuestion,
    )
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
  const commonHeaders = {
    "Authorization": `Bearer ${authToken}`,
    "apikey": supabaseAnonKey,
  };

  const [knowledgeRes, sourcesRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/trading_knowledge?select=id,category,title,content,tags,broker,platform,source_id`, {
      headers: commonHeaders,
    }),
    fetch(`${supabaseUrl}/rest/v1/knowledge_sources?select=id,publisher,url,trust_tier`, {
      headers: commonHeaders,
    }),
  ]);

  if (!knowledgeRes.ok || !sourcesRes.ok) {
    throw new Error("Could not load curated knowledge for AI analysis");
  }

  const knowledgeRows = await knowledgeRes.json() as TradingKnowledgeRecord[];
  const sourceRows = await sourcesRes.json() as KnowledgeSourceRecord[];
  const sourcesById = new Map(sourceRows.map((source) => [source.id, source]));

  return knowledgeRows
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

function buildSources(matches: KnowledgeMatch[]): Array<{ label: string; url: string }> {
  const deduped = new Map<string, { label: string; url: string }>();
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

  const res = await fetch(
    `${supabaseUrl}/rest/v1/broker_order_workflows?select=id,broker,platform,instrument,order_types_supported,steps_json`,
    { headers: { "Authorization": `Bearer ${authToken}`, "apikey": supabaseAnonKey } },
  );
  if (!res.ok) return [];

  const rows = await res.json() as BrokerWorkflowRecord[];
  return rows.filter((wf) => mentionedBrokers.has(wf.broker));
}

function encodeEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

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

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "Server misconfiguration: ANTHROPIC_API_KEY not set" }, 500);
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

  const requestType = typeof parsedBody.type === "string" ? parsedBody.type : "";
  const stock = parsedBody.stock as Stock | undefined;
  const regime = parsedBody.regime as RegimeData | undefined;
  const question = parsedBody.question;
  const stocks = parsedBody.stocks;
  const history = sanitizeHistory(parsedBody.history);

  let prompt: string;
  let knowledgeMatches: KnowledgeMatch[] = [];
  let brokerWorkflows: BrokerWorkflowRecord[] = [];
  let sources: Array<{ label: string; url: string }> = [];
  let uncitedWarning = false;

  if (requestType === "trade" && stock) {
    prompt = buildTradePrompt(stock, regime);
  } else if (
    requestType === "chat" &&
    typeof question === "string" &&
    question.trim().length > 0 &&
    Array.isArray(stocks) &&
    stocks.length > 0
  ) {
    const normalizedQuestion = question.trim().slice(0, MAX_QUESTION_CHARS);
    const stockList = stocks.slice(0, MAX_STOCKS_PER_CHAT) as Stock[];

    try {
      [knowledgeMatches, brokerWorkflows] = await Promise.all([
        fetchKnowledgeMatches(supabaseUrl, supabaseAnonKey, authToken, normalizedQuestion),
        fetchBrokerWorkflows(supabaseUrl, supabaseAnonKey, authToken, normalizedQuestion),
      ]);
    } catch (error) {
      console.error("knowledge retrieval failed", error);
    }
    sources = buildSources(knowledgeMatches);
    uncitedWarning = knowledgeMatches.length === 0 && brokerWorkflows.length === 0;
    prompt = buildChatPrompt(normalizedQuestion, stockList, regime, knowledgeMatches, brokerWorkflows, uncitedWarning);
  } else {
    return jsonResponse({ error: "Invalid request: missing required fields" }, 400);
  }

  const systemPrompt = requestType === "trade"
    ? "You are an expert swing trading analyst. Be concise, direct, and data-driven. No disclaimers."
    : "You are SwingPulse's built-in trading assistant for US stocks and ETFs. Answer in the trader's frame: direct, specific, data-grounded. Rely on curated knowledge when provided and cite sources. Do not fabricate citations. For educational questions without curated backing, give general guidance and say so explicitly.";

  const client = new Anthropic({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encodeEvent({ meta: { sources, uncitedWarning } }));

        const historyMessages = history.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        const stream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: systemPrompt,
          messages: [...historyMessages, { role: "user", content: prompt }],
        });

        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encodeEvent({ text: event.delta.text }));
          }
        }

        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        controller.enqueue(encodeEvent({ error: message }));
      } finally {
        controller.close();
      }
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
