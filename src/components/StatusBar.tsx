import { cn } from "@/lib/utils";

interface StatusBarProps {
  lastRun: string;
  stockCount: number;
  regime: string;
  universe: string;
  connected: boolean;
}

export function StatusBar({ lastRun, stockCount, regime, universe, connected }: StatusBarProps) {
  return (
    <footer className="border-t border-border bg-background px-4 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-long" : "bg-short")} />
          <span>{connected ? "Live" : "Offline"} · Supabase</span>
        </div>
        <span>Last run: {lastRun} · {stockCount} stocks · {regime}</span>
      </div>
      <div className="flex items-center gap-2">
        <span>SwingPulse · v2.0</span>
        <span>·</span>
        <span>{universe}</span>
      </div>
    </footer>
  );
}
