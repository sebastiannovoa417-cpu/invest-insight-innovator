import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, Loader2, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock, RegimeData } from "@/lib/types";
import { useAiChat } from "@/hooks/use-ai-analysis";
import { useAiLearning } from "@/hooks/use-data";

interface AiChatPanelProps {
  stocks: Stock[];
  regime: RegimeData;
}

interface QuestionSection {
  id: string;
  label: string;
  questions: string[];
}

function buildQuestionSections(stocks: Stock[], regime: RegimeData): QuestionSection[] {
  const topStocks = [...stocks]
    .sort((a, b) => {
      const sA = a.tradeType === "LONG" ? a.bullScore : a.bearScore;
      const sB = b.tradeType === "LONG" ? b.bullScore : b.bearScore;
      return sB - sA;
    })
    .slice(0, 4);

  const stockQuestions: string[] = topStocks.length > 0
    ? ([
      `Tell me about ${topStocks[0].ticker}`,
      topStocks.length > 1 ? `Why is ${topStocks[1].ticker} rated ${topStocks[1].tradeType}?` : null,
      topStocks.length > 2 ? `Show me news for ${topStocks[2].ticker}` : null,
      topStocks.length > 0 ? `Position size for ${topStocks[0].ticker}` : null,
      topStocks.length > 1 ? `Compare ${topStocks[0].ticker} vs ${topStocks[1].ticker}` : null,
      topStocks.length > 1 ? `What signals are failing for ${topStocks[1].ticker}?` : null,
    ].filter(Boolean) as string[])
    : ["Which stocks have the strongest setups right now?"];

  return [
    {
      id: "market",
      label: "📊 Market Overview",
      questions: [
        `How is the market today? (${regime.status})`,
        "What is VIX telling us right now?",
        "Is SPY above or below its 200-day SMA?",
        "What does today's regime mean for my trades?",
      ],
    },
    {
      id: "setups",
      label: "🎯 Top Setups",
      questions: [
        "Which stocks have the strongest setups right now?",
        "List all LONG candidates with scores",
        "What are the top SHORT candidates?",
        "Which setups have the best R:R ratio?",
        "Any earnings risks I should avoid?",
      ],
    },
    {
      id: "stocks",
      label: "📈 Individual Stocks",
      questions: stockQuestions,
    },
    {
      id: "brokers",
      label: "🏦 Place a Trade",
      questions: [
        "How do I place a trade in Robinhood?",
        "Walk me through a limit order in Fidelity",
        "How do I use stop-limit orders in IBKR?",
        "What order types does Webull support?",
        "How do I set a trailing stop in Moomoo?",
      ],
    },
    {
      id: "learn",
      label: "📚 Learn Swing Trading",
      questions: [
        "Explain swing trading entry and exit discipline",
        "How should I manage risk on each trade?",
        "What is a stop-limit order and when should I use it?",
        "How do volume spikes signal institutional activity?",
        "What is backtesting and why does it matter?",
      ],
    },
  ];
}

