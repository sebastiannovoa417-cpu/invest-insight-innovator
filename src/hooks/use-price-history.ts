import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PriceBar {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
}

/**
 * Fetches daily OHLCV price history for a single ticker from the price_history
 * table. Returns bars sorted oldest-first, ready for indicator computation.
 *
 * Fetches `days + 50` calendar days of history so rolling indicator windows
 * (e.g. SMA200) have enough warm-up data before the lookback window starts.
 */
export function usePriceHistory(ticker: string, days: number = 252) {
  return useQuery({
    queryKey: ["price_history", ticker, days],
    queryFn: async (): Promise<PriceBar[]> => {
      const since = new Date();
      since.setDate(since.getDate() - days - 50);
      const { data, error } = await supabase
        .from("price_history")
        .select("ticker, date, open, high, low, close, volume")
        .eq("ticker", ticker)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      return (data ?? []) as PriceBar[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!ticker,
  });
}
