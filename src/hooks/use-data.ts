import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbStock, mapDbRegime, mapDbPosition, type Stock, type RegimeData, type ScoreHistoryPoint, type Position } from "@/lib/types";
import { mockStocks, mockRegime, lastRunInfo, mockScoreHistory } from "@/lib/mock-data";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ─── Stocks ─────────────────────────────────────────────
export function useStocks() {
  return useQuery({
    queryKey: ["stocks"],
    queryFn: async (): Promise<Stock[]> => {
      const { data, error } = await supabase.from("stocks").select("*");
      if (error) throw error;
      if (!data || data.length === 0) return mockStocks;
      return data.map(mapDbStock);
    },
  });
}

// ─── Regime ─────────────────────────────────────────────
export function useRegime() {
  return useQuery({
    queryKey: ["regime"],
    queryFn: async (): Promise<RegimeData> => {
      const { data, error } = await supabase.from("regime").select("*").limit(1).maybeSingle();
      if (error) throw error;
      if (!data) return mockRegime;
      return mapDbRegime(data);
    },
  });
}

// ─── Last Script Run ────────────────────────────────────
export function useLastRun() {
  return useQuery({
    queryKey: ["lastRun"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("script_runs")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return lastRunInfo;
      return {
        timestamp: new Date(data.ran_at).toLocaleString("en-US", {
          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        }),
        stockCount: data.stock_count,
        regime: data.regime ?? "UNKNOWN",
        runId: data.run_id,
        universe: data.universe ?? "SP500 YTD Leaders",
      };
    },
  });
}

// ─── Score History ───────────────────────────────────────
export function useScoreHistory() {
  return useQuery({
    queryKey: ["scoreHistory"],
    queryFn: async (): Promise<Record<string, ScoreHistoryPoint[]>> => {
      const { data, error } = await supabase
        .from("score_history")
        .select("*")
        .order("recorded_at", { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) return mockScoreHistory;

      const grouped: Record<string, ScoreHistoryPoint[]> = {};
      for (const row of data) {
        if (!grouped[row.ticker]) grouped[row.ticker] = [];
        grouped[row.ticker].push({
          bull: row.bull_score,
          bear: row.bear_score,
          date: new Date(row.recorded_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        });
      }
      // Keep last 10 per ticker
      for (const ticker of Object.keys(grouped)) {
        grouped[ticker] = grouped[ticker].slice(-10);
      }
      return grouped;
    },
  });
}

// ─── Watchlist ───────────────────────────────────────────
export function useWatchlist() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: async (): Promise<Set<string>> => {
      if (!user) return new Set();
      const { data, error } = await supabase.from("watchlist").select("ticker");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.ticker));
    },
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async (ticker: string) => {
      if (!user) throw new Error("Not logged in");
      const current = query.data ?? new Set();
      if (current.has(ticker)) {
        const { error } = await supabase.from("watchlist").delete().eq("ticker", ticker).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("watchlist").insert({ ticker, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
    onError: (err) => toast.error("Watchlist error: " + err.message),
  });

  return {
    watchlist: query.data ?? new Set<string>(),
    isLoading: query.isLoading,
    toggle: toggleMutation.mutate,
  };
}

// ─── Positions ──────────────────────────────────────────
export function usePositions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["positions", user?.id],
    queryFn: async (): Promise<Position[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapDbPosition);
    },
    enabled: !!user,
  });

  const openPosition = useMutation({
    mutationFn: async (pos: {
      ticker: string;
      direction: "LONG" | "SHORT";
      entryPrice: number;
      shares: number;
      stopLoss?: number;
      target?: number;
    }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("positions").insert({
        user_id: user.id,
        ticker: pos.ticker,
        direction: pos.direction,
        entry_price: pos.entryPrice,
        shares: pos.shares,
        stop_loss: pos.stopLoss ?? null,
        target: pos.target ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position opened!");
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  const closePosition = useMutation({
    mutationFn: async ({ id, exitPrice }: { id: string; exitPrice: number }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("positions")
        .update({ status: "closed", exit_price: exitPrice, exit_date: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position closed!");
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    openPosition: openPosition.mutate,
    closePosition: closePosition.mutate,
  };
}
