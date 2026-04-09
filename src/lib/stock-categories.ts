/**
 * Stock category definitions for the SwingPulse 50-ticker universe.
 *
 * Two categories:
 *   "High Dividend Yield & High Earnings" — 25 blue-chip / income stocks
 *   "Penny Stocks"                         — 25 sub-$5 speculative plays
 */

export type StockCategory = "High Dividend Yield & High Earnings" | "Penny Stocks";
export type CategoryFilter = "ALL" | StockCategory;

export const CATEGORY_LABELS: CategoryFilter[] = [
  "ALL",
  "High Dividend Yield & High Earnings",
  "Penny Stocks",
];

/** Maps each ticker in the universe to its display category. */
export const TICKER_CATEGORY_MAP: Record<string, StockCategory> = {
  // ── High Dividend Yield & High Earnings ─────────────────────────────────
  T:    "High Dividend Yield & High Earnings",
  VZ:   "High Dividend Yield & High Earnings",
  MO:   "High Dividend Yield & High Earnings",
  PM:   "High Dividend Yield & High Earnings",
  KO:   "High Dividend Yield & High Earnings",
  PEP:  "High Dividend Yield & High Earnings",
  JNJ:  "High Dividend Yield & High Earnings",
  PFE:  "High Dividend Yield & High Earnings",
  IBM:  "High Dividend Yield & High Earnings",
  CVX:  "High Dividend Yield & High Earnings",
  XOM:  "High Dividend Yield & High Earnings",
  JPM:  "High Dividend Yield & High Earnings",
  BAC:  "High Dividend Yield & High Earnings",
  ABBV: "High Dividend Yield & High Earnings",
  MCD:  "High Dividend Yield & High Earnings",
  HD:   "High Dividend Yield & High Earnings",
  CAT:  "High Dividend Yield & High Earnings",
  UPS:  "High Dividend Yield & High Earnings",
  VLO:  "High Dividend Yield & High Earnings",
  EPD:  "High Dividend Yield & High Earnings",
  O:    "High Dividend Yield & High Earnings",
  WMB:  "High Dividend Yield & High Earnings",
  LYB:  "High Dividend Yield & High Earnings",
  WFC:  "High Dividend Yield & High Earnings",
  MMM:  "High Dividend Yield & High Earnings",

  // ── Penny Stocks ─────────────────────────────────────────────────────────
  SNDL: "Penny Stocks",
  TLRY: "Penny Stocks",
  WKHS: "Penny Stocks",
  NKLA: "Penny Stocks",
  MVIS: "Penny Stocks",
  CLOV: "Penny Stocks",
  OCGN: "Penny Stocks",
  MNMD: "Penny Stocks",
  GNUS: "Penny Stocks",
  BNGO: "Penny Stocks",
  HYLN: "Penny Stocks",
  CHPT: "Penny Stocks",
  BLNK: "Penny Stocks",
  BTBT: "Penny Stocks",
  KPLT: "Penny Stocks",
  XELA: "Penny Stocks",
  VERB: "Penny Stocks",
  ENVB: "Penny Stocks",
  ATNX: "Penny Stocks",
  NRXP: "Penny Stocks",
  SHIP: "Penny Stocks",
  CTRM: "Penny Stocks",
  CEI:  "Penny Stocks",
  SIGA: "Penny Stocks",
  IDEX: "Penny Stocks",
};
