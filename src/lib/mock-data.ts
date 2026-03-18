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

export interface Stock {
  ticker: string;
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
  news: { title: string; date: string }[];
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

export const mockRegime: RegimeData = {
  status: "BEARISH",
  spyPrice: 670.79,
  sma200: 659.91,
  sma50: 672.15,
  spyRsi: 42.2,
  vix: 20.0,
  ratio: 1.016,
  regimeScore: 1,
};

export const mockStocks: Stock[] = [
  {
    ticker: "LMT", tradeType: "SHORT", bullScore: 2, bearScore: 7, price: 636.43, rsi: 36.0,
    volumeRatio: 1.7, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: true, earningsSetup: true },
    entryAtr: 638.78, entryStructure: 640.12, bestEntry: 638.78, stopLoss: 655.00, target: 610.00, riskReward: 1.76, atr: 9.2, distance52w: 1010.0,
    conflictTrend: false, news: [{ title: "Defense sector under pressure", date: "Mar 17" }], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "APA", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 35.87, rsi: 69.6,
    volumeRatio: 0.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 35.20, entryStructure: 35.50, bestEntry: 35.20, stopLoss: 33.80, target: 39.50, riskReward: 3.07, atr: 0.82, distance52w: 45.2,
    conflictTrend: true, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "CIEN", tradeType: "LONG", bullScore: 5, bearScore: 1, price: 370.14, rsi: 64.4,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 365.00, entryStructure: 367.50, bestEntry: 365.00, stopLoss: 355.00, target: 395.00, riskReward: 3.0, atr: 5.1, distance52w: 120.5,
    conflictTrend: true, news: [{ title: "Fiber optic demand rising", date: "Mar 16" }], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "FIX", tradeType: "LONG", bullScore: 5, bearScore: 1, price: 1424.73, rsi: 60.5,
    volumeRatio: 1.5, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 1410.00, entryStructure: 1415.00, bestEntry: 1410.00, stopLoss: 1380.00, target: 1500.00, riskReward: 3.0, atr: 18.5, distance52w: 88.3,
    conflictTrend: true, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "MPC", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 233.41, rsi: 61.9,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 230.00, entryStructure: 231.50, bestEntry: 230.00, stopLoss: 224.00, target: 250.00, riskReward: 3.33, atr: 3.8, distance52w: 55.1,
    conflictTrend: true, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "MU", tradeType: "LONG", bullScore: 4, bearScore: 1, price: 461.68, rsi: 76.9,
    volumeRatio: 0.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 455.00, entryStructure: 458.00, bestEntry: 455.00, stopLoss: 445.00, target: 485.00, riskReward: 3.0, atr: 6.2, distance52w: 95.7,
    conflictTrend: true, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "AMAT", tradeType: "LONG", bullScore: 4, bearScore: 1, price: 352.28, rsi: 61.3,
    volumeRatio: 0.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 348.00, entryStructure: 350.00, bestEntry: 348.00, stopLoss: 340.00, target: 375.00, riskReward: 3.38, atr: 4.5, distance52w: 78.4,
    conflictTrend: true, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "IRM", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 108.01, rsi: 52.8,
    volumeRatio: 1.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 109.50, entryStructure: 109.00, bestEntry: 109.50, stopLoss: 114.00, target: 100.00, riskReward: 2.11, atr: 2.1, distance52w: 35.2,
    conflictTrend: false, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "KEYS", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 287.18, rsi: 55.5,
    volumeRatio: 1.5, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 290.00, entryStructure: 289.00, bestEntry: 290.00, stopLoss: 298.00, target: 270.00, riskReward: 2.5, atr: 4.0, distance52w: 62.8,
    conflictTrend: false, news: [{ title: "Keysight beats estimates", date: "Mar 15" }], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "MRNA", tradeType: "SHORT", bullScore: 1, bearScore: 3, price: 53.92, rsi: 50.3,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: false, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 55.00, entryStructure: 54.50, bestEntry: 55.00, stopLoss: 58.00, target: 48.00, riskReward: 2.33, atr: 1.8, distance52w: -55.2,
    conflictTrend: false, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
  {
    ticker: "OXY", tradeType: "SHORT", bullScore: 1, bearScore: 3, price: 57.72, rsi: 54.8,
    volumeRatio: 0.8, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: false, volume: false, macd: true, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 58.50, entryStructure: 58.20, bestEntry: 58.50, stopLoss: 61.00, target: 53.00, riskReward: 2.2, atr: 1.2, distance52w: -22.1,
    conflictTrend: false, news: [], earningsWarning: false, updatedAt: "11:01 PM ET",
  },
];

export const mockScoreHistory: Record<string, { bull: number; bear: number; date: string }[]> = {
  LMT: [
    { bull: 1, bear: 4, date: "Mar 10" }, { bull: 1, bear: 5, date: "Mar 11" }, { bull: 2, bear: 5, date: "Mar 12" },
    { bull: 1, bear: 6, date: "Mar 13" }, { bull: 2, bear: 6, date: "Mar 14" }, { bull: 2, bear: 7, date: "Mar 15" },
    { bull: 2, bear: 7, date: "Mar 16" }, { bull: 2, bear: 7, date: "Mar 17" },
  ],
  APA: [
    { bull: 3, bear: 2, date: "Mar 10" }, { bull: 4, bear: 2, date: "Mar 11" }, { bull: 4, bear: 2, date: "Mar 12" },
    { bull: 5, bear: 2, date: "Mar 13" }, { bull: 5, bear: 2, date: "Mar 14" }, { bull: 5, bear: 2, date: "Mar 15" },
    { bull: 5, bear: 2, date: "Mar 16" }, { bull: 5, bear: 2, date: "Mar 17" },
  ],
  CIEN: [
    { bull: 3, bear: 1, date: "Mar 10" }, { bull: 3, bear: 1, date: "Mar 11" }, { bull: 4, bear: 1, date: "Mar 12" },
    { bull: 4, bear: 1, date: "Mar 13" }, { bull: 5, bear: 1, date: "Mar 14" }, { bull: 5, bear: 1, date: "Mar 15" },
    { bull: 5, bear: 1, date: "Mar 16" }, { bull: 5, bear: 1, date: "Mar 17" },
  ],
};

export const lastRunInfo = {
  timestamp: "Mar 17 11:01 PM",
  stockCount: 35,
  regime: "BEARISH" as const,
  runId: "47633125",
  universe: "SP500 YTD Leaders 2026-03",
};
