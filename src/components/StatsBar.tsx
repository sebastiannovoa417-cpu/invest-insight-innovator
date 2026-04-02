import { Stock, RegimeData } from "@/lib/types";

interface StatsBarProps {
  stocks: Stock[];
  regime: RegimeData;
}

export function StatsBar({ stocks, regime }: StatsBarProps) {
  const longSetups = stocks.filter(s => s.tradeType === "LONG").length;
  const shortSetups = stocks.filter(s => s.tradeType === "SHORT").length;
  const score6Plus = stocks.filter(s => {
    const dir = s.tradeType === "SHORT" ? s.bearScore : s.bullScore;
    return dir >= 6;
  }).length;
  const avgDirScore = stocks.length > 0
    ? (stocks.reduce((sum, s) => sum + (s.tradeType === "SHORT" ? s.bearScore : s.bullScore), 0) / stocks.length).toFixed(1)
    : "0";
  const conflicts = stocks.filter(s => s.conflictTrend).length;
  const earningsRisk = stocks.filter(s => s.earningsWarning).length;

  const stats = [
    { label: "LONG SETUPS", value: longSetups, color: "#008000" },
    { label: "SHORT SETUPS", value: shortSetups, color: "#cc0000" },
    { label: "SCORE 6+", value: score6Plus, color: "#0050cc" },
    { label: "AVG DIR SCORE", value: avgDirScore, color: "#000" },
    { label: "⚡ CONFLICTS", value: conflicts, color: "#666" },
    { label: "SPY / SMA200", value: regime.ratio.toFixed(3), color: regime.ratio > 1 ? "#008000" : "#cc0000" },
    { label: "⚠ EARNINGS", value: earningsRisk, color: earningsRisk > 0 ? "#cc8800" : "#666" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "4px",
        marginTop: "4px",
        fontFamily: "Tahoma, MS Sans Serif, sans-serif",
      }}
      className="md:[grid-template-columns:repeat(7,1fr)]"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="win-panel"
          style={{ padding: "4px 6px", textAlign: "center" }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "Courier New",
              color: stat.color,
              lineHeight: 1.2,
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: "#444",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginTop: "2px",
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
