import { useState, useCallback } from "react";
import type { Stock, RegimeData } from "@/lib/types";
import { generateTradeBrief, answerQuestion } from "@/lib/ai-engine";
import type { TradingKnowledgeItem } from "@/hooks/use-data";

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
  sources?: Array<{ label: string; url: string }>;
  uncitedWarning?: boolean;
}

export interface ChatCompletePayload {
  assistantMessageId: string;
  question: string;
  answer: string;
  sources: Array<{ label: string; url: string }>;
  uncitedWarning: boolean;
}

function isEducationalQuestion(question: string): boolean {
  return /swing|setup|principle|risk|order|broker|stop|limit|trailing|how do i place|robinhood|fidelity|interactive brokers|ibkr|webull|moomoo/.test(
    question.toLowerCase(),
  );
}

function scoreKnowledgeMatch(question: string, item: TradingKnowledgeItem): number {
  const q = question.toLowerCase();
  let score = 0;

  if (q.includes(item.category.replace("_", " "))) score += 2;
  if (item.broker && q.includes(item.broker.toLowerCase())) score += 4;
  if (item.platform && q.includes(item.platform.toLowerCase())) score += 1;

  for (const tag of item.tags) {
    if (q.includes(tag.toLowerCase())) score += 2;
  }

  const titleWords = item.title.toLowerCase().split(/\s+/);
  for (const word of titleWords) {
    if (word.length >= 4 && q.includes(word)) score += 1;
  }

  return score;
}

function buildKnowledgeAnswer(question: string, matches: TradingKnowledgeItem[]): string | null {
  if (matches.length === 0) return null;

  const top = matches.slice(0, 3);
  const headline = top[0];
  const stepsSource = top.find((m) => m.category === "broker_workflows" || m.category === "order_mechanics") ?? top[0];
  const riskSource = top.find((m) => m.category === "risk_management") ?? top[0];

  const practical = stepsSource.content;
  const riskCaveat = riskSource.content;

  return [
    `Principle: ${headline.title}. ${headline.content}`,
    `How to apply: ${practical}`,
    `Risk caveat: ${riskCaveat}`,
    `Question context: ${question}`,
  ].join("\n\n");
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
    options?: {
      knowledgeItems?: TradingKnowledgeItem[];
      onComplete?: (payload: ChatCompletePayload) => void;
    },
  ) => {
    const userMessageId = createMessageId();
    const assistantMessageId = createMessageId();

    const educational = isEducationalQuestion(question);
    const scored = (options?.knowledgeItems ?? [])
      .map((item) => ({ item, score: scoreKnowledgeMatch(question, item) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((m) => m.item);

    const sources = scored
      .filter((m) => m.sourceLabel && m.sourceUrl)
      .slice(0, 3)
      .map((m) => ({ label: m.sourceLabel as string, url: m.sourceUrl as string }));

    const uncitedWarning = educational && sources.length === 0;

    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: "user", text: question },
      { id: assistantMessageId, role: "assistant", text: "", sources, uncitedWarning },
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

    const knowledgeAnswer = buildKnowledgeAnswer(question, scored);
    const baseAnswer = answerQuestion(question, stocks, regimeData);
    const answer = knowledgeAnswer ?? (uncitedWarning
      ? `${baseAnswer}\n\nWarning: No curated source matched this educational request. Use this as general guidance only.`
      : baseAnswer);

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
        options?.onComplete?.({ assistantMessageId, question, answer, sources, uncitedWarning });
      },
    );
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, clear };
}
