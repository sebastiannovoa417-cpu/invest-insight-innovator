import type { Stock, RegimeData } from "@/lib/types";

export { type Stock, type RegimeData };

export const mockRegime: RegimeData = {
  status: "BEARISH",
  spyPrice: 558.00,
  sma200: 539.50,
  sma50: 555.20,
  spyRsi: 42.5,
  vix: 24.06,
  ratio: 1.034,
  regimeScore: 1,
};

export const mockStocks: Stock[] = [

  // ══════════════════════════════════════════════════════════════════════
  // HIGH DIVIDEND YIELD & HIGH EARNINGS (25)
  // ══════════════════════════════════════════════════════════════════════

  {
    ticker: "T", name: "AT&T Inc", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 18.50, rsi: 38.2,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 18.50, entryStructure: 18.50, bestEntry: 18.50, stopLoss: 19.42, target: 16.66, riskReward: 2.0, atr: 0.46, distance52w: -18.3,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 3.2,
    news: [
      { title: "AT&T free cash flow misses guidance for second quarter", date: "Apr 28", source: "Bloomberg", summary: "FCF of $3.1B below $3.6B target; management blames 5G capex and fiber build delays.", sentiment: "bearish" },
      { title: "AT&T dividend yield reaches 5.8% at current price", date: "Apr 22", source: "Reuters", summary: "At $18.50, AT&T yields 5.8% — above telecom sector average; income floor intact.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "VZ", name: "Verizon Communications", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 41.20, rsi: 35.8,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 41.20, entryStructure: 41.20, bestEntry: 41.20, stopLoss: 42.85, target: 37.90, riskReward: 2.0, atr: 0.82, distance52w: -22.1,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.8,
    news: [
      { title: "Verizon postpaid net adds disappoint in Q1", date: "Apr 27", source: "WSJ", summary: "Postpaid phone net adds of 148K miss 210K estimate; churn ticks up to 0.83%.", sentiment: "bearish" },
      { title: "Verizon C-Band deployment reaches 230M POPs", date: "Apr 21", source: "PRNewswire", summary: "Network quality improvements driving enterprise contract wins; B2B revenue +6% YoY.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "MO", name: "Altria Group", tradeType: "SHORT", bullScore: 3, bearScore: 5, price: 44.80, rsi: 41.5,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 44.80, entryStructure: 44.80, bestEntry: 44.80, stopLoss: 45.88, target: 42.64, riskReward: 2.0, atr: 0.54, distance52w: -14.6,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 4.1,
    news: [
      { title: "FDA menthol cigarette ban decision delayed to late 2026", date: "Apr 26", source: "Reuters", summary: "FDA pushes final rule back, relieving near-term revenue risk for Altria.", sentiment: "bullish" },
      { title: "Altria cigarette volumes fall 8.5% YoY in Q1", date: "Apr 23", source: "Bloomberg", summary: "Volume decline accelerates beyond 6-7% historical pace; smoke-free transition faces headwinds.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "PM", name: "Philip Morris International", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 119.50, rsi: 58.4,
    volumeRatio: 1.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 119.50, entryStructure: 119.50, bestEntry: 119.50, stopLoss: 116.15, target: 126.20, riskReward: 2.0, atr: 1.67, distance52w: 12.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.8,
    news: [
      { title: "IQOS heated tobacco reaches 36M users globally", date: "Apr 29", source: "PM IR", summary: "IQOS volumes +26% YoY; smoke-free products now 38% of revenue, driving margin expansion.", sentiment: "bullish" },
      { title: "Philip Morris acquires Swedish Match brands in Nordics", date: "Apr 24", source: "FT", summary: "Snus and nicotine pouch expansion deepens smoke-free portfolio in high-growth Scandinavian markets.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "KO", name: "Coca-Cola Company", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 62.80, rsi: 52.1,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 62.80, entryStructure: 62.80, bestEntry: 62.80, stopLoss: 61.29, target: 66.02, riskReward: 2.13, atr: 0.75, distance52w: 8.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 0.9,
    news: [
      { title: "Coca-Cola Q1 organic revenue +6%, beats 4.5% estimate", date: "Apr 28", source: "Bloomberg", summary: "Pricing power and EM volume offsetting North American softness.", sentiment: "bullish" },
      { title: "Coca-Cola raises FY guidance on strong international demand", date: "Apr 22", source: "Reuters", summary: "Company lifts full-year organic revenue growth target from 5% to 6-7%.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "PEP", name: "PepsiCo Inc", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 168.20, rsi: 44.6,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 168.20, entryStructure: 168.20, bestEntry: 168.20, stopLoss: 172.59, target: 159.42, riskReward: 2.0, atr: 2.19, distance52w: -12.3,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.2,
    news: [
      { title: "PepsiCo Frito-Lay volumes fall 2.5% as consumers trade down", date: "Apr 27", source: "WSJ", summary: "Snack division faces elasticity headwinds; management guides flat volumes in H2.", sentiment: "bearish" },
      { title: "Pepsi Lifewater and energy drinks beat volume targets", date: "Apr 21", source: "Bloomberg", summary: "Gatorade, Lipton, and Celsius partnership drive 8% growth in better-for-you beverages.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "JNJ", name: "Johnson & Johnson", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 158.60, rsi: 54.2,
    volumeRatio: 1.0, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 158.60, entryStructure: 158.60, bestEntry: 158.60, stopLoss: 155.12, target: 165.56, riskReward: 2.0, atr: 1.74, distance52w: 5.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 0.7,
    news: [
      { title: "J&J MedTech segment posts 7.2% growth in surgical robotics", date: "Apr 26", source: "JNJ IR", summary: "Ottava and Abiomed drive MedTech outperformance; surgical robot installed base up 34%.", sentiment: "bullish" },
      { title: "Talc liability trial outcomes remain uncertain into 2026", date: "Apr 20", source: "Reuters", summary: "Bankruptcy settlement discussions continue; total talc exposure estimate revised to $8-12B.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "PFE", name: "Pfizer Inc", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 26.80, rsi: 36.4,
    volumeRatio: 1.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 26.80, entryStructure: 26.80, bestEntry: 26.80, stopLoss: 27.88, target: 24.64, riskReward: 2.0, atr: 0.54, distance52w: -38.5,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 5.8,
    news: [
      { title: "Pfizer cuts 2025 revenue guidance on COVID product decline", date: "Apr 29", source: "Bloomberg", summary: "Paxlovid and Comirnaty revenues fall 72% combined; non-COVID pipeline must offset $12B gap.", sentiment: "bearish" },
      { title: "Pfizer oncology Seagen acquisition drives 15 new cancer drugs", date: "Apr 23", source: "PRNewswire", summary: "ADC portfolio on track for 4 NDA submissions in 2025, providing pipeline optionality.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "IBM", name: "IBM Corporation", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 182.40, rsi: 60.3,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 182.40, entryStructure: 182.40, bestEntry: 182.40, stopLoss: 177.06, target: 192.08, riskReward: 1.81, atr: 2.67, distance52w: 22.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.1,
    news: [
      { title: "IBM watsonx AI revenue exceeds $2B annual run rate", date: "Apr 28", source: "IBM IR", summary: "Enterprise AI platform wins accelerate in banking and government verticals; ARR +80% YoY.", sentiment: "bullish" },
      { title: "IBM HashiCorp integration on schedule for H2 synergies", date: "Apr 22", source: "Bloomberg", summary: "DevOps and cloud automation acquisition brings $500M ARR; cross-sell to IBM installed base underway.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CVX", name: "Chevron Corporation", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 152.30, rsi: 43.1,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 152.30, entryStructure: 152.30, bestEntry: 152.30, stopLoss: 156.94, target: 143.02, riskReward: 2.0, atr: 2.32, distance52w: -16.8,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.5,
    news: [
      { title: "Chevron Permian production beats Q1 target by 4%", date: "Apr 27", source: "Chevron IR", summary: "TCO Kazakhstan expansion brings 30K bpd incremental; total production 3.35M boepd.", sentiment: "bullish" },
      { title: "WTI crude falls to $68 on OPEC+ production hike fears", date: "Apr 24", source: "Reuters", summary: "Saudi-UAE supply agreement collapses; market bracing for 500K bpd incremental barrels in Q3.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "XOM", name: "ExxonMobil Corporation", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 105.60, rsi: 42.6,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 105.60, entryStructure: 105.60, bestEntry: 105.60, stopLoss: 108.79, target: 99.22, riskReward: 2.0, atr: 1.60, distance52w: -19.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.3,
    news: [
      { title: "ExxonMobil Pioneer integration ahead of schedule", date: "Apr 26", source: "XOM IR", summary: "Combined Permian operations produce 1.4M bpd at $12/boe cost; merger synergies of $2B on track.", sentiment: "bullish" },
      { title: "Oil demand growth forecast cut to 900K bpd from 1.2M bpd", date: "Apr 21", source: "IEA", summary: "EV adoption and China slowdown reduce global oil consumption outlook for 2025.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "JPM", name: "JPMorgan Chase", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 206.80, rsi: 57.4,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 206.80, entryStructure: 206.80, bestEntry: 206.80, stopLoss: 201.43, target: 217.54, riskReward: 2.0, atr: 2.69, distance52w: 14.2,
    conflictTrend: false, earningsWarning: true, updatedAt: "4:15 PM ET", shortInterest: 0.8,
    news: [
      { title: "JPMorgan Q1 EPS $4.44 beats $4.17 estimate on trading surge", date: "Apr 28", source: "Bloomberg", summary: "FICC and equities desks combined revenue of $9.2B — best first quarter since 2021.", sentiment: "bullish" },
      { title: "JPMorgan warns on 2025 NII guidance amid rate cut uncertainty", date: "Apr 28", source: "FT", summary: "Dimon cautions NII tailwind from 2024 may not repeat; net interest income guide held flat.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "BAC", name: "Bank of America", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 36.90, rsi: 37.8,
    volumeRatio: 1.7, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 36.90, entryStructure: 36.90, bestEntry: 36.90, stopLoss: 38.15, target: 34.40, riskReward: 2.0, atr: 0.63, distance52w: -21.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 3.4,
    news: [
      { title: "Bank of America NII falls $400M on deposit cost pressure", date: "Apr 27", source: "WSJ", summary: "Funding costs rise as clients shift to higher-yield products; NIM compression continues.", sentiment: "bearish" },
      { title: "BofA wealth management AUM reaches record $4.1T", date: "Apr 23", source: "Bloomberg", summary: "Merrill Lynch advisor headcount stabilizes; net new assets of $42B in Q1 strongest since 2021.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "ABBV", name: "AbbVie Inc", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 164.20, rsi: 59.6,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 164.20, entryStructure: 164.20, bestEntry: 164.20, stopLoss: 159.82, target: 172.96, riskReward: 2.0, atr: 2.19, distance52w: 16.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.6,
    news: [
      { title: "AbbVie Skyrizi/Rinvoq franchise revenue hits $11B", date: "Apr 29", source: "ABBV IR", summary: "Combined revenues +38% YoY; Humira biosimilar erosion fully offset by Q4.", sentiment: "bullish" },
      { title: "AbbVie Emraclidine Phase 2 schizophrenia trial succeeds", date: "Apr 25", source: "Bloomberg", summary: "Statistically significant HAM-A reduction; Phase 3 enrollment begins H2 2025.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "MCD", name: "McDonald's Corporation", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 298.40, rsi: 44.1,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 298.40, entryStructure: 298.40, bestEntry: 298.40, stopLoss: 306.28, target: 282.64, riskReward: 2.0, atr: 3.94, distance52w: -15.2,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.4,
    news: [
      { title: "McDonald's US same-store sales -1.6% on consumer value fatigue", date: "Apr 26", source: "WSJ", summary: "Traffic declines persist despite $5 meal deal; value perception vs. fast-casual gap widens.", sentiment: "bearish" },
      { title: "McD's CosMc's beverage concept reaches 250 locations", date: "Apr 20", source: "Bloomberg", summary: "Coffee and specialty drink chain targeting millennial and Gen-Z occasions outside core QSR.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "HD", name: "Home Depot Inc", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 348.60, rsi: 45.3,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 348.60, entryStructure: 348.60, bestEntry: 348.60, stopLoss: 357.70, target: 330.40, riskReward: 2.0, atr: 4.55, distance52w: -13.8,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.2,
    news: [
      { title: "Home Depot comparable sales -2.3% on housing market pressure", date: "Apr 27", source: "Reuters", summary: "High mortgage rates suppress existing home turnover, reducing remodel spend category.", sentiment: "bearish" },
      { title: "Home Depot Pro segment grows 6.2% offsetting DIY weakness", date: "Apr 22", source: "Bloomberg", summary: "B2B Pro customer segment shows resilience; SRS Distribution acquisition adds $6.5B revenue.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CAT", name: "Caterpillar Inc", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 342.80, rsi: 39.2,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 342.80, entryStructure: 342.80, bestEntry: 342.80, stopLoss: 353.10, target: 322.20, riskReward: 2.0, atr: 5.15, distance52w: -24.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.3,
    news: [
      { title: "Caterpillar Q1 construction orders fall 18% on dealer destocking", date: "Apr 28", source: "Bloomberg", summary: "North American dealer inventories 40% above norms; production cuts signal order trough.", sentiment: "bearish" },
      { title: "CAT mining equipment backlog remains at record $28B", date: "Apr 24", source: "CAT IR", summary: "Copper and lithium mine capex drives unprecedented demand for large mining trucks and shovels.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "UPS", name: "United Parcel Service", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 128.40, rsi: 36.8,
    volumeRatio: 1.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 128.40, entryStructure: 128.40, bestEntry: 128.40, stopLoss: 132.58, target: 120.04, riskReward: 2.0, atr: 2.09, distance52w: -34.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 3.6,
    news: [
      { title: "UPS revenue per piece falls 4.2% as Amazon volumes decline", date: "Apr 27", source: "WSJ", summary: "Amazon volume loss following contract renegotiation reduces daily package count by 500K.", sentiment: "bearish" },
      { title: "UPS healthcare logistics segment grows 12% in Q1", date: "Apr 22", source: "Bloomberg", summary: "Temperature-controlled cold chain and specialty pharma shipping offset B2C weakness.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "VLO", name: "Valero Energy", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 124.60, rsi: 42.8,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 124.60, entryStructure: 124.60, bestEntry: 124.60, stopLoss: 128.85, target: 116.10, riskReward: 2.0, atr: 2.12, distance52w: -28.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 3.1,
    news: [
      { title: "Valero crack spreads compress to $12/bbl on weak gasoline demand", date: "Apr 26", source: "Reuters", summary: "Spring driving season disappoints; refining margins 40% below year-ago levels.", sentiment: "bearish" },
      { title: "Valero Diamond Green Diesel renewable capacity reaches 1.2B gallons", date: "Apr 20", source: "Valero IR", summary: "DGD JV cost advantage vs. competitors widens as feedstock economics improve.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "EPD", name: "Enterprise Products Partners", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 30.20, rsi: 55.8,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 30.20, entryStructure: 30.20, bestEntry: 30.20, stopLoss: 29.48, target: 31.64, riskReward: 2.0, atr: 0.36, distance52w: 8.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 1.8,
    news: [
      { title: "EPD distributable cash flow covers distribution 1.9× in Q1", date: "Apr 28", source: "EPD IR", summary: "Fee-based midstream model insulates from commodity price swings; distribution growth +5.5% YoY.", sentiment: "bullish" },
      { title: "Enterprise adds $1.8B NGL export terminal capacity in Beaumont", date: "Apr 23", source: "Bloomberg", summary: "Expanded LPG export facility captures record international propane demand from Asia.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "O", name: "Realty Income Corp", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 54.80, rsi: 52.4,
    volumeRatio: 1.0, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 54.80, entryStructure: 54.80, bestEntry: 54.80, stopLoss: 53.44, target: 57.52, riskReward: 2.0, atr: 0.68, distance52w: 4.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.6,
    news: [
      { title: "Realty Income raises monthly dividend — 128th consecutive increase", date: "Apr 25", source: "Realty IR", summary: "5.8% current yield with investment-grade balance sheet; 108 consecutive years of payments.", sentiment: "bullish" },
      { title: "Realty Income Spirit merger integration adds 2,000 net-lease properties", date: "Apr 19", source: "Reuters", summary: "Combined portfolio 15,400+ properties; diversification across 90+ tenants and 50 states.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "WMB", name: "Williams Companies", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 38.60, rsi: 56.2,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 38.60, entryStructure: 38.60, bestEntry: 38.60, stopLoss: 37.62, target: 40.56, riskReward: 2.0, atr: 0.49, distance52w: 10.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.0,
    news: [
      { title: "Williams Transco natural gas pipeline utilization at 97%", date: "Apr 26", source: "Williams IR", summary: "Northeast capacity fully contracted; $3.5B expansion project permitted for 2026 in-service.", sentiment: "bullish" },
      { title: "LNG export terminal access drives Williams throughput premium", date: "Apr 20", source: "Bloomberg", summary: "Sabine Pass and Corpus Christi connectivity commands $0.04/MMBtu premium vs. spot.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "LYB", name: "LyondellBasell Industries", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 82.40, rsi: 40.6,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 82.40, entryStructure: 82.40, bestEntry: 82.40, stopLoss: 84.88, target: 77.44, riskReward: 2.0, atr: 1.24, distance52w: -28.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 4.2,
    news: [
      { title: "LyondellBasell polyethylene margins at decade low on China oversupply", date: "Apr 25", source: "Reuters", summary: "Spot PE prices below $0.40/lb; Chinese capacity additions flood global markets through 2026.", sentiment: "bearish" },
      { title: "LYB announces $3B buyback and maintains 6.4% dividend", date: "Apr 19", source: "Bloomberg", summary: "Capital return program signals management confidence despite near-term cycle trough.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "WFC", name: "Wells Fargo & Company", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 59.80, rsi: 43.2,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 59.80, entryStructure: 59.80, bestEntry: 59.80, stopLoss: 61.62, target: 56.16, riskReward: 2.0, atr: 0.91, distance52w: -18.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 2.2,
    news: [
      { title: "Wells Fargo OCC asset cap removal still contingent on consent order", date: "Apr 27", source: "Reuters", summary: "Fed asset cap of $1.95T remains; timeline for removal pushed to 2026.", sentiment: "bearish" },
      { title: "Wells Fargo investment banking revenue jumps 38% YoY", date: "Apr 23", source: "Bloomberg", summary: "M&A advisory and ECM rebound drives non-interest income above consensus.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "MMM", name: "3M Company", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 104.20, rsi: 38.4,
    volumeRatio: 1.6, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 104.20, entryStructure: 104.20, bestEntry: 104.20, stopLoss: 107.74, target: 97.12, riskReward: 2.0, atr: 1.77, distance52w: -31.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 4.8,
    news: [
      { title: "3M PFAS settlement payments begin — $10.3B commitment through 2036", date: "Apr 26", source: "WSJ", summary: "Public water system contamination settlement drains $1.1B annually; balance sheet under pressure.", sentiment: "bearish" },
      { title: "3M Solventum healthcare spin-off receives $14B enterprise value", date: "Apr 20", source: "Bloomberg", summary: "Healthcare unit separation completed; 3M now focused on industrial and safety businesses.", sentiment: "bullish" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // PENNY STOCKS (25)
  // ══════════════════════════════════════════════════════════════════════

  {
    ticker: "SNDL", name: "Sundial Growers", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 1.82, rsi: 32.6,
    volumeRatio: 2.4, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 1.82, entryStructure: 1.82, bestEntry: 1.82, stopLoss: 1.91, target: 1.64, riskReward: 2.0, atr: 0.05, distance52w: -48.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 12.4,
    news: [
      { title: "SNDL cannabis retail same-store sales fall 14%", date: "Apr 27", source: "MJBizDaily", summary: "Alberta market price compression squeezes licensed retailer margins below breakeven.", sentiment: "bearish" },
      { title: "SNDL liquor retail acquisition adds 40 Wine and Beyond stores", date: "Apr 21", source: "PRNewswire", summary: "SpiritLeaf and Wine and Beyond combination creates largest private cannabis-liquor retailer in Canada.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "TLRY", name: "Tilray Brands", tradeType: "SHORT", bullScore: 1, bearScore: 6, price: 1.48, rsi: 28.4,
    volumeRatio: 3.1, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 1.48, entryStructure: 1.48, bestEntry: 1.48, stopLoss: 1.56, target: 1.32, riskReward: 2.0, atr: 0.04, distance52w: -52.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 18.6,
    news: [
      { title: "Tilray US cannabis rescheduling delay crushes timeline projections", date: "Apr 28", source: "Reuters", summary: "DEA Schedule III rescheduling stalls; federal legalization still 3+ years away.", sentiment: "bearish" },
      { title: "Tilray craft beer SweetWater and Montauk volumes +22%", date: "Apr 22", source: "Bloomberg", summary: "Beverage alcohol segment provides $250M revenue bridge while cannabis awaits policy change.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "WKHS", name: "Workhorse Group", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 1.14, rsi: 30.2,
    volumeRatio: 2.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 1.14, entryStructure: 1.14, bestEntry: 1.14, stopLoss: 1.20, target: 1.02, riskReward: 2.0, atr: 0.03, distance52w: -58.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 22.8,
    news: [
      { title: "Workhorse W56 van production halted on battery supply shortage", date: "Apr 27", source: "TechCrunch", summary: "Sole battery supplier cancels agreement; production pause threatens $80M backlog.", sentiment: "bearish" },
      { title: "US Postal Service EV pilot includes 200 Workhorse C-series trucks", date: "Apr 21", source: "USPS PR", summary: "USPS evaluation contract worth $18M provides validation for delivery fleet use case.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "NKLA", name: "Nikola Corp", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.88, rsi: 24.8,
    volumeRatio: 4.2, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.88, entryStructure: 0.88, bestEntry: 0.88, stopLoss: 0.95, target: 0.74, riskReward: 2.0, atr: 0.04, distance52w: -72.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 28.6,
    news: [
      { title: "Nikola raises going-concern doubt after cash falls below $90M", date: "Apr 29", source: "Bloomberg", summary: "Company burns $45M/quarter; bankruptcy advisors retained per SEC filing footnote.", sentiment: "bearish" },
      { title: "Nikola hydrogen fuel cell truck passes California ARB certification", date: "Apr 22", source: "CalARB", summary: "Tre FCEV receives HVIP voucher eligibility, unlocking $120K incentive per truck.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "MVIS", name: "MicroVision Inc", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 2.08, rsi: 38.4,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 2.08, entryStructure: 2.08, bestEntry: 2.08, stopLoss: 2.20, target: 1.84, riskReward: 2.0, atr: 0.06, distance52w: -42.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 14.2,
    news: [
      { title: "MicroVision loses OEM evaluation contract to competitor LiDAR", date: "Apr 26", source: "Reuters", summary: "Tier-1 automotive supplier chooses Luminar over MVIS for next-gen ADAS platform.", sentiment: "bearish" },
      { title: "MVIS MAVIN LiDAR sensor beats range spec at CES demo", date: "Apr 20", source: "TechCrunch", summary: "256-channel sensor achieves 250m range — 25% above published specification.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CLOV", name: "Clover Health", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 2.44, rsi: 35.6,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 2.44, entryStructure: 2.44, bestEntry: 2.44, stopLoss: 2.58, target: 2.16, riskReward: 2.0, atr: 0.07, distance52w: -44.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 16.4,
    news: [
      { title: "Clover exits 2 markets on Medicare Advantage rate cuts", date: "Apr 27", source: "MedScape", summary: "CMS 2025 benchmark reduction forces exit from Louisiana and Mississippi; member attrition accelerates.", sentiment: "bearish" },
      { title: "Clover Assistant AI achieves 94% provider adoption rate", date: "Apr 21", source: "Clover IR", summary: "AI care management platform reduces hospitalization rate 18% below Medicare benchmark.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "OCGN", name: "Ocugen Inc", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 1.06, rsi: 29.8,
    volumeRatio: 2.6, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 1.06, entryStructure: 1.06, bestEntry: 1.06, stopLoss: 1.14, target: 0.90, riskReward: 2.0, atr: 0.04, distance52w: -54.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 20.8,
    news: [
      { title: "Ocugen OCU400 gene therapy FDA rejection triggers 35% drop", date: "Apr 29", source: "BioPharma Dive", summary: "FDA issues CRL citing manufacturing deficiencies; re-submission timeline 18+ months.", sentiment: "bearish" },
      { title: "Ocugen COVAXIN receives WHO emergency use listing", date: "Apr 22", source: "WHO", summary: "Global approval expands addressable market; licensing discussions in 12 countries.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "MNMD", name: "MindMed Inc", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 4.48, rsi: 56.2,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: false, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 4.48, entryStructure: 4.48, bestEntry: 4.48, stopLoss: 4.26, target: 4.92, riskReward: 2.0, atr: 0.11, distance52w: 28.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 8.6,
    news: [
      { title: "MindMed MM120 LSD analog Phase 3 anxiety data meets primary endpoint", date: "Apr 28", source: "BioPharma Dive", summary: "Statistically significant HAM-A reduction at 12-week endpoint; NDA submission expected Q4 2025.", sentiment: "bullish" },
      { title: "FDA grants MNMD Breakthrough Therapy Designation for MM120", date: "Apr 22", source: "FDA.gov", summary: "BTD accelerates review; PDUFA date of early 2026 would make MNMD first psychedelic drug approval.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "GNUS", name: "Genius Brands", tradeType: "SHORT", bullScore: 0, bearScore: 5, price: 0.42, rsi: 26.4,
    volumeRatio: 3.4, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.42, entryStructure: 0.42, bestEntry: 0.42, stopLoss: 0.46, target: 0.34, riskReward: 2.0, atr: 0.02, distance52w: -66.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 24.6,
    news: [
      { title: "Genius Brands receives Nasdaq delisting notice — below $1 minimum bid", date: "Apr 28", source: "SEC Filing", summary: "GNUS given 180 days to regain $1 bid compliance or face delisting to OTC.", sentiment: "bearish" },
      { title: "Genius Brands Shaq's Garage show renewed for Season 2", date: "Apr 22", source: "Variety", summary: "Discovery+ partnership extends animated content deal; licensing revenue provides cash runway.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "BNGO", name: "Bionano Genomics", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.21, rsi: 22.4,
    volumeRatio: 4.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.21, entryStructure: 0.21, bestEntry: 0.21, stopLoss: 0.23, target: 0.17, riskReward: 2.0, atr: 0.01, distance52w: -74.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 31.2,
    news: [
      { title: "Bionano Genomics executes reverse stock split to avoid delisting", date: "Apr 29", source: "Bloomberg", summary: "1-for-40 reverse split; underlying business burn rate unchanged at $18M/quarter.", sentiment: "bearish" },
      { title: "Bionano OGM technology adopted by 4 major research hospitals", date: "Apr 23", source: "BNGO IR", summary: "Optical genome mapping captures rare disease market share vs. NGS platforms.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "HYLN", name: "Hyliion Holdings", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 0.96, rsi: 33.8,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 0.96, entryStructure: 0.96, bestEntry: 0.96, stopLoss: 1.02, target: 0.84, riskReward: 2.0, atr: 0.03, distance52w: -52.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 14.8,
    news: [
      { title: "Hyliion Karno turbine generator commercialization delayed 18 months", date: "Apr 26", source: "TechCrunch", summary: "Heat-to-power unit requires additional testing after prototype thermal runaway incident.", sentiment: "bearish" },
      { title: "Hyliion receives $12M DOE grant for stationary power R&D", date: "Apr 20", source: "DOE.gov", summary: "Federal funding validates technology pathway; reduces commercial deployment capital requirements.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CHPT", name: "ChargePoint Holdings", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 2.48, rsi: 36.4,
    volumeRatio: 2.2, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: true, earningsSetup: false },
    entryAtr: 2.48, entryStructure: 2.48, bestEntry: 2.48, stopLoss: 2.63, target: 2.18, riskReward: 2.0, atr: 0.07, distance52w: -56.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 18.4,
    news: [
      { title: "ChargePoint cuts workforce 15% after 4th consecutive revenue miss", date: "Apr 28", source: "Reuters", summary: "EV adoption slowdown reduces fleet and commercial charging orders below guidance.", sentiment: "bearish" },
      { title: "ChargePoint surpasses 300,000 charging ports globally", date: "Apr 22", source: "CHPT IR", summary: "Network scale advantages intensify; subscription software ARR grows 28% on rising utilization.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BLNK", name: "Blink Charging", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 3.14, rsi: 38.8,
    volumeRatio: 1.9, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 3.14, entryStructure: 3.14, bestEntry: 3.14, stopLoss: 3.33, target: 2.76, riskReward: 2.0, atr: 0.09, distance52w: -48.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 22.6,
    news: [
      { title: "Blink Charging restates 2023 financials on revenue recognition errors", date: "Apr 29", source: "SEC", summary: "Material accounting restatement reduces reported revenue by $8M; CFO departures ongoing.", sentiment: "bearish" },
      { title: "Blink wins 500-unit DCFC contract with hotel chain", date: "Apr 23", source: "Bloomberg", summary: "Marriott partnership adds recurring kWh revenue from high-dwell hospitality locations.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BTBT", name: "Bit Digital", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 3.42, rsi: 55.8,
    volumeRatio: 2.1, volumeSpike: true,
    signals: { sma200: false, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 3.42, entryStructure: 3.42, bestEntry: 3.42, stopLoss: 3.22, target: 3.82, riskReward: 2.0, atr: 0.10, distance52w: 34.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 10.2,
    news: [
      { title: "Bit Digital hash rate grows 28% after upgrading to Antminer S21 fleet", date: "Apr 27", source: "Bitcoin Magazine", summary: "Efficient fleet expansion reduces all-in production cost to $28,000/BTC.", sentiment: "bullish" },
      { title: "BTBT cloud computing GPU rental revenue hits $4M/quarter", date: "Apr 21", source: "BTBT IR", summary: "H100 cluster rental to AI startups diversifies revenue beyond Bitcoin mining cycle dependency.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "KPLT", name: "Katapult Holdings", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 1.96, rsi: 34.2,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 1.96, entryStructure: 1.96, bestEntry: 1.96, stopLoss: 2.08, target: 1.72, riskReward: 2.0, atr: 0.06, distance52w: -46.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 16.8,
    news: [
      { title: "Katapult gross originations fall 22% on consumer credit tightening", date: "Apr 26", source: "Bloomberg", summary: "Sub-prime consumer lease-to-own applications decline as BNPL defaults accelerate.", sentiment: "bearish" },
      { title: "Katapult Wayfair partnership adds $40M annual origination pipeline", date: "Apr 20", source: "KPLT IR", summary: "Furniture vertical represents 28% of total originations with better credit performance.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "XELA", name: "Exela Technologies", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.28, rsi: 21.6,
    volumeRatio: 5.2, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.28, entryStructure: 0.28, bestEntry: 0.28, stopLoss: 0.30, target: 0.24, riskReward: 2.0, atr: 0.02, distance52w: -71.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 34.6,
    news: [
      { title: "Exela Technologies executes 1-for-20 reverse split; debt load remains $1.2B", date: "Apr 28", source: "Reuters", summary: "Reverse split preserves Nasdaq listing; net debt-to-EBITDA remains above 8× despite refinancing.", sentiment: "bearish" },
      { title: "Exela Healthcare wins 3 new hospital system transaction contracts", date: "Apr 22", source: "XELA PR", summary: "Claims automation and revenue cycle management contracts add $28M ARR.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "VERB", name: "Verb Technology", tradeType: "SHORT", bullScore: 0, bearScore: 5, price: 0.24, rsi: 24.8,
    volumeRatio: 4.1, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.24, entryStructure: 0.24, bestEntry: 0.24, stopLoss: 0.26, target: 0.20, riskReward: 2.0, atr: 0.01, distance52w: -68.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 28.4,
    news: [
      { title: "Verb Technology receives Nasdaq delisting warning — below $1 bid requirement", date: "Apr 27", source: "SEC", summary: "180-day cure period begins; continued share issuance dilutes existing shareholders.", sentiment: "bearish" },
      { title: "Verb MARKET live shopping platform adds 200 new brands", date: "Apr 21", source: "Verb IR", summary: "Interactive video commerce growing 35% QoQ; TikTok shopping integration drives discovery.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "ENVB", name: "Enveric Biosciences", tradeType: "SHORT", bullScore: 0, bearScore: 5, price: 0.78, rsi: 28.4,
    volumeRatio: 2.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 0.78, entryStructure: 0.78, bestEntry: 0.78, stopLoss: 0.84, target: 0.66, riskReward: 2.0, atr: 0.04, distance52w: -58.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 20.4,
    news: [
      { title: "Enveric EB-002 psilocybin analog fails Phase 1 dose escalation", date: "Apr 26", source: "BioPharma Dive", summary: "Dose-limiting toxicity at 25mg prevents advancement; competitor MindMed benefits from setback.", sentiment: "bearish" },
      { title: "Enveric secures NIH SBIR grant for psychedelic biomarker research", date: "Apr 20", source: "NIH.gov", summary: "$750K Phase I grant validates scientific approach to optimizing psychedelic medicine protocols.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "ATNX", name: "Athenex Inc", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 0.58, rsi: 30.6,
    volumeRatio: 2.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 0.58, entryStructure: 0.58, bestEntry: 0.58, stopLoss: 0.63, target: 0.48, riskReward: 2.0, atr: 0.03, distance52w: -62.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 18.2,
    news: [
      { title: "Athenex oral paclitaxel rejected by FDA for second time", date: "Apr 27", source: "BioPharma Dive", summary: "Complete response letter cites clinical deficiencies; commercial path for flagship product eliminated.", sentiment: "bearish" },
      { title: "Athenex specialty pharma adds 4 new hospital formulary contracts", date: "Apr 21", source: "ATNX IR", summary: "503B outsourcing facility wins expand injectable product distribution to 180 hospitals.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "NRXP", name: "NRx Pharmaceuticals", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 1.42, rsi: 33.4,
    volumeRatio: 2.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 1.42, entryStructure: 1.42, bestEntry: 1.42, stopLoss: 1.52, target: 1.22, riskReward: 2.0, atr: 0.05, distance52w: -54.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 16.8,
    news: [
      { title: "NRx ZYESAMI COVID-19 treatment FDA approval still pending", date: "Apr 26", source: "Reuters", summary: "EUA application under re-review; market opportunity diminished by endemic disease status.", sentiment: "bearish" },
      { title: "NRx BriAria PTSD ketamine formulation enters Phase 2b", date: "Apr 20", source: "NRx IR", summary: "Intranasal ketamine for PTSD reaches dose-selection Phase 2b; addresses $4B unmet medical need.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "SHIP", name: "Seanergy Maritime", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 0.68, rsi: 32.8,
    volumeRatio: 2.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.68, entryStructure: 0.68, bestEntry: 0.68, stopLoss: 0.74, target: 0.56, riskReward: 2.0, atr: 0.03, distance52w: -46.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 14.6,
    news: [
      { title: "Capesize spot rates fall to $8,200/day vs $18,000 year ago", date: "Apr 27", source: "Shipping Gazette", summary: "Brazil-China iron ore routes soften on reduced Chinese steel mill activity.", sentiment: "bearish" },
      { title: "Seanergy fleet TCE contracts locked for 65% of Q3 at $14,500/day", date: "Apr 21", source: "SHIP IR", summary: "Forward fixture coverage reduces downside; contracted rates above breakeven of $11,200/day.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CTRM", name: "Castor Maritime", tradeType: "SHORT", bullScore: 0, bearScore: 5, price: 0.34, rsi: 26.4,
    volumeRatio: 3.6, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.34, entryStructure: 0.34, bestEntry: 0.34, stopLoss: 0.38, target: 0.26, riskReward: 2.0, atr: 0.02, distance52w: -62.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 26.4,
    news: [
      { title: "Castor Maritime stock drops 40% on 100M share equity offering", date: "Apr 28", source: "Bloomberg", summary: "Dilutive equity raise at $0.30 funds vessel acquisitions; existing shareholders absorb 40% dilution.", sentiment: "bearish" },
      { title: "Castor Maritime product tanker fleet earns $16,200/day TCE", date: "Apr 22", source: "CTRM IR", summary: "Product tanker segment benefits from Russian oil trade route disruptions driving ton-mile demand.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "CEI", name: "Camber Energy", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.09, rsi: 18.4,
    volumeRatio: 6.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.09, entryStructure: 0.09, bestEntry: 0.09, stopLoss: 0.10, target: 0.07, riskReward: 2.0, atr: 0.01, distance52w: -78.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 38.4,
    news: [
      { title: "Camber Energy receives continued SEC investigation subpoena", date: "Apr 27", source: "SEC", summary: "Investigation into accounting irregularities and related-party transactions ongoing since 2022.", sentiment: "bearish" },
      { title: "Camber preferred share conversion reduces senior debt by $4M", date: "Apr 21", source: "CEI IR", summary: "Debt-to-equity conversions improve balance sheet optics; dilutes common shareholders significantly.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "SIGA", name: "SIGA Technologies", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 4.64, rsi: 54.8,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: false, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 4.64, entryStructure: 4.64, bestEntry: 4.64, stopLoss: 4.44, target: 5.04, riskReward: 2.0, atr: 0.10, distance52w: 18.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 8.4,
    news: [
      { title: "SIGA TPOXX stockpile contract renewed for $113M by HHS", date: "Apr 26", source: "HHS.gov", summary: "5-year Strategic National Stockpile contract renewal provides predictable government revenue base.", sentiment: "bullish" },
      { title: "Mpox outbreak spreads to 8 new countries — TPOXX demand surge", date: "Apr 21", source: "WHO", summary: "WHO re-declares mpox PHEIC; SIGA receives emergency orders from 3 European health ministries.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "IDEX", name: "Ideanomics Inc", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.16, rsi: 19.8,
    volumeRatio: 7.2, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.16, entryStructure: 0.16, bestEntry: 0.16, stopLoss: 0.18, target: 0.12, riskReward: 2.0, atr: 0.01, distance52w: -82.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET", shortInterest: 42.6,
    news: [
      { title: "Ideanomics receives final Nasdaq delisting notice after cure period expires", date: "Apr 28", source: "SEC", summary: "Common shares to be delisted effective May 15; appeal filed but success unlikely given financials.", sentiment: "bearish" },
      { title: "Ideanomics WAVE wireless EV charging road pilot approved in Utah", date: "Apr 22", source: "Utah DOT", summary: "Dynamic wireless charging pilot with 2-mile test corridor demonstrates commercial viability.", sentiment: "neutral" },
    ],
  },
];

export const mockScoreHistory: Record<string, { bull: number; bear: number; date: string }[]> = {
  ABBV: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 4, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  EPD: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 3, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  JPM: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 4, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  IBM: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 3, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  MMM: [
    { bull: 3, bear: 3, date: "Apr 22" }, { bull: 3, bear: 4, date: "Apr 23" }, { bull: 2, bear: 4, date: "Apr 24" },
    { bull: 2, bear: 4, date: "Apr 25" }, { bull: 2, bear: 5, date: "Apr 26" }, { bull: 2, bear: 5, date: "Apr 27" },
    { bull: 2, bear: 5, date: "Apr 28" }, { bull: 2, bear: 5, date: "Apr 29" },
  ],
  TLRY: [
    { bull: 2, bear: 4, date: "Apr 22" }, { bull: 2, bear: 5, date: "Apr 23" }, { bull: 1, bear: 5, date: "Apr 24" },
    { bull: 1, bear: 5, date: "Apr 25" }, { bull: 1, bear: 6, date: "Apr 26" }, { bull: 1, bear: 6, date: "Apr 27" },
    { bull: 1, bear: 6, date: "Apr 28" }, { bull: 1, bear: 6, date: "Apr 29" },
  ],
  MNMD: [
    { bull: 2, bear: 2, date: "Apr 22" }, { bull: 3, bear: 2, date: "Apr 23" }, { bull: 3, bear: 2, date: "Apr 24" },
    { bull: 3, bear: 2, date: "Apr 25" }, { bull: 4, bear: 2, date: "Apr 26" }, { bull: 4, bear: 2, date: "Apr 27" },
    { bull: 4, bear: 2, date: "Apr 28" }, { bull: 4, bear: 2, date: "Apr 29" },
  ],
};

export const lastRunInfo = {
  timestamp: "Apr 29 4:15 PM",
  stockCount: 50,
  regime: "BEARISH" as const,
  runId: "swingpulse-2025-0429",
  universe: "SwingPulse 50 — v2.0",
  ranAt: null as string | null,
};

