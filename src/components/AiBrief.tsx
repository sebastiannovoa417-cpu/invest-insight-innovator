import { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { generateMarketBriefing } from "@/lib/ai-engine";
import { cn } from "@/lib/utils";
import type { Stock, RegimeData } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

interface AiBriefProps {
  stocks: Stock[];
  regime: RegimeData;
}

export function AiBrief({ stocks, regime }: AiBriefProps) {
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string>("");
  const [model, setModel] = useState<string>("");

  async function generate() {
    if (stocks.length === 0) return;
    setLoading(true);
    setError("");
    setBriefing("");

    // Small delay so the loading state is visible
    await new Promise<void>((r) => setTimeout(r, 350));

    // Try the ai-brief edge function first
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
      if (
        accessToken &&
        supabaseUrl &&
        supabaseKey &&
        supabaseKey !== "offline-mode-key-not-configured"
      ) {
        const res = await fetch(`${supabaseUrl}/functions/v1/ai-brief`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ regime, stocks }),
        });
        if (res.ok) {
          const data = (await res.json()) as { briefing: string; model: string; timestamp: string };
          setBriefing(data.briefing);
          setTimestamp(data.timestamp);
          setModel(data.model);
          setLoading(false);
          return;
        }
      }
    } catch (edgeErr) {
      if (import.meta.env.DEV)
        console.warn("[AiBrief] edge function unavailable, using built-in engine", edgeErr);
    }

    // Fallback: built-in engine
    try {
      setBriefing(generateMarketBriefing(regime, stocks));
      setTimestamp(new Date().toISOString());
      setModel("Built-in");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const paragraphs = briefing
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="rounded-md border border-border bg-card px-5 py-4 mb-4">
      {/* Header */}
      <div className={cn("flex items-center justify-between", (briefing || loading || error) && "mb-3.5")}>
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-primary" />
          <span className="text-[11px] font-bold tracking-[0.08em] text-primary font-mono">
            AI MARKET BRIEFING
          </span>
          {model && (
            <span className="text-[10px] text-muted-foreground font-mono">
              // {model.replace("claude-", "").replace("-20240307", "")}
            </span>
          )}
        </div>

        <button
          onClick={generate}
          disabled={loading || stocks.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-[5px] text-[10px] font-bold tracking-[0.06em] font-mono rounded transition-opacity",
            loading
              ? "border border-border text-muted-foreground bg-transparent"
              : "bg-primary text-primary-foreground",
            (loading || stocks.length === 0) && "cursor-not-allowed",
            stocks.length === 0 && "opacity-40"
          )}
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "ANALYZING..." : briefing ? "REFRESH" : "GENERATE"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded px-3 py-2.5 bg-short/10 border border-short/30 text-short text-xs">
          <AlertTriangle size={13} className="mt-px shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[90, 75, 85, 60].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-muted rounded animate-pulse"
              style={{ width: `${w}%`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      )}

      {/* Briefing text */}
      {!loading && briefing && (
        <div>
          {paragraphs.map((para, i) => (
            <p key={i} className="mb-2.5 text-[13px] leading-relaxed text-foreground last:mb-0">
              {para}
            </p>
          ))}
          {timestamp && (
            <p className="mt-3 text-[10px] font-mono text-muted-foreground">
              Generated {new Date(timestamp).toLocaleTimeString()} · {stocks.length} tickers · {model}
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !briefing && !error && (
        <p className="text-xs text-muted-foreground italic m-0">
          Click Generate to get an AI-powered market briefing based on live data.
        </p>
      )}
    </div>
  );
}
