"""
Single source of truth for the SwingPulse ticker universe.

Both fetch_and_score.py and enrich_moomoo.py import from here so the
two scripts always operate on the same set of symbols.

Universe is divided into 5 sections:
  Section 1 — High-Dividend, Low-Volatility, Bullish Names
    Filter: LONG trade type, score 5+, low beta, high yield
  Section 2 — Under $100 High-Yield, High-Volatility, High-Volume
    Filter: LONG trade type, score 3+, high volume ratio, price < $100
  Section 3 — Moderate-Yield, Positive 5-Month Performance
    Filter: LONG trade type, score 3+, positive 5-month momentum
  Section 4 — Reliable Penny Stocks for Swing Trading
    Filter: ANY trade type, score 3+, sort by volume, price < $10
  Section 5 — Penny Stocks with Strong Bullish Trends
    Filter: LONG trade type, score 5+, price < $10, high momentum
"""

# 47-ticker dividend/income + penny-stock universe
UNIVERSE: list[str] = [
    # ── Section 1: High-Dividend, Low-Volatility, Bullish Names ─────────────
    # Filter: LONG | score 5+ | defensive income plays, strong 2026 price action
    "MO", "VZ", "PEP", "DUK", "MDLZ",
    # ── Section 2: Under $100, High-Yield, High-Volatility, High-Volume ─────
    # Filter: LONG | score 3+ | aggressive income trading, high liquidity
    "EOG", "CNXC", "MDT", "LB", "PLAB",
    # ── Section 3: Moderate-Yield, Positive 5-Month Performance ─────────────
    # Filter: LONG | score 3+ | balanced income and trend-following
    "GLW", "TPL", "STX", "WDC", "UNH", "CI", "SPGI", "MMC",
    "ELV", "BDX", "CVX", "AVGO", "HD", "JPM", "BLK",
    # ── Section 4: Reliable Penny Stocks for Swing Trading ───────────────────
    # Filter: ANY | score 3+ | sort by volume | liquidity, clean structure, repeatable volatility
    "BARK", "CCO", "DDL", "WDH", "LX", "JOB", "VISL", "UGRO", "ATOM", "IMUX",
    # ── Section 5: Penny Stocks with Strong Bullish Trends (Last 5 Months) ───
    # Filter: LONG | score 5+ | aggressive momentum plays, price < $10
    "HURA", "CVSI", "SELF", "PSNY", "BBAI", "GRAL", "CECO", "BHE", "RGTI", "SOUN", "BNGO", "TELL",
]

# Human-readable display names (shown in the UI)
TICKER_NAMES: dict[str, str] = {
    # Section 1 — High-Dividend, Low-Volatility, Bullish
    "MO":    "Altria Group",
    "VZ":    "Verizon Communications",
    "PEP":   "PepsiCo",
    "DUK":   "Duke Energy",
    "MDLZ":  "Mondelez International",
    # Section 2 — Under $100, High-Yield, High-Volatility
    "EOG":   "EOG Resources",
    "CNXC":  "Concentrix Corp",
    "MDT":   "Medtronic",
    "LB":    "LandBridge Co",
    "PLAB":  "Photronics",
    # Section 3 — Moderate-Yield, Positive 5-Month Performance
    "GLW":   "Corning",
    "TPL":   "Texas Pacific Land",
    "STX":   "Seagate Technology",
    "WDC":   "Western Digital",
    "UNH":   "UnitedHealth Group",
    "CI":    "Cigna Group",
    "SPGI":  "S&P Global",
    "MMC":   "Marsh & McLennan",
    "ELV":   "Elevance Health",
    "BDX":   "Becton Dickinson",
    "CVX":   "Chevron",
    "AVGO":  "Broadcom",
    "HD":    "Home Depot",
    "JPM":   "JPMorgan Chase",
    "BLK":   "BlackRock",
    # Section 4 — Reliable Penny Stocks for Swing Trading
    "BARK":  "Bark Inc",
    "CCO":   "Clear Channel Outdoor",
    "DDL":   "Dingdong (Cayman) Ltd",
    "WDH":   "Waterdrop Inc",
    "LX":    "LexinFintech Holdings",
    "JOB":   "GEE Group",
    "VISL":  "Vislink Technologies",
    "UGRO":  "Urban-gro Inc",
    "ATOM":  "Atomera Inc",
    "IMUX":  "Immunic Inc",
    # Section 5 — Penny Stocks with Strong Bullish Trends
    "HURA":  "TuHURA Biosciences",
    "CVSI":  "CV Sciences",
    "SELF":  "Global Self Storage",
    "PSNY":  "Polestar Automotive",
    "BBAI":  "BigBear.ai",
    "GRAL":  "Grail Inc",
    "CECO":  "CECO Environmental",
    "BHE":   "Benchmark Electronics",
    "RGTI":  "Rigetti Computing",
    "SOUN":  "SoundHound AI",
    "BNGO":  "Bionano Genomics",
    "TELL":  "Tellurian Inc",
}
