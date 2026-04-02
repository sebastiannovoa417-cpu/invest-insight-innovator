import { RefreshCw, User, Briefcase, LogOut } from "lucide-react";
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

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
  const isStale = !ranAt || (Date.now() - new Date(ranAt).getTime()) > SIX_HOURS_MS;

  const regimeBg = regime.status === "BULLISH"
    ? { backgroundColor: "#008000", color: "#ffffff" }
    : regime.status === "BEARISH"
    ? { backgroundColor: "#cc0000", color: "#ffffff" }
    : { backgroundColor: "#808080", color: "#ffffff" };

  return (
    <header className="sticky top-0 z-40" style={{ fontFamily: "Tahoma, MS Sans Serif, Arial, sans-serif" }}>
      {/* Window title bar */}
      <div className="win-titlebar px-2 py-1">
        <div className="flex items-center gap-2">
          {/* Win2K app icon placeholder */}
          <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0">
            <rect x="1" y="1" width="6" height="6" fill="#ff0000"/>
            <rect x="9" y="1" width="6" height="6" fill="#00aa00"/>
            <rect x="1" y="9" width="6" height="6" fill="#0000cc"/>
            <rect x="9" y="9" width="6" height="6" fill="#ffaa00"/>
          </svg>
          <span style={{ fontSize: "12px", fontWeight: "bold" }}>SwingPulse — Market Regime Analyzer</span>
        </div>
        {/* Classic win-buttons: minimize, maximize, close */}
        <div className="flex items-center gap-1">
          <button
            className="win-btn"
            style={{ minWidth: "18px", width: "18px", height: "18px", padding: "0", fontSize: "10px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Minimize"
          >_</button>
          <button
            className="win-btn"
            style={{ minWidth: "18px", width: "18px", height: "18px", padding: "0", fontSize: "10px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center" }}
            aria-label="Maximize"
          >□</button>
          <button
            className="win-btn"
            style={{ minWidth: "18px", width: "18px", height: "18px", padding: "0", fontSize: "11px", fontWeight: "bold", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#d4d0c8" }}
            aria-label="Close"
          >✕</button>
        </div>
      </div>

      {/* Classic menu bar */}
      <div style={{ backgroundColor: "#d4d0c8", borderBottom: "1px solid #808080", display: "flex", alignItems: "center", gap: 0, padding: "1px 2px" }}>
        {["File", "Edit", "View", "Tools", "Help"].map(m => (
          <button
            key={m}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "11px",
              padding: "2px 6px",
              cursor: "pointer",
              color: "#000000",
              fontFamily: "Tahoma, sans-serif",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.backgroundColor = "#0a246a"; (e.target as HTMLElement).style.color = "#ffffff"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.backgroundColor = "transparent"; (e.target as HTMLElement).style.color = "#000000"; }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="win-toolbar" style={{ backgroundColor: "#d4d0c8" }}>
        {/* Regime pill */}
        <span
          style={{
            ...regimeBg,
            padding: "1px 8px",
            fontSize: "11px",
            fontWeight: "bold",
            border: "1px solid #000",
          }}
        >
          {regime.status}
        </span>
        <span style={{ fontSize: "11px", color: "#000" }}>{regime.regimeScore}/6</span>

        <div className="win-separator" />

        {/* Market data */}
        <div className="hidden md:flex items-center gap-3" style={{ fontSize: "11px" }}>
          <span><b>SPY:</b> ${regime.spyPrice.toFixed(2)}</span>
          <span><b>SMA200:</b> ${regime.sma200.toFixed(2)}</span>
          <span><b>RSI:</b> <span style={{ color: regime.spyRsi < 40 ? "#cc0000" : regime.spyRsi > 60 ? "#008000" : "#000" }}>{regime.spyRsi}</span></span>
          <span><b>VIX:</b> <span style={{ color: regime.vix > 25 ? "#cc0000" : "#000" }}>{regime.vix.toFixed(1)}</span></span>
        </div>

        <div className="win-separator hidden md:block" />

        {/* Action buttons */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
          {user && (
            <button className="win-btn" onClick={onPositionsClick} style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "auto" }}>
              <Briefcase className="w-3 h-3" />
              <span className="hidden sm:inline" style={{ fontSize: "11px" }}>Positions</span>
            </button>
          )}
          <button className="win-btn" onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "auto" }}>
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline" style={{ fontSize: "11px" }}>Refresh</span>
          </button>
          {user ? (
            <button className="win-btn" onClick={() => signOut()} title={user.email} style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "auto" }}>
              <LogOut className="w-3 h-3" />
            </button>
          ) : (
            <button className="win-btn" onClick={onAuthClick} style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "auto" }}>
              <User className="w-3 h-3" />
              <span className="hidden sm:inline" style={{ fontSize: "11px" }}>Sign In</span>
            </button>
          )}
          <span style={{ fontSize: "10px", color: "#444", fontFamily: "Courier New", marginLeft: "4px" }}>RUN {runId}</span>
        </div>
      </div>

      {/* Stale data warning — classic dialog-style */}
      {isStale && (
        <div style={{ backgroundColor: "#ffffe1", border: "1px solid #808080", borderTop: "none", padding: "3px 8px", fontSize: "11px", color: "#000", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "14px" }}>⚠</span>
          <span>
            Market data is stale — last updated{" "}
            {ranAt ? new Date(ranAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}.
            {" "}Re-enable the pipeline in GitHub Actions or trigger a manual run.
          </span>
        </div>
      )}
    </header>
  );
}
