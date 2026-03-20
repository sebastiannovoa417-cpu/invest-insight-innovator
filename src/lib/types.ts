import { Tables } from "@/integrations/supabase/types";

// Unified Stock type that works with both mock and Supabase data
export interface StockSignals {
  sma200: boolean;
  sma50: boolean;
  rsiMomentum: boolean;
  volume: boolean;
  macd: boolean;
  priceAction: boolean;
  trendStrength: boolean;
  earningsSetup: boolean;
}

export interface NewsItem {
  title: string;
  date: string;
  source?: string;
  summary?: string;
  sentiment?: "bullish" | "bearish" | "neutral";
  url?: string;
}

export interface Stock {
  ticker: string;
  name: string;
  tradeType: "LONG" | "SHORT";
  bullScore: number;
  bearScore: number;
  price: number;
  rsi: number;
  volumeRatio: number;
  volumeSpike: boolean;
  signals: StockSignals;
  entryAtr: number;
  entryStructure: number;
  bestEntry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  atr: number;
  distance52w: number;
  conflictTrend: boolean;
  news: NewsItem[];
  earningsDate?: string;
  earningsWarning: boolean;
  updatedAt: string;
}

export interface RegimeData {
  status: "BULLISH" | "BEARISH" | "NEUTRAL";
  spyPrice: number;
  sma200: number;
  sma50: number;
  spyRsi: number;
  vix: number;
  ratio: number;
  regimeScore: number;
}

export interface ScoreHistoryPoint {
  bull: number;
  bear: number;
  date: string;
}

export interface Position {
  id: string;
  ticker: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  shares: number;
  entryDate: string;
  stopLoss: number | null;
  target: number | null;
  status: "open" | "closed";
  exitPrice: number | null;
  exitDate: string | null;
  notes: string | null;
}

// Transform Supabase row to app Stock type
export function mapDbStock(row: Tables<"stocks">): Stock {
  const signals = (row.signals || {}) as Record<string, boolean>;
  const news = (row.news || []) as NewsItem[];
  
  return {
    ticker: row.ticker,
    name: row.name ?? row.ticker,
    tradeType: row.trade_type as "LONG" | "SHORT",
    bullScore: row.bull_score,
    bearScore: row.bear_score,
    price: row.price,
    rsi: row.rsi ?? 0,
    volumeRatio: row.volume_ratio ?? 0,
    volumeSpike: row.volume_spike,
    signals: {
      sma200: signals.sma200 ?? false,
      sma50: signals.sma50 ?? false,
      rsiMomentum: signals.rsiMomentum ?? false,
      volume: signals.volume ?? false,
      macd: signals.macd ?? false,
      priceAction: signals.priceAction ?? false,
      trendStrength: signals.trendStrength ?? false,
      earningsSetup: signals.earningsSetup ?? false,
    },
    entryAtr: row.entry_atr ?? 0,
    entryStructure: row.entry_structure ?? 0,
    bestEntry: row.best_entry ?? 0,
    stopLoss: row.stop_loss ?? 0,
    target: row.target ?? 0,
    riskReward: row.risk_reward ?? 0,
    atr: row.atr ?? 0,
    distance52w: row.distance_52w ?? 0,
    conflictTrend: row.conflict_trend,
    news,
    earningsDate: row.earnings_date ?? undefined,
    earningsWarning: row.earnings_warning,
    updatedAt: new Date(row.updated_at).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }),
  };
}

export function mapDbRegime(row: Tables<"regime">): RegimeData {
  return {
    status: row.status as "BULLISH" | "BEARISH" | "NEUTRAL",
    spyPrice: row.spy_price,
    sma200: row.sma_200,
    sma50: row.sma_50,
    spyRsi: row.spy_rsi,
    vix: row.vix,
    ratio: row.ratio,
    regimeScore: row.regime_score,
  };
}

export function mapDbPosition(row: Tables<"positions">): Position {
  return {
    id: row.id,
    ticker: row.ticker,
    direction: row.direction as "LONG" | "SHORT",
    entryPrice: row.entry_price,
    shares: row.shares,
    entryDate: row.entry_date,
    stopLoss: row.stop_loss,
    target: row.target,
    status: row.status as "open" | "closed",
    exitPrice: row.exit_price,
    exitDate: row.exit_date,
    notes: row.notes,
  };
}
