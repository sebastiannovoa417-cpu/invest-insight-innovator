import { useState } from "react";
import { Bell, BellOff, Trash2, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAlerts } from "@/hooks/use-alerts";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { Stock, AlertCondition } from "@/lib/types";

const CONDITION_LABELS: Record<AlertCondition, string> = {
    bull_score_gte: "Bull Score ≥",
    bear_score_gte: "Bear Score ≥",
    rsi_above: "RSI >",
    rsi_below: "RSI <",
    price_above: "Price > $",
    price_below: "Price < $",
};

const CONDITION_DEFAULTS: Record<AlertCondition, string> = {
    bull_score_gte: "6",
    bear_score_gte: "6",
    rsi_above: "70",
    rsi_below: "30",
    price_above: "",
    price_below: "",
};

interface AlertsPanelProps {
    stocks: Stock[];
}

export function AlertsPanel({ stocks }: AlertsPanelProps) {
    const { user } = useAuth();
    const { alerts, isLoading, createAlert, isCreating, deleteAlert, resetAlert } = useAlerts();

    const [ticker, setTicker] = useState<string>(stocks[0]?.ticker ?? "");
    const [condition, setCondition] = useState<AlertCondition>("bull_score_gte");
    const [threshold, setThreshold] = useState(CONDITION_DEFAULTS["bull_score_gte"]);

    const handleConditionChange = (v: AlertCondition) => {
        setCondition(v);
        setThreshold(CONDITION_DEFAULTS[v]);
    };

    const handleCreate = () => {
        const num = parseFloat(threshold);
        if (!ticker || !condition || isNaN(num)) return;
        createAlert({ ticker, condition, threshold: num });
        setThreshold(CONDITION_DEFAULTS[condition]);
    };

    const activeAlerts = alerts.filter((a) => a.status === "active");
    const triggeredAlerts = alerts.filter((a) => a.status === "triggered");

    // ── Unauthenticated state ────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium text-muted-foreground">Sign in to create price alerts.</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                    Alerts are checked on every pipeline run (~every 30 min during market hours).
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* ── Create alert form ──────────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">
                    CREATE ALERT
                </h2>
                <div className="flex flex-wrap gap-2 items-end">

                    {/* Ticker */}
                    <div className="flex-1 min-w-[100px] max-w-[140px]">
                        <label className="text-[10px] text-muted-foreground mb-1 block">TICKER</label>
                        <Select value={ticker} onValueChange={setTicker}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {stocks.map((s) => (
                                    <SelectItem key={s.ticker} value={s.ticker} className="text-xs font-mono">
                                        {s.ticker}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Condition */}
                    <div className="flex-1 min-w-[150px] max-w-[210px]">
                        <label className="text-[10px] text-muted-foreground mb-1 block">CONDITION</label>
                        <Select
                            value={condition}
                            onValueChange={(v) => handleConditionChange(v as AlertCondition)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(CONDITION_LABELS) as AlertCondition[]).map((c) => (
                                    <SelectItem key={c} value={c} className="text-xs">
                                        {CONDITION_LABELS[c]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Threshold */}
                    <div className="w-24">
                        <label className="text-[10px] text-muted-foreground mb-1 block">THRESHOLD</label>
                        <Input
                            type="number"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder="e.g. 6"
                            className="h-8 text-xs"
                        />
                    </div>

                    <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={handleCreate}
                        disabled={isCreating || !threshold || isNaN(parseFloat(threshold))}
                    >
                        <Plus className="w-3 h-3" />
                        Add Alert
                    </Button>
                </div>

                <p className="text-[10px] text-muted-foreground/70 mt-3">
                    Alerts trigger when the pipeline next scores your ticker and the condition is met.
                    Triggered alerts stay fired until you reset them.
                </p>
            </div>

            {/* ── Active alerts ─────────────────────────────────────────────── */}
            <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="text-xs font-semibold text-muted-foreground tracking-wider mb-3">
                    ACTIVE ALERTS{" "}
                    <span className="text-foreground">({activeAlerts.length})</span>
                </h2>

                {isLoading ? (
                    <div className="space-y-2">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-9 rounded bg-muted/40 animate-pulse" />
                        ))}
                    </div>
                ) : activeAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 opacity-60">
                        No active alerts. Create one above.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {activeAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                className="flex items-center justify-between rounded border border-border bg-background px-3 py-2"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <Bell className="w-3 h-3 shrink-0 text-muted-foreground" />
                                    <span className="text-xs font-mono font-bold text-foreground">
                                        {alert.ticker}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {CONDITION_LABELS[alert.condition]}
                                    </span>
                                    <span className="text-xs font-mono font-semibold text-foreground">
                                        {alert.threshold}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                    title="Delete alert"
                                    onClick={() => deleteAlert(alert.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Triggered alerts ──────────────────────────────────────────── */}
            {(triggeredAlerts.length > 0 || (!isLoading && alerts.length > 0)) && (
                <div
                    className={cn(
                        "rounded-lg border bg-card p-4",
                        triggeredAlerts.length > 0
                            ? "border-amber-500/40"
                            : "border-border opacity-50",
                    )}
                >
                    <h2
                        className={cn(
                            "text-xs font-semibold tracking-wider mb-3",
                            triggeredAlerts.length > 0 ? "text-amber-400" : "text-muted-foreground",
                        )}
                    >
                        TRIGGERED{" "}
                        <span className="text-foreground">({triggeredAlerts.length})</span>
                    </h2>

                    {triggeredAlerts.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4 opacity-60">
                            No triggered alerts yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {triggeredAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-center justify-between rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2"
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                        <BellOff className="w-3 h-3 shrink-0 text-amber-400" />
                                        <span className="text-xs font-mono font-bold text-foreground">
                                            {alert.ticker}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {CONDITION_LABELS[alert.condition]}
                                        </span>
                                        <span className="text-xs font-mono font-semibold text-foreground">
                                            {alert.threshold}
                                        </span>
                                        {alert.triggeredAt && (
                                            <span className="text-[10px] text-amber-400/80">
                                                {new Date(alert.triggeredAt).toLocaleString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                            title="Reset to active"
                                            onClick={() => resetAlert(alert.id)}
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                            title="Delete alert"
                                            onClick={() => deleteAlert(alert.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
