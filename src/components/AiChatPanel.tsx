import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock, RegimeData } from "@/lib/types";
import { useAiChat } from "@/hooks/use-ai-analysis";

interface AiChatPanelProps {
  stocks: Stock[];
  regime: RegimeData;
}

const SUGGESTED_QUESTIONS = [
  "Which stocks have the strongest setups right now?",
  "Is the regime favorable for LONG trades?",
  "What are the top SHORT candidates?",
  "Which setups have the best R:R?",
  "Any earnings risks I should avoid?",
];

export function AiChatPanel({ stocks, regime }: AiChatPanelProps) {
  const { messages, loading, error, send, clear } = useAiChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    send(q, stocks, regime);
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
            claude-3-5-sonnet
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clear}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-5 py-8">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Ask about your trading universe</p>
              <p className="text-xs text-muted-foreground">
                {stocks.length} tickers loaded · Regime: {regime.status}
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => { send(q, stocks, regime); }}
                  className="w-full text-left px-3 py-2 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
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
