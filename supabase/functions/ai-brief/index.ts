// @ts-nocheck — Deno Edge Function; VS Code TS compiler does not understand Deno imports.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface Stock {
  ticker: string;
  tradeType: string;
  bullScore: number;
  bearScore: number;
  price: number;
  rsi: number;
  volumeRatio: number;
  conflictTrend?: boolean;
  earningsWarning?: boolean;
  riskReward: number;
}

interface RegimeData {
  status: string;
  spyPrice: number;
  sma200: number;
  ratio: number;
  spyRsi: number;
  vix: number;
  regimeScore: number;
}

// Safely convert a possibly-null/undefined value to a fixed-decimal string.
function toFixed(value: unknown, decimals: number): string {
  const n = Number(value);
  return isFinite(n) ? n.toFixed(decimals) : "—";
}

function generateBrief(regime: RegimeData, stocks: Stock[]): string {
  const top5 = stocks.slice(0, 5);
  const regimeBias =
    regime.status === "BULLISH"
      ? "Conditions favor LONG setups — lean toward buying pullbacks with tight stops."
      : regime.status === "BEARISH"
      ? "Bearish conditions — reduce LONG exposure, size down, and prefer SHORT setups or cash."
      : "Mixed regime — require above-average conviction before committing; tighten stop distances.";

  const regimeSentence =
    `Market is ${regime.status} (${toFixed(regime.regimeScore, 0)}/6 conditions). ` +
    `SPY $${toFixed(regime.spyPrice, 2)} vs SMA200 $${toFixed(regime.sma200, 2)} ` +
    `(${toFixed(Number(regime.ratio) * 100, 1)}% spread), RSI ${toFixed(regime.spyRsi, 1)}, VIX ${toFixed(regime.vix, 1)}. ` +
    regimeBias;

  const standouts = top5.slice(0, 3);
  const setupSentence =
    standouts.length > 0
      ? `Top setups: ${standouts.map((s) => {
          const score = s.tradeType === "SHORT" ? (s.bearScore ?? 0) : (s.bullScore ?? 0);
          return `${s.ticker} (${s.tradeType}, ${score}/8 signals, $${toFixed(s.price, 2)}, RSI ${toFixed(s.rsi, 0)}, R:R ${toFixed(s.riskReward, 1)}:1)`;
        }).join(", ")}. ${
          (Number(standouts[0].volumeRatio) || 0) >= 1.5
            ? `${standouts[0].ticker} shows above-average volume — institutional interest present.`
            : `Volume is running near average — confirm entry with price action.`
        }`
      : "No high-conviction setups identified in the current scan.";

  const earningsCount = stocks.filter((s) => s.earningsWarning).length;
  const conflictCount = stocks.filter((s) => s.conflictTrend).length;
  const riskSentence =
    earningsCount > 0 && conflictCount > 0
      ? `Risk: ${earningsCount} ticker${earningsCount !== 1 ? "s" : ""} with imminent earnings and ${conflictCount} trend conflict${conflictCount !== 1 ? "s" : ""} — avoid new entries on flagged names.`
      : earningsCount > 0
      ? `Risk: ${earningsCount} ticker${earningsCount !== 1 ? "s" : ""} have earnings within 14 days — size down or wait for post-earnings confirmation.`
      : conflictCount > 0
      ? `Risk: ${conflictCount} ticker${conflictCount !== 1 ? "s" : ""} show conflicting trend signals — wait for resolution before committing.`
      : "No earnings events or trend conflicts flagged this session.";

  const longCount = stocks.filter((s) => s.tradeType === "LONG").length;
  const shortCount = stocks.filter((s) => s.tradeType === "SHORT").length;
  const biasSentence =
    `Universe breakdown: ${longCount} LONG, ${shortCount} SHORT across ${stocks.length} names. ` +
    (regime.status === "BULLISH"
      ? "Favor 1–2% risk per trade; use limit orders on pullbacks to key levels."
      : regime.status === "BEARISH"
      ? "Reduce position sizes by 30–50%; prioritise SHORT setups or stay in cash."
      : "Use half-normal size until regime clarifies; scale in only on confirmed breakouts.");

  return [regimeSentence, setupSentence, riskSentence, biasSentence].join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth guard — require an authenticated user session (not just anon key)
  const authToken = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  if (!supabaseUrl) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { "Authorization": `Bearer ${authToken}`, "apikey": supabaseAnonKey },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Request size guard (512 KB)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 524288) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { regime, stocks } = await req.json();

    if (!regime || !stocks) {
      return new Response(JSON.stringify({ error: "regime and stocks are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const briefing = generateBrief(regime as RegimeData, stocks as Stock[]);

    return new Response(
      JSON.stringify({
        briefing,
        model: "swingpulse-built-in",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-brief error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
