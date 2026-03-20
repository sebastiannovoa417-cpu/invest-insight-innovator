import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key from header
    const apiKey = req.headers.get("x-api-key");
    const expectedKey = Deno.env.get("SYNC_API_KEY");

    if (!expectedKey || apiKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const { regime, stocks, run_id, universe } = payload;

    // 1. Upsert regime (singleton row — never delete/re-insert to avoid race conditions)
    if (regime) {
      const REGIME_ID = "00000000-0000-0000-0000-000000000001";
      await supabase.from("regime").upsert({
        id: REGIME_ID,
        status: regime.status,
        spy_price: regime.spy_price,
        sma_200: regime.sma_200,
        sma_50: regime.sma_50,
        spy_rsi: regime.spy_rsi,
        vix: regime.vix,
        ratio: regime.ratio,
        regime_score: regime.regime_score,
      }, { onConflict: "id" });
    }

    // 2. Upsert stocks
    if (stocks && Array.isArray(stocks)) {
      for (const stock of stocks) {
        await supabase.from("stocks").upsert(
          {
            ticker: stock.ticker,
            trade_type: stock.trade_type,
            bull_score: stock.bull_score,
            bear_score: stock.bear_score,
            price: stock.price,
            rsi: stock.rsi,
            volume_ratio: stock.volume_ratio,
            volume_spike: stock.volume_spike,
            signals: stock.signals,
            entry_atr: stock.entry_atr,
            entry_structure: stock.entry_structure,
            best_entry: stock.best_entry,
            stop_loss: stock.stop_loss,
            target: stock.target,
            risk_reward: stock.risk_reward,
            atr: stock.atr,
            distance_52w: stock.distance_52w,
            name: stock.name ?? stock.ticker,
            conflict_trend: stock.conflict_trend,
            news: stock.news || [],
            earnings_date: stock.earnings_date,
            earnings_warning: stock.earnings_warning || false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ticker" }
        );

        // 3. Save score history
        if (run_id) {
          await supabase.from("score_history").insert({
            ticker: stock.ticker,
            run_id,
            bull_score: stock.bull_score,
            bear_score: stock.bear_score,
          });
        }
      }
    }

    // 4. Log the script run
    if (run_id) {
      await supabase.from("script_runs").insert({
        run_id,
        stock_count: stocks?.length || 0,
        regime: regime?.status,
        universe: universe || "SwingPulse 25 — v1.0",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        stocks_synced: stocks?.length || 0,
        run_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
