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
    ? knowledgeMatches.slice(0, 4).map((item, index) => {
      const sourceLine = item.sourceLabel && item.sourceUrl
        ? `Source: ${item.sourceLabel} (${item.trustTier ?? "?"}) ${item.sourceUrl}`
        : "Source: none";
      return `${index + 1}. [${item.category}] ${item.title}\n${item.content}\n${sourceLine}`;
    }).join("\n\n")
    : "No curated educational knowledge matched this question.";

  return `You are SwingPulse's built-in trading copilot for US stocks and ETFs.

${regimeContext}

CURRENT UNIVERSE (${stocks.length} tickers):
${stockSummary}

CURATED KNOWLEDGE:
${knowledgeBlock}

TRADER QUESTION: ${question}

Rules:
- Use the live market data above when the question is about current setups.
- Use curated knowledge when it is relevant, especially for educational or broker workflow questions.
- Do not invent citations or claim a source was used if it was not supplied.
- If curated knowledge is missing for an educational question, explicitly frame the answer as general guidance.
- Keep the answer under 180 words and optimize for direct, practical guidance.

${uncitedWarning ? "A curated source match was not found for this educational question. Make that limitation explicit in the answer." : ""}`;
}

function isEducationalQuestion(question: string): boolean {
  return /swing|setup|principle|risk|order|broker|stop|limit|trailing|how do i place|robinhood|fidelity|interactive brokers|ibkr|webull|moomoo/.test(
    question.toLowerCase(),
  );
}

function scoreKnowledgeMatch(question: string, item: TradingKnowledgeRecord): number {
  const normalizedQuestion = question.toLowerCase();
  let score = 0;

  if (normalizedQuestion.includes(item.category.replace("_", " "))) score += 2;
  if (item.broker && normalizedQuestion.includes(item.broker.toLowerCase())) score += 4;
  if (item.platform && normalizedQuestion.includes(item.platform.toLowerCase())) score += 1;

  for (const tag of item.tags ?? []) {
    if (normalizedQuestion.includes(tag.toLowerCase())) score += 2;
  }

  const titleWords = item.title.toLowerCase().split(/\s+/);
  for (const word of titleWords) {
    if (word.length >= 4 && normalizedQuestion.includes(word)) score += 1;
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

  let body: { type: string; stock?: Stock; regime?: RegimeData; question?: string; stocks?: Stock[] };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const { type, stock, regime, question, stocks } = body;
  const educational = type === "chat" && question ? isEducationalQuestion(question) : false;

  let prompt: string;
  let knowledgeMatches: KnowledgeMatch[] = [];
  let sources: Array<{ label: string; url: string }> = [];
  let uncitedWarning = false;

  if (type === "trade" && stock) {
    prompt = buildTradePrompt(stock, regime);
  } else if (type === "chat" && question && stocks) {
    if (educational) {
      try {
        knowledgeMatches = await fetchKnowledgeMatches(supabaseUrl, supabaseAnonKey, authToken, question);
      } catch (error) {
        console.error("knowledge retrieval failed", error);
      }
      sources = buildSources(knowledgeMatches);
      uncitedWarning = educational && sources.length === 0;
    }
    prompt = buildChatPrompt(question, stocks, regime, knowledgeMatches, uncitedWarning);
  } else {
    return jsonResponse({ error: "Invalid request: missing required fields" }, 400);
  }

  const systemPrompt = type === "trade"
    ? "You are an expert swing trading analyst. Be concise, direct, and data-driven. No disclaimers."
    : "You are SwingPulse's built-in market and trading assistant for US stocks and ETFs. Answer clearly and practically. When curated knowledge is provided, rely on it. Do not fabricate citations or claim source-backed certainty when no curated source was supplied.";

  const client = new Anthropic({ apiKey });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encodeEvent({ meta: { sources, uncitedWarning } }));

        const stream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }],
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
