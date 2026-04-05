import { useState, useCallback } from "react";
import type { Stock, RegimeData } from "@/lib/types";
import { generateTradeBrief, answerQuestion } from "@/lib/ai-engine";
import { supabase } from "@/integrations/supabase/client";

interface SourceChip {
  label: string;
  url: string;
}

interface StreamMeta {
  sources?: SourceChip[];
  uncitedWarning?: boolean;
}

interface StreamResult {
  text: string;
  meta: StreamMeta;
}

// Emits the response in small word-batches to simulate a streaming effect.
function simulateStream(
  text: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
): void {
  const words = text.split(" ");
  const batch = 4;
  const delayMs = 28;
  let index = 0;

  function tick() {
    const slice = words.slice(index, index + batch);
    const chunk = slice.join(" ") + (index + batch < words.length ? " " : "");
    onChunk(chunk);
    index += batch;
    if (index < words.length) {
      setTimeout(tick, delayMs);
    } else {
      onDone();
    }
  }

  setTimeout(tick, 0);
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultRegime(regime?: RegimeData): RegimeData {
  return regime ?? {
    status: "NEUTRAL",
    spyPrice: 0,
    sma200: 0,
    sma50: 0,
    spyRsi: 50,
    vix: 20,
    ratio: 1,
    regimeScore: 0,
  };
}

function updateAssistantMessage(
  messages: ChatMessage[],
  assistantMessageId: string,
  updater: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== assistantMessageId || message.role !== "assistant") {
      return message;
    }
    return updater(message);
  });
}

async function streamAiAnalysis(
  body: Record<string, unknown>,
  handlers: {
    onMeta?: (meta: StreamMeta) => void;
    onText: (chunk: string) => void;
  },
): Promise<StreamResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;

  if (!supabaseUrl || !supabaseKey || supabaseKey === "offline-mode-key-not-configured" || !accessToken) {
    throw new Error("AI edge function unavailable");
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/ai-analysis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let meta: StreamMeta = { sources: [], uncitedWarning: false };

  function processEventBlock(block: string) {
    const dataLines = block
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => line.slice(6));

    for (const line of dataLines) {
      if (line === "[DONE]") {
        return;
      }

      const payload = JSON.parse(line) as {
        meta?: StreamMeta;
        text?: string;
        error?: string;
      };

      if (payload.error) {
        throw new Error(payload.error);
      }

      if (payload.meta) {
        meta = {
          sources: payload.meta.sources ?? [],
          uncitedWarning: payload.meta.uncitedWarning ?? false,
        };
        handlers.onMeta?.(meta);
      }

      if (payload.text) {
        fullText += payload.text;
        handlers.onText(payload.text);
      }
    }
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (block.trim()) processEventBlock(block);
    }
  }

  if (buffer.trim()) {
    processEventBlock(buffer);
  }

  return { text: fullText, meta };
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
      await streamAiAnalysis(
        { type: "trade", stock, regime },
        {
          onText: (chunk) => setText((prev) => prev + chunk),
        },
      );
      setLoading(false);
      return;
    } catch (streamError) {
      if (import.meta.env.DEV) {
        console.warn("[useAiTradeAnalysis] falling back to built-in engine", streamError);
      }
    }

    const brief = generateTradeBrief(stock, regime);
    simulateStream(
      brief,
      (chunk) => setText((prev) => prev + chunk),
      () => setLoading(false),
    );
  }, []);

  const reset = useCallback(() => {
    setText("");
    setError(null);
  }, []);

  return { text, loading, error, analyze, reset };
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: SourceChip[];
  uncitedWarning?: boolean;
}

export interface ChatCompletePayload {
  assistantMessageId: string;
  question: string;
  answer: string;
  sources: SourceChip[];
  uncitedWarning: boolean;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async (
    question: string,
    stocks: Stock[],
    regime?: RegimeData,
    options?: {
      onComplete?: (payload: ChatCompletePayload) => void;
    },
  ) => {
    const userMessageId = createMessageId();
    const assistantMessageId = createMessageId();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
      { id: assistantMessageId, role: "assistant", text: "", sources: [], uncitedWarning: false },
    ]);
    setLoading(true);
    setError(null);

    try {
      const result = await streamAiAnalysis(
        { type: "chat", question, stocks, regime },
        {
          onMeta: (meta) => {
            setMessages((prev) => updateAssistantMessage(prev, assistantMessageId, (message) => ({
              ...message,
              sources: meta.sources ?? [],
              uncitedWarning: meta.uncitedWarning ?? false,
            })));
          },
          onText: (chunk) => {
            setMessages((prev) => updateAssistantMessage(prev, assistantMessageId, (message) => ({
              ...message,
              text: message.text + chunk,
            })));
          },
        },
      );

      setLoading(false);
      options?.onComplete?.({
        assistantMessageId,
        question,
        answer: result.text,
        sources: result.meta.sources ?? [],
        uncitedWarning: result.meta.uncitedWarning ?? false,
      });
      return;
    } catch (streamError) {
      if (import.meta.env.DEV) {
        console.warn("[useAiChat] falling back to built-in engine", streamError);
      }
    }

    const answer = answerQuestion(question, stocks, defaultRegime(regime));
    simulateStream(
      answer,
      (chunk) => {
        setMessages((prev) => updateAssistantMessage(prev, assistantMessageId, (message) => ({
          ...message,
          text: message.text + chunk,
        })));
      },
      () => {
        setLoading(false);
        options?.onComplete?.({
          assistantMessageId,
          question,
          answer,
          sources: [],
          uncitedWarning: false,
        });
      },
    );
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}
