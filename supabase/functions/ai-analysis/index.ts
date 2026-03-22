import Anthropic from "npm:@anthropic-ai/sdk@^0.39.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StockSignals {
  sma200: boolean; sma50: boolean; rsiMomentum: boolean; volume: boolean;
  macd: boolean; priceAction: boolean; trendStrength: boolean; earningsSetup: boolean;
}

interface NewsItem {
  title: string; date: string; source?: string; sentiment?: string; url?: string;
}

interface Stock {
  ticker: string; name: string; tradeType: string;
  bullScore: number; bearScore: number; price: number;
  rsi: number; volumeRatio: number; signals: StockSignals;
  bestEntry: number; stopLoss: number; target: number;
  riskReward: number; atr: number; distance52w: number;
  news: NewsItem[]; earningsWarning: boolean; shortInterest?: number;
}

interface RegimeData {
  status: string; spyPrice: number; sma200: number; spyRsi: number; vix: number; regimeScore: number;
}

function buildTradePrompt(stock: Stock, regime?: RegimeData): string {
  const isShort = stock.tradeType === "SHORT";
  const score = isShort ? stock.bearScore : stock.bullScore;
  const signals = stock.signals;

  const passingSignals = Object.entries(signals).filter(([, v]) => v).map(([k]) => k);
  const failingSignals = Object.entries(signals).filter(([, v]) => !v).map(([k]) => k);

  const newsLines = stock.news.slice(0, 3).map(n =>
    `- [${n.sentiment?.toUpperCase() ?? "NEUTRAL"}] ${n.title} (${n.source ?? ""} ${n.date})`
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

function buildChatPrompt(question: string, stocks: Stock[], regime?: RegimeData): string {
  const regimeContext = regime
    ? `MARKET REGIME: ${regime.status} (score ${regime.regimeScore}/6, VIX ${regime.vix.toFixed(1)}, SPY RSI ${regime.spyRsi.toFixed(1)})`
    : "";

  const stockSummary = stocks.map(s => {
    const score = s.tradeType === "SHORT" ? s.bearScore : s.bullScore;
    return `${s.ticker} ${s.tradeType} score=${score}/8 price=$${s.price.toFixed(2)} entry=$${s.bestEntry.toFixed(2)} rr=${s.riskReward.toFixed(1)} rsi=${s.rsi.toFixed(0)}${s.earningsWarning ? " ⚠earnings" : ""}`;
  }).join("\n");

  return `You are analyzing a swing trading signals dashboard. Answer the trader's question concisely and directly.

${regimeContext}

CURRENT UNIVERSE (${stocks.length} tickers):
${stockSummary}

TRADER'S QUESTION: ${question}

Be direct, specific, and use the data above. Reference specific tickers and numbers. Keep it under 150 words.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfiguration: ANTHROPIC_API_KEY not set" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  let body: { type: string; stock?: Stock; regime?: RegimeData; question?: string; stocks?: Stock[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: CORS_HEADERS });
  }

  const { type, stock, regime, question, stocks } = body;

  let prompt: string;
  if (type === "trade" && stock) {
    prompt = buildTradePrompt(stock, regime);
  } else if (type === "chat" && question && stocks) {
    prompt = buildChatPrompt(question, stocks, regime);
  } else {
    return new Response(JSON.stringify({ error: "Invalid request: missing required fields" }), {
      status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const client = new Anthropic({ apiKey });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-opus-4-5",
          max_tokens: 512,
          system: "You are an expert swing trading analyst. Be concise, direct, and data-driven. No disclaimers.",
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
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
