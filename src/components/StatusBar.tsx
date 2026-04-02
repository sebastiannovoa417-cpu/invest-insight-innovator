interface StatusBarProps {
  lastRun: string;
  stockCount: number;
  regime: string;
  universe: string;
  connected: boolean;
}

export function StatusBar({ lastRun, stockCount, regime, universe, connected }: StatusBarProps) {
  return (
    <footer className="win-statusbar" style={{ fontFamily: "Tahoma, MS Sans Serif, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div className="win-statusbar-cell" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span className={connected ? "win-led-on" : "win-led-off"} />
          <span>{connected ? "Connected" : "Offline"} — Supabase</span>
        </div>
        <div className="win-statusbar-cell">
          Last run: {lastRun} | {stockCount} stocks | {regime}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <div className="win-statusbar-cell">SwingPulse v2.0</div>
        <div className="win-statusbar-cell">{universe}</div>
      </div>
    </footer>
  );
}
