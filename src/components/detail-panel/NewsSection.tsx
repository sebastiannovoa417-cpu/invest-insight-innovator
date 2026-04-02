import { useState } from "react";
import { TrendingUp, TrendingDown, Minus as NeutralIcon, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

const VISIBLE_NEWS = 3;

function isSafeUrl(url: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

function sentimentIcon(sentiment?: string) {
  if (sentiment === "bullish") return <TrendingUp className="w-3 h-3 text-long flex-shrink-0" />;
  if (sentiment === "bearish") return <TrendingDown className="w-3 h-3 text-short flex-shrink-0" />;
  return <NeutralIcon className="w-3 h-3 text-muted-foreground flex-shrink-0" />;
}

function sentimentBadge(sentiment?: string): string {
  if (sentiment === "bullish") return "bg-long/10 text-long";
  if (sentiment === "bearish") return "bg-short/10 text-short";
  return "bg-border/40 text-muted-foreground";
}

function NewsCard({ n, index }: { n: NewsItem; index: number }) {
  return (
    <div
      key={index}
      className={cn(
        "rounded-md border border-border/60 p-3 space-y-1.5",
        n.sentiment === "bullish" ? "border-long/20" : n.sentiment === "bearish" ? "border-short/20" : ""
      )}
    >
      <div className="flex items-start gap-1.5">
        {sentimentIcon(n.sentiment)}
        {n.url && isSafeUrl(n.url) ? (
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-foreground leading-snug hover:text-primary transition-colors flex items-start gap-1 group"
          >
            {n.title}
            <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
        ) : (
          <span className="text-xs font-medium text-foreground leading-snug">{n.title}</span>
        )}
      </div>
      {n.summary && (
        <p className="text-[11px] text-muted-foreground leading-relaxed pl-4">{n.summary}</p>
      )}
      <div className="flex items-center gap-2 pl-4">
        {n.source && <span className="text-[10px] font-medium text-primary/70">{n.source}</span>}
        <span className="text-[10px] text-muted-foreground">— {n.date}</span>
        {n.sentiment && (
          <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", sentimentBadge(n.sentiment))}>
            {n.sentiment}
          </span>
        )}
      </div>
    </div>
  );
}

interface NewsSectionProps {
  news: NewsItem[];
}

export function NewsSection({ news }: NewsSectionProps) {
  const [showMore, setShowMore] = useState(false);

  if (news.length === 0) return null;

  const visible = news.slice(0, VISIBLE_NEWS);
  const hidden = news.slice(VISIBLE_NEWS);

  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">
        RECENT NEWS <span className="font-normal normal-case text-muted-foreground/60">({news.length} articles)</span>
      </h3>
      <div className="space-y-3">
        {visible.map((n, i) => <NewsCard key={i} n={n} index={i} />)}

        {hidden.length > 0 && (
          <>
            {showMore && hidden.map((n, i) => <NewsCard key={`h-${i}`} n={n} index={i} />)}
            <button
              onClick={() => setShowMore(p => !p)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-primary/80 hover:text-primary transition-colors w-full justify-center py-1.5 rounded-md border border-dashed border-border hover:border-primary/40"
            >
              {showMore ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Show {hidden.length} more article{hidden.length !== 1 ? "s" : ""}</>
              )}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
