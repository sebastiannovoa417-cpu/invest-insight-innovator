import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Stock, RegimeData } from "@/lib/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

async function streamEdgeFunction(
  body: Record<string, unknown>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-analysis`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token ?? ANON_KEY}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => `HTTP ${response.status}`);
    throw new Error(errText);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as { text?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) onChunk(parsed.text);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

// ── Trade Analysis ────────────────────────────────────────────────────────────

export function useAiTradeAnalysis() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (stock: Stock, regime?: RegimeData) => {
    setText("");
    setLoading(true);
    setError(null);

    try {
      await streamEdgeFunction(
        { type: "trade", stock, regime },
        (chunk) => setText((prev) => prev + chunk),
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { text, loading, error, analyze, reset };
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (question: string, stocks: Stock[], regime?: RegimeData) => {
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    setError(null);

    // Add streaming placeholder
    setMessages((prev) => [...prev, { role: "assistant", text: "" }]);

    try {
      await streamEdgeFunction(
        { type: "chat", question, stocks, regime },
        (chunk) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.role === "assistant") {
              updated[updated.length - 1] = { role: "assistant", text: last.text + chunk };
            }
            return updated;
          });
        },
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "Chat failed");
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}
