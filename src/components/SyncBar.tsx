import { RefreshCw, User, Briefcase, LogOut, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { RegimeData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface SyncBarProps {
  regime: RegimeData;
  runId: string;
  ranAt?: string | null;
  onRefresh?: () => void;
  onAuthClick?: () => void;
  onPositionsClick?: () => void;
}

export function SyncBar({ regime, runId, ranAt, onRefresh, onAuthClick, onPositionsClick }: SyncBarProps) {
  const { user, signOut } = useAuth();
  const [freshness, setFreshness] = useState<string>("");
  const [freshnessColor, setFreshnessColor] = useState<string>("text-green-400");

  // Update freshness display in real-time
  useEffect(() => {
    const updateFreshness = () => {
      if (!ranAt) {
        setFreshness("never");
        setFreshnessColor("text-red-400");
        return;
      }

      const now = Date.now();
      const lastRunMs = new Date(ranAt).getTime();
      const ageMs = now - lastRunMs;
      const ageMinutes = Math.floor(ageMs / (60 * 1000));
      const ageHours = Math.floor(ageMs / (60 * 60 * 1000));

      if (ageMinutes < 1) {
        setFreshness("just now");
        setFreshnessColor("text-green-400");
      } else if (ageMinutes < 15) {
        setFreshness(`${ageMinutes}m ago`);
        setFreshnessColor("text-green-400");
      } else if (ageMinutes < 30) {
        setFreshness(`${ageMinutes}m ago`);
        setFreshnessColor("text-yellow-400");
      } else if (ageHours < 2) {
        setFreshness(`${ageHours}h ${ageMinutes % 60}m ago`);
        setFreshnessColor("text-orange-400");
      } else {
        setFreshness(`${ageHours}h ago`);
        setFreshnessColor("text-red-400");
      }
    };

    updateFreshness();
    const interval = setInterval(updateFreshness, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [ranAt]);

  const regimeColor = regime.status === "BULLISH" ? "bg-long text-long-foreground regime-glow-bullish"
    : regime.status === "BEARISH" ? "bg-short text-short-foreground regime-glow-bearish"
    : "bg-muted text-muted-foreground";

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const isVeryStale = !ranAt || (Date.now() - new Date(ranAt).getTime()) > SIX_HOURS_MS;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      {isVeryStale && (
        <div className="bg-red-500/15 border-b border-red-500/30 px-4 py-2 text-center text-xs text-red-400 font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            🚨 Market data is severely stale (last updated {ranAt ? new Date(ranAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}).
            {" "}Pipeline may be failing. Check GitHub Actions or{" "}
            <button onClick={onRefresh} className="underline hover:text-red-300 transition-colors">
              refresh now
            </button>
            .
          </span>
        </div>
      )}
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
            <span className="text-muted-foreground">DATA</span>
            <span className={cn("font-semibold", freshnessColor)}>{freshness}</span>
          </div>
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
              aria-label="View positions"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
            >
              <Briefcase className="w-3 h-3" />
              <span className="hidden sm:inline">POSITIONS</span>
            </button>
          )}
          <button
            onClick={onRefresh}
            aria-label="Refresh data"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-primary transition-colors border border-border hover:border-primary/50"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">REFRESH</span>
          </button>
          {user ? (
            <button
              onClick={() => signOut()}
              aria-label={`Sign out (${user.email})`}
              title={user.email}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground transition-colors border border-border"
            >
              <LogOut className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={onAuthClick}
              aria-label="Sign in"
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
