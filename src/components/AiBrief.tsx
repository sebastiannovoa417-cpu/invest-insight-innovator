import { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Stock, RegimeData } from "@/lib/types";

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

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-brief", {
        body: { regime, stocks },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      setBriefing(data.briefing ?? "");
      setTimestamp(data.timestamp ?? "");
      setModel(data.model ?? "");
    } catch (e: any) {
      setError(e.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const paragraphs = briefing
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "6px",
        padding: "16px 20px",
        marginBottom: "16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: briefing || loading || error ? "14px" : "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "hsl(var(--primary))",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            AI MARKET BRIEFING
          </span>
          {model && (
            <span
              style={{
                fontSize: "10px",
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              // {model.replace("claude-", "").replace("-20240307", "")}
            </span>
          )}
        </div>

        <button
          onClick={generate}
          disabled={loading || stocks.length === 0}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "5px 12px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            fontFamily: "var(--font-mono, monospace)",
            background: loading ? "transparent" : "hsl(var(--primary))",
            color: loading ? "hsl(var(--muted-foreground))" : "hsl(var(--primary-foreground))",
            border: loading ? "1px solid hsl(var(--border))" : "none",
            borderRadius: "4px",
            cursor: loading || stocks.length === 0 ? "not-allowed" : "pointer",
            opacity: stocks.length === 0 ? 0.4 : 1,
            transition: "opacity 0.15s",
          }}
        >
          <RefreshCw size={11} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          {loading ? "ANALYZING..." : briefing ? "REFRESH" : "GENERATE"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            padding: "10px 12px",
            background: "hsla(var(--short) / 0.1)",
            border: "1px solid hsla(var(--short) / 0.3)",
            borderRadius: "4px",
            fontSize: "12px",
            color: "hsl(var(--short))",
          }}
        >
          <AlertTriangle size={13} style={{ marginTop: "1px", flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[90, 75, 85, 60].map((w, i) => (
            <div
              key={i}
              style={{
                height: "12px",
                width: `${w}%`,
                background: "hsl(var(--muted))",
                borderRadius: "3px",
                animation: "pulse 1.5s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Briefing text */}
      {!loading && briefing && (
        <div>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                margin: "0 0 10px 0",
                fontSize: "13px",
                lineHeight: "1.65",
                color: "hsl(var(--foreground))",
              }}
            >
              {para}
            </p>
          ))}
          {timestamp && (
            <p
              style={{
                margin: "12px 0 0 0",
                fontSize: "10px",
                color: "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Generated {new Date(timestamp).toLocaleTimeString()} · {stocks.length} tickers analyzed
            </p>
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && !briefing && !error && (
        <p
          style={{
            fontSize: "12px",
            color: "hsl(var(--muted-foreground))",
            margin: 0,
            fontStyle: "italic",
          }}
        >
          Click Generate to get an AI-powered market briefing based on live data.
        </p>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
