import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockSignals } from "@/lib/types";

interface ChecklistItem {
  label: string;
  key: keyof StockSignals;
  description: string;
}

interface SignalChecklistProps {
  checklist: ChecklistItem[];
  signals: StockSignals;
  isShort: boolean;
}

export function SignalChecklist({ checklist, signals, isShort }: SignalChecklistProps) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">SIGNAL CHECKLIST</h3>
      <div className="space-y-2">
        {checklist.map((item) => {
          const pass = signals[item.key];
          const passColor = isShort ? "bg-short/20 text-short" : "bg-long/20 text-long";
          return (
            <div key={item.key} className="flex items-center gap-2.5">
              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0", pass ? passColor : "bg-border text-muted-foreground")}>
                {pass ? <Check className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              </div>
              <div>
                <span className={cn("text-xs font-medium", pass ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
                <span className="text-[11px] text-muted-foreground ml-2">{item.description}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
