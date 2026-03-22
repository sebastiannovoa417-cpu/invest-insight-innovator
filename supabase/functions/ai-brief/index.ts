// @ts-nocheck — Deno Edge Function; VS Code TS compiler does not understand Deno imports.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { regime, stocks } = await req.json();

    if (!regime || !stocks) {
      return new Response(JSON.stringify({ error: "regime and stocks are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const top5 = stocks.slice(0, 5);

    const stockLines = top5
      .map((s: any, i: number) => {
        const score = s.tradeType === "SHORT" ? s.bearScore : s.bullScore;
        const conflict = s.conflictTrend ? " ⚠ CONFLICT" : "";
        return `${i + 1}. ${s.ticker} (${s.tradeType}) — Score ${score}/8 · Price $${s.price?.toFixed(2)} · RSI ${s.rsi?.toFixed(1)} · Vol ${s.volumeRatio?.toFixed(2)}x${conflict}`;
      })
      .join("\n");

    const prompt = `You are SwingPulse, a professional swing trading analyst. Analyze the following live market snapshot and write a concise, actionable briefing for a swing trader. Be direct and specific. No fluff. Max 4 short paragraphs.

MARKET REGIME: ${regime.status}
SPY: $${regime.spyPrice?.toFixed(2)} vs SMA200: $${regime.sma200?.toFixed(2)} (${(regime.ratio * 100)?.toFixed(1)}% above/below)
SPY RSI: ${regime.spyRsi?.toFixed(1)} | VIX: ${regime.vix?.toFixed(1)} | Regime Score: ${regime.regimeScore}/10

TOP SETUPS (${top5.length} of ${stocks.length} scanned):
${stockLines}

Write:
1. One sentence on the regime and what it means for entries right now.
2. The 2–3 strongest setups and why they stand out (use ticker names).
3. Key risk factors to watch (earnings, VIX, conflicts).
4. One sentence on overall bias and preferred position sizing.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(JSON.stringify({ error: `Anthropic API error: ${err}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const briefing = data.content?.[0]?.text ?? "";

    return new Response(
      JSON.stringify({
        briefing,
        model: data.model,
        usage: data.usage,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-brief error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