export function AiChatPanel({ stocks, regime }: AiChatPanelProps) {
  const { messages, loading, error, send, clear } = useAiChat();
  const { preferences, savePreferences, isSavingPreferences, logChatEvent, submitFeedback } = useAiLearning();
  const [input, setInput] = useState("");
  const [eventIdsByMessage, setEventIdsByMessage] = useState<Record<string, string>>({});
  const [feedbackByMessage, setFeedbackByMessage] = useState<Record<string, "up" | "down">>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const logLearningEvent = async (
    assistantMessageId: string,
    question: string,
    answer: string,
  ) => {
    const eventId = await logChatEvent({
      question,
      answer,
      context: {
        regime: regime.status,
        stockCount: stocks.length,
      },
    });

    if (!eventId) return;
    setEventIdsByMessage((prev) => ({ ...prev, [assistantMessageId]: eventId }));
  };

  const sendWithLearning = (question: string) => {
    void send(question, stocks, regime, {
      onComplete: ({ assistantMessageId, question: q, answer, sources, uncitedWarning }) => {
        void logLearningEvent(assistantMessageId, q, answer);
        if (import.meta.env.DEV) {
          console.debug("[ai-chat] sources", { count: sources.length, uncitedWarning });
        }
      },
    });
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    const eventId = eventIdsByMessage[messageId];
    if (!eventId) return;

    setFeedbackByMessage((prev) => ({ ...prev, [messageId]: helpful ? "up" : "down" }));
    submitFeedback({ eventId, helpful });
  };

  const handleSend = () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    sendWithLearning(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] min-h-[400px] rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Market Analyst</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
            Built-in
          </span>
          <button
            onClick={() =>
              savePreferences({
                allowLearning: !preferences.allowLearning,
                allowChatStorage: preferences.allowLearning ? false : preferences.allowChatStorage,
              })
            }
            disabled={isSavingPreferences}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
              preferences.allowLearning
                ? "border-primary/30 text-primary bg-primary/10"
                : "border-border text-muted-foreground",
            )}
            title="Allow AI to learn from your interactions"
          >
            Learn: {preferences.allowLearning ? "On" : "Off"}
          </button>
          <button
            onClick={() =>
              savePreferences({
                allowLearning: preferences.allowLearning,
                allowChatStorage: !preferences.allowChatStorage,
              })
            }
            disabled={!preferences.allowLearning || isSavingPreferences}
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
              preferences.allowChatStorage
                ? "border-primary/30 text-primary bg-primary/10"
                : "border-border text-muted-foreground",
              !preferences.allowLearning && "opacity-50 cursor-not-allowed",
            )}
            title="Store question/answer text for better personalization"
          >
            Store Chat: {preferences.allowChatStorage ? "On" : "Off"}
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => {
              clear();
              setEventIdsByMessage({});
              setFeedbackByMessage({});
            }}
            aria-label="Clear chat"
            title="Clear chat"
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-4 py-2 w-full">
            <div className="text-center space-y-0.5">
              <p className="text-sm font-medium text-foreground">Ask about your trading universe</p>
              <p className="text-xs text-muted-foreground">
                {stocks.length} tickers loaded · Regime: {regime.status}
                {regime.regimeScore != null ? ` · ${regime.regimeScore}/6 conditions` : ""}
              </p>
            </div>
            {buildQuestionSections(stocks, regime).map((section) => (
              <div key={section.id} className="space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wide">
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendWithLearning(q)}
                      className="w-full text-left px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border text-foreground",
                )}
              >
                {msg.role === "assistant" && msg.text === "" ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing…
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                )}
                {msg.role === "assistant" && msg.text !== "" && loading && i === messages.length - 1 && (
                  <span className="inline-block w-1 h-3.5 bg-primary/70 animate-pulse ml-0.5 align-middle" />
                )}
                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.sources.map((source, idx) => (
                      <a
                        key={`${source.url}-${idx}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] px-1.5 py-0.5 rounded border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                        title={source.url}
                      >
                        Source: {source.label}
                      </a>
                    ))}
                  </div>
                )}
                {msg.role === "assistant" && msg.uncitedWarning && (
                  <div className="mt-2 text-[10px] rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200">
                    No curated source match found for this educational query. Treat as general guidance.
                  </div>
                )}
                {msg.role === "assistant" && msg.text !== "" && preferences.allowLearning && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => handleFeedback(msg.id, true)}
                      disabled={!eventIdsByMessage[msg.id]}
                      className={cn(
                        "p-1 rounded border transition-colors",
                        feedbackByMessage[msg.id] === "up"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                        !eventIdsByMessage[msg.id] && "opacity-50 cursor-not-allowed",
                      )}
                      title="Helpful answer"
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, false)}
                      disabled={!eventIdsByMessage[msg.id]}
                      className={cn(
                        "p-1 rounded border transition-colors",
                        feedbackByMessage[msg.id] === "down"
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground",
                        !eventIdsByMessage[msg.id] && "opacity-50 cursor-not-allowed",
                      )}
                      title="Not helpful"
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="text-xs text-short bg-short/10 border border-short/20 rounded-md px-3 py-2">
            Error: {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about stocks, signals, setups…"
            disabled={loading}
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="h-9 w-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
