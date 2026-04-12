/**
 * Stock category definitions for the SwingPulse 50-ticker universe (v2.0).
 *
 * Two categories:
 *   "High Dividend Yield & High Earnings" — 28 income / blue-chip stocks (Sections 1-3)
 *   "Penny Stocks"                         — 22 sub-$25 speculative plays (Sections 4-5)
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
  // ── Section 1: High-Dividend, Low-Volatility ────────────────────────────
  MO:   "High Dividend Yield & High Earnings",
  VZ:   "High Dividend Yield & High Earnings",
  PEP:  "High Dividend Yield & High Earnings",
  DUK:  "High Dividend Yield & High Earnings",
  MDLZ: "High Dividend Yield & High Earnings",
  // ── Section 2: Under $100, High-Yield, High-Volume ──────────────────────
  EOG:  "High Dividend Yield & High Earnings",
  CNXC: "High Dividend Yield & High Earnings",
  MDT:  "High Dividend Yield & High Earnings",
  LB:   "High Dividend Yield & High Earnings",
  PLAB: "High Dividend Yield & High Earnings",
  F:    "High Dividend Yield & High Earnings",
  SOFI: "High Dividend Yield & High Earnings",
  // ── Section 3: Moderate-Yield, Positive 5-Month Performance ─────────────
  GLW:  "High Dividend Yield & High Earnings",
  TPL:  "High Dividend Yield & High Earnings",
  STX:  "High Dividend Yield & High Earnings",
  WDC:  "High Dividend Yield & High Earnings",
  UNH:  "High Dividend Yield & High Earnings",
  CI:   "High Dividend Yield & High Earnings",
  SPGI: "High Dividend Yield & High Earnings",
  T:    "High Dividend Yield & High Earnings",
  ELV:  "High Dividend Yield & High Earnings",
  BDX:  "High Dividend Yield & High Earnings",
  CVX:  "High Dividend Yield & High Earnings",
  AVGO: "High Dividend Yield & High Earnings",
  HD:   "High Dividend Yield & High Earnings",
  JPM:  "High Dividend Yield & High Earnings",
  BLK:  "High Dividend Yield & High Earnings",
  MMM:  "High Dividend Yield & High Earnings",
  // ── Section 4: Reliable Penny Stocks for Swing Trading ───────────────────
  BARK: "Penny Stocks",
  CCO:  "Penny Stocks",
  DDL:  "Penny Stocks",
  WDH:  "Penny Stocks",
  LX:   "Penny Stocks",
  JOB:  "Penny Stocks",
  VISL: "Penny Stocks",
  UGRO: "Penny Stocks",
  ATOM: "Penny Stocks",
  IMUX: "Penny Stocks",
  // ── Section 5: Penny Stocks with Strong Bullish Trends ───────────────────
  HURA: "Penny Stocks",
  CVSI: "Penny Stocks",
  SELF: "Penny Stocks",
  PSNY: "Penny Stocks",
  BBAI: "Penny Stocks",
  GRAL: "Penny Stocks",
  CECO: "Penny Stocks",
  BHE:  "Penny Stocks",
  RGTI: "Penny Stocks",
  SOUN: "Penny Stocks",
  BNGO: "Penny Stocks",
  ACHR: "Penny Stocks",
};
