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
    { label: "LONG SETUPS", value: longSetups, color: "text-long" },
    { label: "SHORT SETUPS", value: shortSetups, color: "text-short" },
    { label: "SCORE 6+", value: score6Plus, color: "text-primary" },
    { label: "AVG DIR SCORE", value: avgDirScore, color: "text-foreground" },
    { label: "⚡ CONFLICTS", value: conflicts, color: "text-muted-foreground" },
    { label: "SPY / SMA200", value: regime.ratio.toFixed(3), color: regime.ratio > 1 ? "text-long" : "text-short" },
    { label: "⚠ EARNINGS", value: earningsRisk, color: earningsRisk > 0 ? "text-amber-400" : "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-lg border border-border bg-card p-3 text-center">
          <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
          <div className="text-[10px] text-muted-foreground tracking-wider mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
