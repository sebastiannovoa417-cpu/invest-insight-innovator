import { RefreshCw } from "lucide-react";
import { RegimeData } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface SyncBarProps {
  regime: RegimeData;
  runId: string;
  onRefresh?: () => void;
}

export function SyncBar({ regime, runId, onRefresh }: SyncBarProps) {
  const regimeColor = regime.status === "BULLISH" ? "bg-long text-long-foreground regime-glow-bullish" 
    : regime.status === "BEARISH" ? "bg-short text-short-foreground regime-glow-bearish" 
    : "bg-muted text-muted-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        {/* Logo + Regime */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-[0.3em] text-foreground">
            SWINGPULSE
          </h1>
          <span className={cn("px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider", regimeColor)}>
            {regime.status}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {regime.regimeScore} / 6
          </span>
        </div>

        {/* Market Data */}
        <div className="hidden md:flex items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">SPY</span>
            <span className="text-foreground">${regime.spyPrice.toFixed(2)}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">SMA200</span>
            <span className="text-foreground">${regime.sma200.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">RSI</span>
            <span className={cn(regime.spyRsi < 40 ? "text-short" : regime.spyRsi > 60 ? "text-long" : "text-foreground")}>
              {regime.spyRsi}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">VIX</span>
            <span className={cn(regime.vix > 25 ? "text-short" : "text-foreground")}>
              {regime.vix.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Refresh + Run ID */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">
            RUN {runId}
          </span>
        </div>
      </div>
    </header>
  );
}
