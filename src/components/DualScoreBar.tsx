interface DualScoreBarProps {
  bullScore: number;
  bearScore: number;
  maxScore?: number;
}

export function DualScoreBar({ bullScore, bearScore, maxScore = 8 }: DualScoreBarProps) {
  const bullWidth = (bullScore / maxScore) * 100;
  const bearWidth = (bearScore / maxScore) * 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: "100px" }}>
      <span style={{ fontSize: "9px", fontFamily: "Courier New", color: "#008000", width: "20px", textAlign: "right" }}>
        ▲{bullScore}
      </span>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Bull bar */}
        <div
          className="win-progress-track"
          style={{ height: "6px" }}
        >
          <div
            className="win-progress-fill-long score-bar-fill"
            style={{ width: `${bullWidth}%`, height: "100%" }}
          />
        </div>
        {/* Bear bar */}
        <div
          className="win-progress-track"
          style={{ height: "6px" }}
        >
          <div
            className="win-progress-fill-short score-bar-fill"
            style={{ width: `${bearWidth}%`, height: "100%" }}
          />
        </div>
      </div>
      <span style={{ fontSize: "9px", fontFamily: "Courier New", color: "#cc0000", width: "20px" }}>
        ▼{bearScore}
      </span>
    </div>
  );
}
