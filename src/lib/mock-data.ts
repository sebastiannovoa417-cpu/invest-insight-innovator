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
  // ── Section 1: High-Dividend, Low-Volatility, Bullish Names ─────────────
  // Filter: LONG | score 5+ | defensive income plays, strong 2026 price action
  {
    ticker: "MO", name: "Altria Group", tradeType: "LONG", bullScore: 6, bearScore: 2, price: 47.20, rsi: 61.4,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 46.40, entryStructure: 46.80, bestEntry: 46.40, stopLoss: 44.20, target: 52.50, riskReward: 2.77, atr: 0.82, distance52w: 15.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Altria raises full-year EPS guidance on smokeless product strength", date: "Apr 28", source: "Bloomberg", summary: "On! nicotine pouch market share reaches 8%, accelerating the pivot away from cigarettes.", sentiment: "bullish" },
      { title: "MO dividend yield holds at 6.8%, Dividend King status reaffirmed", date: "Apr 25", source: "Seeking Alpha", summary: "54th consecutive annual dividend increase cements MO as one of the market's most reliable income plays.", sentiment: "bullish" },
      { title: "Altria +15% YTD outperforms S&P 500 defensives basket", date: "Apr 22", source: "Reuters", summary: "Low-beta income stocks attract rotation as rate uncertainty persists; MO leads consumer staples peers.", sentiment: "bullish" },
      { title: "FDA finalizes menthol cigarette ban timeline extending to 2027", date: "Apr 19", source: "WSJ", summary: "Later-than-expected implementation reduces near-term revenue risk for Altria's cigarette segment.", sentiment: "bullish" },
      { title: "Altria NJOY acquisition integration on track; retail presence expands to 90K doors", date: "Apr 16", source: "PRNewswire", summary: "E-vapor business tracking to $400M revenue run-rate by year-end.", sentiment: "bullish" },
      { title: "Cigarette volume decline accelerates to -9% YoY in Q1", date: "Apr 13", source: "FT", summary: "Combustible tobacco secular headwinds intensify despite price increases offsetting unit losses.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "VZ", name: "Verizon Communications", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 41.80, rsi: 56.3,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 41.20, entryStructure: 41.40, bestEntry: 41.20, stopLoss: 39.50, target: 46.00, riskReward: 2.82, atr: 0.68, distance52w: 8.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Verizon adds 389K postpaid phone net additions, beats estimate of 310K", date: "Apr 27", source: "Bloomberg", summary: "myPlan customization driving the highest smartphone upgrade activity since 2022.", sentiment: "bullish" },
      { title: "VZ free cash flow of $4.2B in Q1 supports 5.6% dividend yield sustainability", date: "Apr 24", source: "Reuters", summary: "Debt paydown on track; net leverage ratio improves to 2.6x from 2.8x a year ago.", sentiment: "bullish" },
      { title: "Verizon 5G C-Band coverage reaches 250M POPs nationwide", date: "Apr 21", source: "PRNewswire", summary: "Network quality gap vs. T-Mobile narrows; premium unlimited plan pricing power intact.", sentiment: "bullish" },
      { title: "VZ business segment loses 3 large enterprise accounts to AT&T", date: "Apr 18", source: "WSJ", summary: "B2B wireless competition intensifies; $120M annual revenue at risk from contract renewals.", sentiment: "bearish" },
      { title: "Verizon acquires Frontier Communications integration nears completion", date: "Apr 15", source: "Bloomberg", summary: "Fiber footprint doubles to 14M homes; consumer wireline ARPU expansion expected in H2.", sentiment: "bullish" },
      { title: "Interest expense remains elevated at $1.8B/quarter on legacy debt load", date: "Apr 12", source: "FT", summary: "High leverage from prior spectrum auctions continues to limit earnings growth and buyback capacity.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "PEP", name: "PepsiCo", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 154.20, rsi: 53.5,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 152.80, entryStructure: 153.40, bestEntry: 152.80, stopLoss: 148.00, target: 165.00, riskReward: 2.54, atr: 2.20, distance52w: -6.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "PepsiCo raises dividend 5%, extends 52-year consecutive increase streak", date: "Apr 28", source: "PRNewswire", summary: "Dividend Aristocrat status reinforced; forward yield of 3.2% above S&P 500 average.", sentiment: "bullish" },
      { title: "Frito-Lay North America organic revenue grows 4%, outpacing snack category", date: "Apr 25", source: "Bloomberg", summary: "Simply and PopCorners brands drive premium mix shift; gross margin expands 80bps.", sentiment: "bullish" },
      { title: "PEP international markets deliver 8% organic growth in EM", date: "Apr 22", source: "Reuters", summary: "India and Mexico beverage volume accelerates; emerging market pricing power intact despite FX headwinds.", sentiment: "bullish" },
      { title: "North America beverage volumes slip -2% on consumer trading down", date: "Apr 19", source: "WSJ", summary: "Gatorade and Pepsi Cola lose shelf space to private label alternatives at Walmart and Target.", sentiment: "bearish" },
      { title: "PepsiCo acquires Siete Foods for $1.2B, expanding better-for-you snacks", date: "Apr 16", source: "Bloomberg", summary: "Grain-free Mexican-American food brand accelerates PEP's premium wellness positioning.", sentiment: "bullish" },
      { title: "Input cost inflation re-accelerating; commodities basket up 7% YoY", date: "Apr 13", source: "FT", summary: "Cocoa, palm oil, and packaging costs pressuring margins heading into Q2.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "DUK", name: "Duke Energy", tradeType: "LONG", bullScore: 5, bearScore: 1, price: 107.80, rsi: 58.2,
    volumeRatio: 1.0, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 106.40, entryStructure: 106.80, bestEntry: 106.40, stopLoss: 103.00, target: 116.00, riskReward: 2.82, atr: 1.48, distance52w: 12.5,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Duke Energy rate hike approved in North Carolina; adds $420M annual revenue", date: "Apr 27", source: "Reuters", summary: "Constructive regulatory outcome supports 5-7% long-term EPS growth trajectory.", sentiment: "bullish" },
      { title: "DUK data center load growth adds 4GW to 10-year capital plan", date: "Apr 24", source: "Bloomberg", summary: "AI hyperscaler demand in Carolinas requires significant grid investment; earnings accretive by 2027.", sentiment: "bullish" },
      { title: "Duke Energy clean energy transition on track; coal retirements ahead of schedule", date: "Apr 21", source: "PRNewswire", summary: "8,000 MW of coal retired since 2015; 7GW of solar in queue for next 3 years.", sentiment: "bullish" },
      { title: "Storm recovery costs add $180M one-time charge in Q1", date: "Apr 18", source: "WSJ", summary: "Hurricane season damage restoration in Florida creates temporary EPS drag.", sentiment: "bearish" },
      { title: "Duke Energy issues $2.5B green bond at favorable rates", date: "Apr 15", source: "Bloomberg", summary: "Oversubscribed 30-year offering at 5.1% locks in low-cost capital for renewable buildout.", sentiment: "bullish" },
      { title: "Regulatory lag risk increases as inflation lifts construction costs", date: "Apr 12", source: "FT", summary: "Rate base growth timing mismatch could pressure near-term ROE below 10% allowed level.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "MDLZ", name: "Mondelez International", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 58.90, rsi: 55.8,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 58.20, entryStructure: 58.50, bestEntry: 58.20, stopLoss: 56.00, target: 64.50, riskReward: 2.86, atr: 0.92, distance52w: 2.3,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Mondelez Oreo volume grows 6% globally, driven by emerging markets", date: "Apr 28", source: "Bloomberg", summary: "India and Southeast Asia expand distribution; Oreo becomes #1 biscuit brand in 5 new markets.", sentiment: "bullish" },
      { title: "MDLZ raises full-year organic revenue guidance to 5-7% from 3-5%", date: "Apr 25", source: "PRNewswire", summary: "Better-than-expected pricing power in Europe and pricing normalization in AMEA beat consensus.", sentiment: "bullish" },
      { title: "Mondelez dividend yield of 3.3% supported by $3B annual free cash flow", date: "Apr 22", source: "Seeking Alpha", summary: "14th consecutive dividend increase; 45% payout ratio leaves room for further hikes.", sentiment: "bullish" },
      { title: "Cocoa prices remain elevated at $9,000/t, pressuring chocolate margins", date: "Apr 19", source: "Reuters", summary: "West Africa supply shortages continue; MDLZ absorbing ~$800M in incremental cocoa costs in 2026.", sentiment: "bearish" },
      { title: "Mondelez expands partnership with Alibaba for Chinese e-commerce growth", date: "Apr 16", source: "Bloomberg", summary: "O2O snacking channel contributes 12% of China revenue; digital personalization drives repeat purchase.", sentiment: "bullish" },
      { title: "Consumer staples face valuation headwinds as rates stay higher longer", date: "Apr 13", source: "FT", summary: "MDLZ trades at 20x forward earnings vs. 5-year average of 22x; potential re-rating risk if Fed delays cuts.", sentiment: "bearish" },
    ],
  },

  // ── Section 2: Under $100, High-Yield, High-Volatility, High-Volume ─────
  // Filter: LONG | score 3+ | aggressive income trading, high liquidity
  {
    ticker: "EOG", name: "EOG Resources", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 95.40, rsi: 52.1,
    volumeRatio: 1.8, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 94.20, entryStructure: 94.60, bestEntry: 94.20, stopLoss: 90.50, target: 106.00, riskReward: 3.19, atr: 1.92, distance52w: -12.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "EOG Resources Permian production hits 620K BOE/day, quarterly record", date: "Apr 28", source: "Bloomberg", summary: "Premium inventory drilling cuts per-well costs to $4.8M vs. industry average of $6.2M.", sentiment: "bullish" },
      { title: "EOG special dividend of $1.50/share declared, yield reaches 5.3% including special", date: "Apr 25", source: "PRNewswire", summary: "Fortress balance sheet with $5.8B cash supports continued variable dividend program.", sentiment: "bullish" },
      { title: "EOG Dorado natural gas play de-risked; 1,200 locations added to inventory", date: "Apr 22", source: "Reuters", summary: "South Texas gas expansion diversifies revenue stream as LNG export demand accelerates.", sentiment: "bullish" },
      { title: "WTI crude falls below $70 on OPEC+ production hike announcement", date: "Apr 19", source: "Bloomberg", summary: "Saudi Arabia accelerates voluntary cut unwinding; EOG revenue sensitivity of $120M per $1/bbl oil.", sentiment: "bearish" },
      { title: "EOG carbon capture pilot at Permian achieves 85% sequestration efficiency", date: "Apr 16", source: "PRNewswire", summary: "IRA Section 45Q credits generate $25M/year at current CO2 pricing.", sentiment: "bullish" },
      { title: "Natural gas realizations compress as Waha basis turns negative again", date: "Apr 13", source: "WSJ", summary: "Permian gas takeaway constraints reappear; EOG's unhedged gas exposure adds $0.15/share risk.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "CNXC", name: "Concentrix Corp", tradeType: "LONG", bullScore: 4, bearScore: 3, price: 62.80, rsi: 50.5,
    volumeRatio: 2.2, volumeSpike: true,
    signals: { sma200: false, sma50: true, rsiMomentum: false, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: true },
    entryAtr: 61.50, entryStructure: 62.00, bestEntry: 61.50, stopLoss: 57.80, target: 72.00, riskReward: 2.68, atr: 2.48, distance52w: -38.5,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Concentrix AI-powered CX solutions win $400M TCV in new contracts", date: "Apr 27", source: "Bloomberg", summary: "iX Hello AI platform reduces client handle times 30%; wins accelerate across BFSI vertical.", sentiment: "bullish" },
      { title: "CNXC beats Q1 revenue by 3%; raises guidance on AI-augmented services", date: "Apr 24", source: "PRNewswire", summary: "Revenue of $2.31B exceeds $2.24B estimate; 2026 guidance raised to $9.2-9.4B.", sentiment: "bullish" },
      { title: "Concentrix completes $280M cost optimization; margins expand 120bps", date: "Apr 21", source: "Reuters", summary: "Global facility consolidation and automation reduces agent headcount 8% while handling volume grows.", sentiment: "bullish" },
      { title: "High-beta profile makes CNXC volatile; stock swings 8% intraday on macro events", date: "Apr 18", source: "WSJ", summary: "Beta of 1.4 amplifies market sell-offs; risk-reward favors swing traders over long-term holders.", sentiment: "neutral" },
      { title: "Legacy Webhelp integration synergies trail schedule by one quarter", date: "Apr 15", source: "Bloomberg", summary: "Cost savings of $300M target pushed to Q4 from Q2 as European workforce restructuring faces delays.", sentiment: "bearish" },
      { title: "Near-shoring trend accelerates; Concentrix Colombia and Mexico capacity doubles", date: "Apr 12", source: "PRNewswire", summary: "US-adjacent delivery adds $0.8B incremental addressable market as clients reshore CX from Asia.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "MDT", name: "Medtronic", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 87.30, rsi: 54.7,
    volumeRatio: 1.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 86.20, entryStructure: 86.60, bestEntry: 86.20, stopLoss: 83.00, target: 96.00, riskReward: 3.06, atr: 1.52, distance52w: 4.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Medtronic CardioMEMS HF sensor approval in Japan opens $300M market", date: "Apr 28", source: "Bloomberg", summary: "Remote hemodynamic monitoring for heart failure expands in Asia-Pacific after EU/US success.", sentiment: "bullish" },
      { title: "MDT Diabetes segment Simplera CGM launches in 15 new EU countries", date: "Apr 25", source: "PRNewswire", summary: "CGM penetration rate of 62% in Type 1 diabetics; competitive position vs. Dexcom strengthens.", sentiment: "bullish" },
      { title: "Medtronic surgical robotics Hugo RA system surpasses 10,000 procedures", date: "Apr 22", source: "Reuters", summary: "Soft tissue robotic surgery platform gains traction; installed base of 380 systems in 42 countries.", sentiment: "bullish" },
      { title: "MDT Spine segment loses $180M revenue to competitive pricing pressure", date: "Apr 19", source: "WSJ", summary: "Globus Medical MAGEC system taking share in pedicle screw systems; MDT responds with price cuts.", sentiment: "bearish" },
      { title: "Medtronic raises quarterly dividend to $0.70, yield reaches 2.9%", date: "Apr 16", source: "PRNewswire", summary: "47th consecutive year of dividend growth; Dividend Aristocrat status maintained.", sentiment: "bullish" },
      { title: "Currency headwinds reduce reported revenue by $0.12/share in FY2026", date: "Apr 13", source: "Bloomberg", summary: "Strong USD vs. EUR and JPY disproportionately impacts MDT's 45% international revenue mix.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "LB", name: "LandBridge Co", tradeType: "LONG", bullScore: 3, bearScore: 3, price: 45.60, rsi: 48.9,
    volumeRatio: 2.6, volumeSpike: true,
    signals: { sma200: false, sma50: true, rsiMomentum: false, volume: true, macd: false, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 44.20, entryStructure: 44.80, bestEntry: 44.20, stopLoss: 41.00, target: 53.00, riskReward: 2.75, atr: 2.38, distance52w: -22.1,
    conflictTrend: true, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "LandBridge surface rights portfolio expands to 2.5M acres in Permian Basin", date: "Apr 27", source: "Bloomberg", summary: "Acquisitions of mineral-adjacent surface acres drive royalty income diversification.", sentiment: "bullish" },
      { title: "LB water services revenue grows 35% on new producer agreements", date: "Apr 24", source: "PRNewswire", summary: "Produced water gathering and disposal contracts signed with 3 new E&P operators.", sentiment: "bullish" },
      { title: "LandBridge beta of 1.48 creates high-velocity swing trade setups", date: "Apr 21", source: "Seeking Alpha", summary: "High correlation to oil prices and small cap volatility provides active traders with wide ranges.", sentiment: "neutral" },
      { title: "Oil price volatility pressures LB revenue visibility; guidance range widened", date: "Apr 18", source: "WSJ", summary: "Surface royalty income tied to Permian drilling activity which softens below $70 WTI.", sentiment: "bearish" },
      { title: "LandBridge IPO lock-up expiry results in 12% share price dip", date: "Apr 15", source: "Reuters", summary: "Post-IPO selling pressure creates potential technical entry for medium-term holders.", sentiment: "bearish" },
      { title: "Digital oilfield expansion adds data infrastructure revenues", date: "Apr 12", source: "Bloomberg", summary: "Fiber and edge computing infrastructure on owned land captures telco revenue from operator customers.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "PLAB", name: "Photronics", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 24.80, rsi: 57.3,
    volumeRatio: 2.0, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: false, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 24.20, entryStructure: 24.40, bestEntry: 24.20, stopLoss: 22.80, target: 28.50, riskReward: 3.07, atr: 0.68, distance52w: -18.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Photronics IC photomask revenue recovers 18% on advanced node demand", date: "Apr 28", source: "Bloomberg", summary: "2nm and 3nm photomask orders surge as TSMC and Samsung ramp cutting-edge fabs.", sentiment: "bullish" },
      { title: "PLAB FPD photomask business benefits from OLED TV panel ramp", date: "Apr 25", source: "Reuters", summary: "Display photomask ASPs rise 22% on larger format G10.5 panel orders.", sentiment: "bullish" },
      { title: "Photronics opens new Korea facility; capacity doubles in Asia", date: "Apr 22", source: "PRNewswire", summary: "Proximity to Samsung and SK Hynix fabs reduces delivery lead times and improves margins.", sentiment: "bullish" },
      { title: "PLAB high daily volume creates sharp intraday moves; avg ATR 2.7%", date: "Apr 19", source: "Seeking Alpha", summary: "Retail-driven volatility spikes around earnings and chip sector news create swing trade opportunities.", sentiment: "neutral" },
      { title: "Legacy FPD market contracts as LCD TV demand continues secular decline", date: "Apr 16", source: "WSJ", summary: "Older generation display photomask revenue shrinks 15% as Chinese panel makers reduce utilization.", sentiment: "bearish" },
      { title: "EUV photomask complexity drives ASP expansion; PLAB winning share", date: "Apr 13", source: "Bloomberg", summary: "Ultra-high NA EUV mask work commands 4x premium over DUV; Photronics one of few qualified suppliers.", sentiment: "bullish" },
    ],
  },

  // ── Section 2 (continued): F, SOFI ──────────────────────────────────────
  {
    ticker: "F", name: "Ford Motor", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 11.40, rsi: 55.8,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 11.06, entryStructure: 11.20, bestEntry: 11.06, stopLoss: 10.38, target: 12.42, riskReward: 2.0, atr: 0.34, distance52w: -22.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Ford EV losses narrow to $1.3B in Q1 as Pro segment offsets headwinds", date: "Apr 28", source: "Bloomberg", summary: "Ford Pro commercial vehicles post 22% EBIT margin; EV division burn rate falling.", sentiment: "bullish" },
      { title: "Ford dividend reinstated at $0.15/quarter after two-year suspension", date: "Apr 22", source: "Ford IR", summary: "Balance sheet strength supports capital return; $2B buyback program announced alongside dividend.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "SOFI", name: "SoFi Technologies", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 12.80, rsi: 58.4,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 12.40, entryStructure: 12.60, bestEntry: 12.40, stopLoss: 11.60, target: 14.00, riskReward: 2.0, atr: 0.40, distance52w: 18.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "SoFi bank charter enables cost-of-funds advantage over fintech peers", date: "Apr 26", source: "Seeking Alpha", summary: "Deposit base grows to $21B; FDIC charter reduces reliance on expensive wholesale funding.", sentiment: "bullish" },
      { title: "SoFi Galileo processes $1T in annualized payment volume", date: "Apr 20", source: "PRNewswire", summary: "B2B payments infrastructure accelerates; 140M accounts managed on Galileo platform.", sentiment: "bullish" },
    ],
  },

  // ── Section 3: Moderate-Yield, Positive 5-Month Performance ─────────────
  {
    ticker: "GLW", name: "Corning", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 46.40, rsi: 52.8,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 45.36, entryStructure: 45.80, bestEntry: 45.36, stopLoss: 43.28, target: 49.52, riskReward: 2.0, atr: 1.04, distance52w: 12.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Corning optical fiber demand surges on AI data center buildout", date: "Apr 27", source: "Bloomberg", summary: "Hyperscaler orders for fiber-to-the-server drive 28% revenue growth in Optical segment.", sentiment: "bullish" },
      { title: "Corning Gorilla Glass 7i wins design wins in 6 flagship smartphones", date: "Apr 21", source: "Reuters", summary: "Premium glass ASPs rise 14%; Samsung and Apple design wins secured for 2026 models.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "TPL", name: "Texas Pacific Land", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 1088.60, rsi: 62.4,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 1064.00, entryStructure: 1076.00, bestEntry: 1064.00, stopLoss: 1014.80, target: 1162.40, riskReward: 2.0, atr: 24.60, distance52w: 28.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "TPL Permian Basin royalty revenue hits record $286M in Q1 2025", date: "Apr 28", source: "TPL IR", summary: "Royalty acreage expansion via land acquisitions adds 48,000 net acres; production base growing.", sentiment: "bullish" },
      { title: "Texas Pacific Land water services revenue grows 38% on Permian completions", date: "Apr 22", source: "Bloomberg", summary: "Water sourcing and disposal for frac operations becomes largest incremental growth vector.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "STX", name: "Seagate Technology", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 82.60, rsi: 54.6,
    volumeRatio: 1.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 80.52, entryStructure: 81.40, bestEntry: 80.52, stopLoss: 76.36, target: 88.84, riskReward: 2.0, atr: 2.08, distance52w: 8.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Seagate nearline HDD demand recovers as hyperscaler capex rebounds", date: "Apr 26", source: "Bloomberg", summary: "Cloud provider HDD orders up 45% QoQ; Exos X 30TB drives winning hyperscaler qualifications.", sentiment: "bullish" },
      { title: "Seagate HAMR technology enters volume production for 40TB+ drives", date: "Apr 20", source: "STX IR", summary: "Heat-assisted magnetic recording drives ship to 3 cloud customers; 50TB roadmap confirmed.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "WDC", name: "Western Digital", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 57.20, rsi: 52.6,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 55.58, entryStructure: 56.40, bestEntry: 55.58, stopLoss: 52.34, target: 62.06, riskReward: 2.0, atr: 1.62, distance52w: -14.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Western Digital NAND prices recover 25% from 2024 trough", date: "Apr 27", source: "Reuters", summary: "Enterprise SSD ASPs stabilize as hyperscaler AI storage demand absorbs NAND capacity.", sentiment: "bullish" },
      { title: "WDC HDD and Flash separation creates two pure-play investment vehicles", date: "Apr 21", source: "Bloomberg", summary: "Spin-off completed; HDD unit (WDC) trades independently while Flash (Sandisk) seeks NYSE listing.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "UNH", name: "UnitedHealth Group", tradeType: "SHORT", bullScore: 2, bearScore: 5, price: 482.60, rsi: 36.4,
    volumeRatio: 2.2, volumeSpike: true, shortInterest: 3.8,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 482.60, entryStructure: 482.60, bestEntry: 482.60, stopLoss: 501.64, target: 444.52, riskReward: 2.0, atr: 9.52, distance52w: -38.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "UNH DOJ antitrust inquiry into Optum vertical integration widens", date: "Apr 29", source: "WSJ", summary: "Investigation covers physician group acquisitions; potential divestiture order seen as $20B risk.", sentiment: "bearish" },
      { title: "UnitedHealth medical loss ratio spikes to 85.3% on Medicare Advantage repricing", date: "Apr 23", source: "Bloomberg", summary: "Q1 MLR beats consensus by 200bps; CMS rate inadequacy forces plan design changes.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "CI", name: "Cigna Group", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 317.40, rsi: 55.2,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 310.98, entryStructure: 314.00, bestEntry: 310.98, stopLoss: 298.14, target: 336.66, riskReward: 2.0, atr: 6.42, distance52w: 4.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Cigna Evernorth pharmacy benefits segment posts 12% revenue growth", date: "Apr 26", source: "CI IR", summary: "Specialty pharmacy and biosimilar dispensing volumes up 18%; margin expansion ahead of guidance.", sentiment: "bullish" },
      { title: "Cigna share buyback program accelerates to $5B annualized pace", date: "Apr 20", source: "Bloomberg", summary: "Capital-light model supports aggressive return of capital; EPS accretion of 6% expected.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "SPGI", name: "S&P Global", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 441.20, rsi: 60.6,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 432.74, entryStructure: 437.00, bestEntry: 432.74, stopLoss: 415.82, target: 466.58, riskReward: 2.0, atr: 8.46, distance52w: 14.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "S&P Global Platts commodity data revenue grows 18% on energy transition demand", date: "Apr 27", source: "Bloomberg", summary: "Carbon market data and EV battery minerals pricing indices drive new subscription growth.", sentiment: "bullish" },
      { title: "SPGI Ratings division sees record debt issuance volume in Q1 2025", date: "Apr 21", source: "Reuters", summary: "$2.1T in global bond issuance rated; investment-grade corporate supply hits 20-year record.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "T", name: "AT&T", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 22.60, rsi: 56.4,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 22.08, entryStructure: 22.34, bestEntry: 22.08, stopLoss: 21.04, target: 24.16, riskReward: 2.0, atr: 0.52, distance52w: 16.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "AT&T fiber subscriber additions hit 261K in Q1, beating estimates", date: "Apr 28", source: "AT&T IR", summary: "AT&T Fiber passes 28M locations; ARPU of $68 beats cable broadband in head-to-head markets.", sentiment: "bullish" },
      { title: "AT&T dividend yield of 5.8% attracts income rotation flows", date: "Apr 22", source: "Seeking Alpha", summary: "Rate-cut environment boosts bond-proxy telecom stocks; AT&T debt reduction on track.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "ELV", name: "Elevance Health", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 361.80, rsi: 38.8,
    volumeRatio: 1.8, volumeSpike: false, shortInterest: 2.4,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 361.80, entryStructure: 361.80, bestEntry: 361.80, stopLoss: 376.24, target: 332.92, riskReward: 2.0, atr: 7.22, distance52w: -28.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Elevance Medicaid redeterminations create 800K member loss", date: "Apr 27", source: "Bloomberg", summary: "Post-COVID continuous enrollment unwind accelerates; Medicaid premium revenue down 8% YoY.", sentiment: "bearish" },
      { title: "ELV Medicare Advantage star ratings decline on CMS quality metrics", date: "Apr 21", source: "Reuters", summary: "Two key plans drop to 3.5 stars; quality bonus revenue at risk for 2026 plan year.", sentiment: "bearish" },
    ],
  },
  {
    ticker: "BDX", name: "Becton Dickinson", tradeType: "LONG", bullScore: 3, bearScore: 2, price: 185.80, rsi: 54.4,
    volumeRatio: 1.1, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 182.04, entryStructure: 184.00, bestEntry: 182.04, stopLoss: 174.52, target: 197.08, riskReward: 2.0, atr: 3.76, distance52w: -8.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Becton Dickinson MedSurg segment recovers on elective procedure volumes", date: "Apr 26", source: "BDX IR", summary: "Post-COVID surgical backlog drives 9% revenue growth; Alaris infusion pump recall fully resolved.", sentiment: "bullish" },
      { title: "BD separates biosciences and diagnostics unit as standalone company", date: "Apr 20", source: "Bloomberg", summary: "Spin-off creates pure-play research tools company; BDX retains higher-margin MedTech focus.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CVX", name: "Chevron Corporation", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 152.30, rsi: 43.1,
    volumeRatio: 1.4, volumeSpike: false, shortInterest: 1.8,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 152.30, entryStructure: 152.30, bestEntry: 152.30, stopLoss: 158.62, target: 139.66, riskReward: 2.0, atr: 3.16, distance52w: -18.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Chevron Hess acquisition faces FTC scrutiny over Guyana rights", date: "Apr 27", source: "WSJ", summary: "ExxonMobil/CNOOC right-of-first-refusal claim delays $53B acquisition timeline.", sentiment: "bearish" },
      { title: "Chevron Permian production exceeds 900K BOE/day, offsetting oil price headwinds", date: "Apr 21", source: "Bloomberg", summary: "Low-cost Permian volume growth maintains breakeven below $50/bbl; FCF guidance maintained.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "AVGO", name: "Broadcom", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 198.40, rsi: 61.8,
    volumeRatio: 1.5, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 193.56, entryStructure: 196.00, bestEntry: 193.56, stopLoss: 183.88, target: 212.92, riskReward: 2.0, atr: 4.84, distance52w: 22.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Broadcom custom AI ASIC revenue surges on Google TPU and Meta MRVL wins", date: "Apr 28", source: "Bloomberg", summary: "XPU market share reaches 42%; each hyperscaler custom chip order worth $6-15B over 3 years.", sentiment: "bullish" },
      { title: "Broadcom VMware integration achieves $8.5B in annual cost synergies", date: "Apr 22", source: "AVGO IR", summary: "VMware private cloud customer conversions reach 40%; ARR from software subscriptions grows 80%.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "HD", name: "Home Depot Inc", tradeType: "SHORT", bullScore: 2, bearScore: 4, price: 348.60, rsi: 45.3,
    volumeRatio: 1.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 348.60, entryStructure: 348.60, bestEntry: 348.60, stopLoss: 362.46, target: 320.88, riskReward: 2.0, atr: 6.93, distance52w: -11.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Home Depot same-store sales decline 2.1% on housing market stagnation", date: "Apr 26", source: "HD IR", summary: "Rate-sensitive big-ticket discretionary items down 8%; Pro segment partially offsets consumer weakness.", sentiment: "bearish" },
      { title: "Home Depot SRS Distribution acquisition integrates roofing and pool supply", date: "Apr 20", source: "Bloomberg", summary: "$18.25B SRS deal closes; Pro penetration reaches 52% of total revenue.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "JPM", name: "JPMorgan Chase", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 206.80, rsi: 57.4,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 202.60, entryStructure: 204.70, bestEntry: 202.60, stopLoss: 194.30, target: 219.20, riskReward: 2.0, atr: 4.15, distance52w: 18.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "JPMorgan Q1 NII beats by $600M; full-year guidance raised to $94B", date: "Apr 28", source: "JPM IR", summary: "Investment banking fees surge 21% on ECM and leveraged finance recovery; trading up 8%.", sentiment: "bullish" },
      { title: "JPMorgan Chase named Global Bank of the Year for third consecutive year", date: "Apr 22", source: "Financial Times", summary: "Balance sheet strength and international expansion cited; Dimon signals continued RoTE above 17%.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BLK", name: "BlackRock", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 1019.40, rsi: 60.8,
    volumeRatio: 1.3, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 996.60, entryStructure: 1008.00, bestEntry: 996.60, stopLoss: 951.00, target: 1088.40, riskReward: 2.0, atr: 22.80, distance52w: 12.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "BlackRock AUM crosses $11.6T on record ETF inflows and GIP acquisition", date: "Apr 27", source: "BLK IR", summary: "iShares captures 38% of all global ETF flows; infrastructure AUM doubles to $180B.", sentiment: "bullish" },
      { title: "BlackRock eFront private market data platform wins 50 sovereign wealth fund clients", date: "Apr 21", source: "Bloomberg", summary: "Alternatives technology revenue grows 28%; workflow tools become $1B+ annualized segment.", sentiment: "bullish" },
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

  // ── Section 4: Reliable Penny Stocks for Swing Trading ───────────────────
  {
    ticker: "BARK", name: "Bark Inc", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 2.42, rsi: 34.2,
    volumeRatio: 2.2, volumeSpike: false, shortInterest: 15.2,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 2.42, entryStructure: 2.42, bestEntry: 2.42, stopLoss: 2.58, target: 2.10, riskReward: 2.0, atr: 0.08, distance52w: -44.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Bark Inc subscriber churn accelerates as pet spending normalizes", date: "Apr 25", source: "Reuters", summary: "BarkBox cancellations hit 8% monthly rate; management lowers full-year guidance by 12%.", sentiment: "bearish" },
      { title: "Bark launches BarkAir dog-friendly charter airline experience", date: "Apr 19", source: "PRNewswire", summary: "Revenue contribution negligible but brand activation generates significant social media traction.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "CCO", name: "Clear Channel Outdoor", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 1.84, rsi: 32.6,
    volumeRatio: 2.8, volumeSpike: false, shortInterest: 12.4,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 1.84, entryStructure: 1.84, bestEntry: 1.84, stopLoss: 1.96, target: 1.60, riskReward: 2.0, atr: 0.06, distance52w: -52.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Clear Channel debt load of $5.6B creates persistent solvency questions", date: "Apr 24", source: "Bloomberg", summary: "Interest coverage ratio falls to 1.1x; covenant breach risk rises if EBITDA misses by 5%.", sentiment: "bearish" },
      { title: "CCO digital billboard conversion reaches 42% of total inventory", date: "Apr 18", source: "CCO IR", summary: "Programmatic OOH buying drives higher CPM; digital yields 3x traditional billboard revenue.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "DDL", name: "Dingdong (Cayman) Ltd", tradeType: "SHORT", bullScore: 0, bearScore: 4, price: 1.26, rsi: 28.4,
    volumeRatio: 3.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 1.26, entryStructure: 1.26, bestEntry: 1.26, stopLoss: 1.34, target: 1.10, riskReward: 2.0, atr: 0.04, distance52w: -61.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Dingdong Maicai loses 2.1M annual active users as Chinese consumers cut spending", date: "Apr 25", source: "Bloomberg", summary: "On-demand grocery market consolidation squeezes smaller players; cash runway extends 18 months.", sentiment: "bearish" },
      { title: "Dingdong Shanghai community group buying pilots show 8% margin improvement", date: "Apr 19", source: "DDL IR", summary: "Bulk-buy model reduces last-mile delivery cost; test expanding to 40 neighborhoods.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "WDH", name: "Waterdrop Inc", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 2.62, rsi: 55.4,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 2.54, entryStructure: 2.58, bestEntry: 2.54, stopLoss: 2.38, target: 2.86, riskReward: 2.0, atr: 0.08, distance52w: 22.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Waterdrop Insurance Marketplace gross written premiums grow 34%", date: "Apr 24", source: "WDH IR", summary: "Long-term health and critical illness product mix improves margin; NPS reaches 82.", sentiment: "bullish" },
      { title: "WDH crowdfunding platform handles 12M fundraising campaigns for medical costs", date: "Apr 18", source: "Reuters", summary: "Social proof network effect deepens; average campaign size up 24% to ¥8,400.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "LX", name: "LexinFintech Holdings", tradeType: "LONG", bullScore: 3, bearScore: 2, price: 3.82, rsi: 52.8,
    volumeRatio: 2.0, volumeSpike: false,
    signals: { sma200: true, sma50: false, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 3.70, entryStructure: 3.76, bestEntry: 3.70, stopLoss: 3.46, target: 4.18, riskReward: 2.0, atr: 0.12, distance52w: 14.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "LexinFintech consumer loan origination recovers 18% on Chinese stimulus", date: "Apr 23", source: "Bloomberg", summary: "PBOC rate cuts improve consumer credit sentiment; Lexin NPL ratio falls to 2.8%.", sentiment: "bullish" },
      { title: "LX technology-as-a-service revenue grows 42% as banks license underwriting models", date: "Apr 17", source: "LX IR", summary: "B2B fintech pivot reduces funding risk and improves capital efficiency significantly.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "JOB", name: "GEE Group", tradeType: "SHORT", bullScore: 1, bearScore: 4, price: 2.14, rsi: 30.2,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: false, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 2.14, entryStructure: 2.14, bestEntry: 2.14, stopLoss: 2.26, target: 1.90, riskReward: 2.0, atr: 0.06, distance52w: -38.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "GEE Group temporary staffing volumes fall 18% on white-collar layoffs", date: "Apr 22", source: "Reuters", summary: "Tech and finance sector temp demand hits 3-year low; professional placement fees compress.", sentiment: "bearish" },
      { title: "GEE Group debt-free balance sheet provides acquisition optionality", date: "Apr 16", source: "JOB IR", summary: "No long-term debt; $12M cash enables bolt-on acquisition in specialized staffing niche.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "VISL", name: "Vislink Technologies", tradeType: "SHORT", bullScore: 0, bearScore: 5, price: 0.82, rsi: 24.6,
    volumeRatio: 3.8, volumeSpike: false, shortInterest: 18.4,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.82, entryStructure: 0.82, bestEntry: 0.82, stopLoss: 0.88, target: 0.70, riskReward: 2.0, atr: 0.03, distance52w: -68.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Vislink revenue misses guidance as broadcast equipment capex freezes", date: "Apr 21", source: "VISL IR", summary: "Live sports and news broadcast clients defer hardware refresh cycles amid macro uncertainty.", sentiment: "bearish" },
      { title: "VISL HCAM wearable camera wins military contract worth $2.4M", date: "Apr 15", source: "PRNewswire", summary: "Defense segment provides recurring revenue; but insufficient to offset commercial revenue decline.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "UGRO", name: "Urban-gro Inc", tradeType: "SHORT", bullScore: 0, bearScore: 4, price: 1.42, rsi: 26.8,
    volumeRatio: 2.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 1.42, entryStructure: 1.42, bestEntry: 1.42, stopLoss: 1.50, target: 1.26, riskReward: 2.0, atr: 0.04, distance52w: -72.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Urban-gro cannabis cultivation design backlog falls 60% on license delays", date: "Apr 20", source: "MJBizDaily", summary: "State-level cannabis license issuance paused in 3 key markets; project pipeline shrinks.", sentiment: "bearish" },
      { title: "UGRO commercial real estate services unit wins $8M architecture contract", date: "Apr 14", source: "UGRO IR", summary: "Diversification into non-cannabis commercial design provides revenue bridge.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "ATOM", name: "Atomera Inc", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 3.62, rsi: 58.4,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 3.52, entryStructure: 3.57, bestEntry: 3.52, stopLoss: 3.32, target: 3.92, riskReward: 2.0, atr: 0.10, distance52w: 28.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Atomera MST technology licensed to top-5 global semiconductor foundry", date: "Apr 24", source: "ATOM IR", summary: "Licensing deal for Mears Silicon Technology could generate $12-40M in royalties over 5 years.", sentiment: "bullish" },
      { title: "ATOM transistor performance data shows 22% leakage reduction vs baseline", date: "Apr 18", source: "EETimes", summary: "Published validation data accelerates fab qualification timelines for 2nm node processes.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "IMUX", name: "Immunic Inc", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 1.84, rsi: 28.6,
    volumeRatio: 4.2, volumeSpike: true, shortInterest: 22.6,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 1.84, entryStructure: 1.84, bestEntry: 1.84, stopLoss: 1.96, target: 1.60, riskReward: 2.0, atr: 0.06, distance52w: -74.2,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Immunic vidofludimus Phase 3 MS trial misses primary endpoint", date: "Apr 26", source: "IMUX IR", summary: "ENSURE trial fails to meet 12-week sustained disability improvement criteria; pipeline pivots to IBD.", sentiment: "bearish" },
      { title: "IMUX IMU-856 Intestinal Stem Cell activation shows promise in Phase 2 Crohn's data", date: "Apr 20", source: "Reuters", summary: "Novel mechanism differentiates from competitive landscape; $2B addressable market.", sentiment: "bullish" },
    ],
  },

  // ── Section 5: Penny Stocks with Strong Bullish Trends ───────────────────
  {
    ticker: "HURA", name: "TuHURA Biosciences", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 2.82, rsi: 60.4,
    volumeRatio: 3.2, volumeSpike: true,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 2.72, entryStructure: 2.77, bestEntry: 2.72, stopLoss: 2.52, target: 3.12, riskReward: 2.0, atr: 0.10, distance52w: 112.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "TuHURA anti-CD206 myeloid checkpoint antibody enters Phase 1b expansion", date: "Apr 25", source: "HURA IR", summary: "Tumor microenvironment targeting differentiates from PD-1/PD-L1; early tumor regressions in 4 patients.", sentiment: "bullish" },
      { title: "HURA stock up 240% YTD on immuno-oncology pipeline validation", date: "Apr 19", source: "BioPharma Dive", summary: "Retail interest surge on social media catalysts; short interest at 8% creates volatile dynamics.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CVSI", name: "CV Sciences", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 1.64, rsi: 55.6,
    volumeRatio: 2.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 1.58, entryStructure: 1.61, bestEntry: 1.58, stopLoss: 1.46, target: 1.82, riskReward: 2.0, atr: 0.06, distance52w: 86.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "CV Sciences PlusCBD brand regains shelf space in 3,200 natural retailers", date: "Apr 23", source: "CVSI IR", summary: "FDA regulatory clarity on CBD supplements unlocks mainstream grocery distribution channel.", sentiment: "bullish" },
      { title: "CVSI pharmaceutical CBD pipeline shows efficacy in Phase 2 anxiety study", date: "Apr 17", source: "Reuters", summary: "Dose-response data supports IND filing for next-generation prescription CBD formulation.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "SELF", name: "Global Self Storage", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 4.24, rsi: 57.2,
    volumeRatio: 1.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 4.12, entryStructure: 4.18, bestEntry: 4.12, stopLoss: 3.88, target: 4.60, riskReward: 2.0, atr: 0.12, distance52w: 24.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Global Self Storage occupancy hits 96.2% on suburban migration demand", date: "Apr 22", source: "SELF IR", summary: "Same-store revenue up 8.4%; rate increases of 6% implemented without material occupancy impact.", sentiment: "bullish" },
      { title: "SELF dividend yield of 4.2% attracts income investors to micro-cap REIT", date: "Apr 16", source: "Seeking Alpha", summary: "Balance sheet leverage below 2x EBITDA provides safety margin; accretive acquisition likely in 2025.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "PSNY", name: "Polestar Automotive", tradeType: "SHORT", bullScore: 1, bearScore: 5, price: 0.72, rsi: 22.4,
    volumeRatio: 4.8, volumeSpike: true, shortInterest: 32.6,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.72, entryStructure: 0.72, bestEntry: 0.72, stopLoss: 0.78, target: 0.60, riskReward: 2.0, atr: 0.03, distance52w: -74.8,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Polestar receives going-concern warning from auditor in 2024 annual report", date: "Apr 28", source: "Reuters", summary: "Cash runway extends only 9 months; Volvo Cars confirms no additional equity support planned.", sentiment: "bearish" },
      { title: "Polestar 4 China deliveries reach 6,800 units in March — highest ever month", date: "Apr 22", source: "Bloomberg", summary: "SAIC manufacturing partnership reduces Polestar 4 cost basis by 28%; margin breakeven closer.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BBAI", name: "BigBear.ai", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 4.82, rsi: 62.4,
    volumeRatio: 2.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 4.66, entryStructure: 4.74, bestEntry: 4.66, stopLoss: 4.34, target: 5.30, riskReward: 2.0, atr: 0.16, distance52w: 148.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "BigBear.ai wins $165M US Space Force contract for satellite analytics", date: "Apr 27", source: "BBAI IR", summary: "Multi-year contract covers AI-driven space domain awareness; revenue backlog rises to $340M.", sentiment: "bullish" },
      { title: "BBAI Pangiam facial recognition deployed at 12 major international airports", date: "Apr 21", source: "Bloomberg", summary: "Biometric technology processes 4M travelers daily; contract renewal rate at 94%.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "GRAL", name: "Grail Inc", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 18.60, rsi: 65.2,
    volumeRatio: 2.2, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 18.02, entryStructure: 18.31, bestEntry: 18.02, stopLoss: 16.86, target: 20.34, riskReward: 2.0, atr: 0.58, distance52w: 186.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Grail Galleri multi-cancer early detection test achieves 50% Medicare coverage", date: "Apr 26", source: "GRAL IR", summary: "CMS coverage decision unlocks 65M eligible beneficiaries; revenue addressable market expands 8x.", sentiment: "bullish" },
      { title: "GRAL Illumina spin-off complete; Grail trades independently with $18B market opportunity", date: "Apr 20", source: "Reuters", summary: "Stand-alone entity status removes Illumina synergy overhang; institutional ownership rises to 68%.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "CECO", name: "CECO Environmental", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 11.80, rsi: 58.6,
    volumeRatio: 1.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 11.44, entryStructure: 11.62, bestEntry: 11.44, stopLoss: 10.72, target: 12.88, riskReward: 2.0, atr: 0.36, distance52w: 42.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "CECO Environmental wins $28M air pollution control contract at Texas LNG facility", date: "Apr 24", source: "CECO IR", summary: "EPA MATS regulations drive industrial emission control spending; backlog grows to $480M.", sentiment: "bullish" },
      { title: "CECO PMFG fluid handling division expands to Southeast Asia", date: "Apr 18", source: "PRNewswire", summary: "Singapore service center opens to support LNG and petrochemical projects in the region.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BHE", name: "Benchmark Electronics", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 22.60, rsi: 56.4,
    volumeRatio: 1.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: false, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 21.98, entryStructure: 22.29, bestEntry: 21.98, stopLoss: 20.74, target: 24.46, riskReward: 2.0, atr: 0.62, distance52w: 18.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Benchmark Electronics defense electronics revenue grows 22% on DoD spending", date: "Apr 23", source: "BHE IR", summary: "Electronic warfare and radar systems manufacturing wins; program of record revenue up 18%.", sentiment: "bullish" },
      { title: "BHE semiconductor test equipment builds drive margin expansion to 8.4%", date: "Apr 17", source: "Bloomberg", summary: "Complex PCB assembly for AI accelerator test benches commands 3x standard margin.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "RGTI", name: "Rigetti Computing", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 8.62, rsi: 62.8,
    volumeRatio: 3.6, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 8.30, entryStructure: 8.46, bestEntry: 8.30, stopLoss: 7.66, target: 9.58, riskReward: 2.0, atr: 0.32, distance52w: 218.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Rigetti 84-qubit Ankaa-3 QPU achieves 99.5% median 2Q gate fidelity", date: "Apr 25", source: "RGTI IR", summary: "Benchmark surpasses IBM Eagle in error rates on standard benchmarks; cloud access revenue up 85%.", sentiment: "bullish" },
      { title: "Rigetti selected for DARPA Quantum Benchmarking program worth $18M", date: "Apr 19", source: "PRNewswire", summary: "Government validation program funds QPU characterization work; positions Rigetti for DoD procurement.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "SOUN", name: "SoundHound AI", tradeType: "LONG", bullScore: 5, bearScore: 2, price: 6.84, rsi: 64.2,
    volumeRatio: 2.8, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: true, trendStrength: false, earningsSetup: false },
    entryAtr: 6.58, entryStructure: 6.71, bestEntry: 6.58, stopLoss: 6.06, target: 7.62, riskReward: 2.0, atr: 0.26, distance52w: 168.4,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "SoundHound AI restaurant voice ordering deployed at 10K Applebee's and IHOP", date: "Apr 26", source: "SOUN IR", summary: "Constellation Brands partnership for drive-through AI adds 6,200 locations; ARR grows 74%.", sentiment: "bullish" },
      { title: "SOUN automotive voice assistant design wins from 2 new OEM platforms", date: "Apr 20", source: "Bloomberg", summary: "In-vehicle voice monetization model generates $12 per car per year in subscription revenue.", sentiment: "bullish" },
    ],
  },
  {
    ticker: "BNGO", name: "Bionano Genomics", tradeType: "SHORT", bullScore: 0, bearScore: 6, price: 0.21, rsi: 22.4,
    volumeRatio: 4.6, volumeSpike: true, shortInterest: 28.4,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: true, macd: true, priceAction: true, trendStrength: true, earningsSetup: false },
    entryAtr: 0.21, entryStructure: 0.21, bestEntry: 0.21, stopLoss: 0.23, target: 0.17, riskReward: 2.0, atr: 0.01, distance52w: -88.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Bionano receives Nasdaq deficiency notice for minimum bid price rule", date: "Apr 27", source: "SEC", summary: "180-day compliance window begins; reverse split likely required to avoid delisting.", sentiment: "bearish" },
      { title: "Bionano Saphyr OGM cited in 4 peer-reviewed publications in March 2025", date: "Apr 21", source: "BNGO IR", summary: "Structural variant detection capability drives academic and clinical research adoption.", sentiment: "neutral" },
    ],
  },
  {
    ticker: "ACHR", name: "Archer Aviation", tradeType: "LONG", bullScore: 4, bearScore: 2, price: 7.22, rsi: 58.4,
    volumeRatio: 2.4, volumeSpike: false,
    signals: { sma200: true, sma50: true, rsiMomentum: true, volume: false, macd: true, priceAction: false, trendStrength: false, earningsSetup: false },
    entryAtr: 6.96, entryStructure: 7.09, bestEntry: 6.96, stopLoss: 6.44, target: 8.00, riskReward: 2.0, atr: 0.26, distance52w: 84.6,
    conflictTrend: false, earningsWarning: false, updatedAt: "4:15 PM ET",
    news: [
      { title: "Archer Aviation Midnight eVTOL receives FAA type certificate amendment for commercial ops", date: "Apr 27", source: "ACHR IR", summary: "FAA approval for commercial passenger service enables 2025 launch in UAE and India markets.", sentiment: "bullish" },
      { title: "Archer wins $142M US Air Force contract for Midnight logistics missions", date: "Apr 21", source: "Bloomberg", summary: "Military contract validates airworthiness; DoD use creates credibility for commercial certification.", sentiment: "bullish" },
    ],
  },
];

export const mockScoreHistory: Record<string, { bull: number; bear: number; date: string }[]> = {
  MO: [
    { bull: 4, bear: 2, date: "Apr 22" }, { bull: 5, bear: 2, date: "Apr 23" }, { bull: 5, bear: 2, date: "Apr 24" },
    { bull: 5, bear: 2, date: "Apr 25" }, { bull: 6, bear: 2, date: "Apr 26" }, { bull: 6, bear: 2, date: "Apr 27" },
    { bull: 6, bear: 2, date: "Apr 28" }, { bull: 6, bear: 2, date: "Apr 29" },
  ],
  JPM: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 4, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  AVGO: [
    { bull: 3, bear: 2, date: "Apr 22" }, { bull: 3, bear: 2, date: "Apr 23" }, { bull: 4, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
  MMM: [
    { bull: 3, bear: 3, date: "Apr 22" }, { bull: 3, bear: 4, date: "Apr 23" }, { bull: 2, bear: 4, date: "Apr 24" },
    { bull: 2, bear: 4, date: "Apr 25" }, { bull: 2, bear: 5, date: "Apr 26" }, { bull: 2, bear: 5, date: "Apr 27" },
    { bull: 2, bear: 5, date: "Apr 28" }, { bull: 2, bear: 5, date: "Apr 29" },
  ],
  BNGO: [
    { bull: 1, bear: 4, date: "Apr 22" }, { bull: 1, bear: 5, date: "Apr 23" }, { bull: 0, bear: 5, date: "Apr 24" },
    { bull: 0, bear: 5, date: "Apr 25" }, { bull: 0, bear: 6, date: "Apr 26" }, { bull: 0, bear: 6, date: "Apr 27" },
    { bull: 0, bear: 6, date: "Apr 28" }, { bull: 0, bear: 6, date: "Apr 29" },
  ],
  SOUN: [
    { bull: 2, bear: 2, date: "Apr 22" }, { bull: 3, bear: 2, date: "Apr 23" }, { bull: 3, bear: 2, date: "Apr 24" },
    { bull: 4, bear: 2, date: "Apr 25" }, { bull: 5, bear: 2, date: "Apr 26" }, { bull: 5, bear: 2, date: "Apr 27" },
    { bull: 5, bear: 2, date: "Apr 28" }, { bull: 5, bear: 2, date: "Apr 29" },
  ],
};

export const lastRunInfo = {
  timestamp: "Apr 29 4:15 PM",
  stockCount: 50,
  regime: "BEARISH" as const,
  runId: "swingpulse-2026-0429",
  universe: "SwingPulse 50 — v2.0",
  ranAt: null as string | null,
};

