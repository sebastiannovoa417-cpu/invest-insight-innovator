interface DualScoreBarProps {
  bullScore: number;
  bearScore: number;
  maxScore?: number;
}

export function DualScoreBar({ bullScore, bearScore, maxScore = 8 }: DualScoreBarProps) {
  const bullWidth = (bullScore / maxScore) * 100;
  const bearWidth = (bearScore / maxScore) * 100;

  return (
    <div className="flex items-center gap-1.5 min-w-[100px]">
      <span className="text-[10px] font-mono text-long w-4 text-right">▲{bullScore}</span>
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-[3px] rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-long score-bar-fill"
            style={{ width: `${bullWidth}%` }}
          />
        </div>
        <div className="h-[3px] rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-short score-bar-fill"
            style={{ width: `${bearWidth}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] font-mono text-short w-4">▼{bearScore}</span>
    </div>
  );
}
