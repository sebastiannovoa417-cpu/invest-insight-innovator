import { useState, useCallback } from "react";
import type { Stock, RegimeData } from "@/lib/types";
import { generateTradeBrief, answerQuestion } from "@/lib/ai-engine";

// Emits the response in small word-batches to simulate a streaming effect.
function simulateStream(
  text: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
): void {
  const words = text.split(" ");
  const BATCH = 4;
  const DELAY_MS = 28;
  let i = 0;

  function tick() {
    const slice = words.slice(i, i + BATCH);
    const chunk = slice.join(" ") + (i + BATCH < words.length ? " " : "");
    onChunk(chunk);
    i += BATCH;
    if (i < words.length) {
      setTimeout(tick, DELAY_MS);
    } else {
      onDone();
    }
  }

  setTimeout(tick, 0);
}

// ── Trade Analysis ────────────────────────────────────────────────────────────

export function useAiTradeAnalysis() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback((stock: Stock, regime?: RegimeData) => {
    setText("");
    setLoading(true);
    setError(null);

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
}

export interface ChatCompletePayload {
  assistantMessageId: string;
  question: string;
  answer: string;
}

function createMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback((
    question: string,
    stocks: Stock[],
    regime?: RegimeData,
    options?: { onComplete?: (payload: ChatCompletePayload) => void },
  ) => {
    const userMessageId = createMessageId();
    const assistantMessageId = createMessageId();

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
      { id: assistantMessageId, role: "assistant", text: "" },
    ]);
    setLoading(true);
    setError(null);

    const regimeData = regime ?? {
      status: "NEUTRAL" as const,
      spyPrice: 0,
      sma200: 0,
      sma50: 0,
      spyRsi: 50,
      vix: 20,
      ratio: 1,
      regimeScore: 0,
    };

    const answer = answerQuestion(question, stocks, regimeData);

    simulateStream(
      answer,
      (chunk) => {
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id !== assistantMessageId || msg.role !== "assistant") {
              return msg;
            }
            return { ...msg, text: msg.text + chunk };
          });
        });
      },
      () => {
        setLoading(false);
        options?.onComplete?.({ assistantMessageId, question, answer });
      },
    );
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}
