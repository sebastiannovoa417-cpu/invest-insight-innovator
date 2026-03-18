import { RefreshCw, User, Briefcase, LogOut } from "lucide-react";
import { RegimeData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SyncBarProps {
  regime: RegimeData;
  runId: string;
  onRefresh?: () => void;
  onAuthClick?: () => void;
  onPositionsClick?: () => void;
}

export function SyncBar({ regime, runId, onRefresh, onAuthClick, onPositionsClick }: SyncBarProps) {
  const { user, signOut } = useAuth();
  const regimeColor = regime.status === "BULLISH" ? "bg-long text-long-foreground regime-glow-bullish" 
    : regime.status === "BEARISH" ? "bg-short text-short-foreground regime-glow-bearish" 
    : "bg-muted text-muted-foreground";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-2.5 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-[0.3em] text-foreground">SWINGPULSE</h1>
          <span className={cn("px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider", regimeColor)}>
            {regime.status}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{regime.regimeScore} / 6</span>
        </div>

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
            <span className={cn(regime.vix > 25 ? "text-short" : "text-foreground")}>{regime.vix.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={onPositionsClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
            >
              <Briefcase className="w-3 h-3" />
              <span className="hidden sm:inline">POSITIONS</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors border border-border"
              title={user.email}
            >
              <LogOut className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-primary hover:text-primary/80 transition-colors border border-primary/50"
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">SIGN IN</span>
            </button>
          )}
          <span className="text-[10px] text-muted-foreground font-mono">RUN {runId}</span>
        </div>
      </div>
    </header>
  );
}
