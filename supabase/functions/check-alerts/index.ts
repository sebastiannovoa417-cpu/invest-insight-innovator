// @ts-nocheck — active Edge Function. VS Code tsconfig does not understand Deno URL imports; suppress all false positives.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface StockScore {
    ticker: string;
    bull_score: number;
    bear_score: number;
    rsi: number;
    price: number;
}

interface AlertRow {
    id: string;
    user_id: string;
    ticker: string;
    condition: string;
    threshold: number;
}

function evaluate(alert: AlertRow, stock: StockScore): boolean {
    const t = Number(alert.threshold);
    switch (alert.condition) {
        case "bull_score_gte": return stock.bull_score >= t;
        case "bear_score_gte": return stock.bear_score >= t;
        case "rsi_above": return stock.rsi >= t;
        case "rsi_below": return stock.rsi <= t;
        case "price_above": return stock.price >= t;
        case "price_below": return stock.price <= t;
        default: return false;
    }
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // ── Auth: same SYNC_API_KEY used by sync-ingest and sync-prices ──────────
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

        const body = await req.json();
        const stocks: StockScore[] = body?.stocks ?? [];

        if (!Array.isArray(stocks) || stocks.length === 0) {
            return new Response(JSON.stringify({ error: "Missing or empty stocks array in payload" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Build O(1) lookup: ticker → scored metrics
        const scoreMap = new Map<string, StockScore>(stocks.map((s) => [s.ticker, s]));

        // Fetch all active alerts (service role bypasses RLS — reads all users' alerts)
        const { data: activeAlerts, error: fetchErr } = await supabase
            .from("alerts")
            .select("id, user_id, ticker, condition, threshold")
            .eq("status", "active");

        if (fetchErr) throw fetchErr;

        if (!activeAlerts || activeAlerts.length === 0) {
            return new Response(JSON.stringify({ checked: 0, triggered: 0 }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Evaluate each alert against current scores
        const triggeredIds: string[] = [];
        const now = new Date().toISOString();

        for (const alert of activeAlerts) {
            const stock = scoreMap.get(alert.ticker);
            if (!stock) continue;
            if (evaluate(alert as AlertRow, stock)) {
                triggeredIds.push(alert.id);
            }
        }

        // Bulk update triggered alerts in a single round-trip
        if (triggeredIds.length > 0) {
            const { error: updateErr } = await supabase
                .from("alerts")
                .update({ status: "triggered", triggered_at: now })
                .in("id", triggeredIds);

            if (updateErr) throw updateErr;
        }

        console.log(`check-alerts: checked=${activeAlerts.length} triggered=${triggeredIds.length}`);

        return new Response(
            JSON.stringify({ checked: activeAlerts.length, triggered: triggeredIds.length }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    } catch (error) {
        console.error("check-alerts error:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }
});
