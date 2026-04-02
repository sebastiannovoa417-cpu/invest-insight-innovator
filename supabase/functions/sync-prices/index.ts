// @ts-nocheck — active Edge Function. VS Code tsconfig does not understand Deno URL imports; suppress all false positives.
// sync-prices — bulk upserts daily OHLCV price history for backtesting.
// Called by the Python pipeline after scoring; uses INSERT ... ON CONFLICT DO NOTHING
// so re-running the pipeline never creates duplicate rows.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Expected payload shape from Python pipeline:
// {
//   prices: [
//     { ticker: "NVDA", date: "2026-03-21", open: 120.0, high: 123.5, low: 119.0, close: 122.3, volume: 45000000 },
//     ...
//   ]
// }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key — must be set as SYNC_API_KEY secret in Supabase Dashboard
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("SYNC_API_KEY");

    if (!expectedKey) {
      console.error("SYNC_API_KEY environment variable is not set");
      return new Response(JSON.stringify({ error: "Server misconfiguration: SYNC_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!apiKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { prices } = await req.json();

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return new Response(JSON.stringify({ error: "prices array is required and must be non-empty" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch insert in chunks of 500 rows to stay within Supabase limits.
    // ON CONFLICT (ticker, date) DO NOTHING means safe to re-run any time.
    const CHUNK = 500;
    let inserted = 0;

    for (let i = 0; i < prices.length; i += CHUNK) {
      const chunk = prices.slice(i, i + CHUNK).map((row) => ({
        ticker: row.ticker,
        date: row.date,
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume ?? null,
      }));

      const { error } = await supabase
        .from("price_history")
        .upsert(chunk, { onConflict: "ticker,date", ignoreDuplicates: true });

      if (error) {
        console.error("price_history upsert error:", error);
        throw new Error(error.message);
      }
      inserted += chunk.length;
    }

    return new Response(
      JSON.stringify({ success: true, rows_processed: inserted }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("sync-prices error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
