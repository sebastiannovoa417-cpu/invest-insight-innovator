import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface ConfirmPositionModalProps {
  stock: Stock;
  shares: string;
  isShort: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmPositionModal({ stock, shares, isShort, onConfirm, onCancel }: ConfirmPositionModalProps) {
  const shareCount = parseFloat(shares) || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn("w-5 h-5", isShort ? "text-short" : "text-long")} />
          <h3 className="font-semibold text-foreground">Confirm Position</h3>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ticker</span>
            <span className="font-mono font-bold">{stock.ticker}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Direction</span>
            <span className={cn("font-bold", isShort ? "text-short" : "text-long")}>{stock.tradeType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entry</span>
            <span className="font-mono">${stock.bestEntry.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares</span>
            <span className="font-mono">{shareCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Stop Loss</span>
            <span className="font-mono text-short">${stock.stopLoss.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target</span>
            <span className="font-mono text-long">${stock.target.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5 mt-1.5">
            <span className="text-muted-foreground">Total Value</span>
            <span className="font-mono font-semibold">${(stock.bestEntry * shareCount).toFixed(2)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-md border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2 rounded-md text-sm font-semibold transition-colors",
              isShort ? "bg-short text-short-foreground hover:bg-short/90" : "bg-long text-long-foreground hover:bg-long/90"
            )}
          >
            Confirm {stock.tradeType}
          </button>
        </div>
      </div>
    </div>
  );
}
