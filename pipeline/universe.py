"""
Single source of truth for the SwingPulse ticker universe.

Both fetch_and_score.py and enrich_moomoo.py import from here so the
two scripts always operate on the same set of symbols.

Universe v2 — 50 tickers across two categories:
  • High Dividend Yield & High Earnings (25): blue-chip income stocks
  • Penny Stocks (25): sub-$5 speculative / high-volatility plays
"""

# ── 50-ticker universe ────────────────────────────────────────────────────────
UNIVERSE: list[str] = [
    # High Dividend Yield & High Earnings
    "T", "VZ", "MO", "PM", "KO", "PEP", "JNJ", "PFE", "IBM", "CVX",
    "XOM", "JPM", "BAC", "ABBV", "MCD", "HD", "CAT", "UPS", "VLO", "EPD",
    "O", "WMB", "LYB", "WFC", "MMM",
    # Penny Stocks
    "SNDL", "TLRY", "WKHS", "NKLA", "MVIS", "CLOV", "OCGN", "MNMD", "GNUS", "BNGO",
    "HYLN", "CHPT", "BLNK", "BTBT", "KPLT", "XELA", "VERB", "ENVB", "ATNX", "NRXP",
    "SHIP", "CTRM", "CEI", "SIGA", "IDEX",
]

# Human-readable display names (shown in the UI)
TICKER_NAMES: dict[str, str] = {
    # High Dividend Yield & High Earnings
    "T":    "AT&T Inc",
    "VZ":   "Verizon Communications",
    "MO":   "Altria Group",
    "PM":   "Philip Morris International",
    "KO":   "Coca-Cola Company",
    "PEP":  "PepsiCo Inc",
    "JNJ":  "Johnson & Johnson",
    "PFE":  "Pfizer Inc",
    "IBM":  "IBM Corporation",
    "CVX":  "Chevron Corporation",
    "XOM":  "ExxonMobil Corporation",
    "JPM":  "JPMorgan Chase",
    "BAC":  "Bank of America",
    "ABBV": "AbbVie Inc",
    "MCD":  "McDonald's Corporation",
    "HD":   "Home Depot Inc",
    "CAT":  "Caterpillar Inc",
    "UPS":  "United Parcel Service",
    "VLO":  "Valero Energy",
    "EPD":  "Enterprise Products Partners",
    "O":    "Realty Income Corp",
    "WMB":  "Williams Companies",
    "LYB":  "LyondellBasell Industries",
    "WFC":  "Wells Fargo & Company",
    "MMM":  "3M Company",
    # Penny Stocks
    "SNDL": "Sundial Growers",
    "TLRY": "Tilray Brands",
    "WKHS": "Workhorse Group",
    "NKLA": "Nikola Corp",
    "MVIS": "MicroVision Inc",
    "CLOV": "Clover Health",
    "OCGN": "Ocugen Inc",
    "MNMD": "MindMed Inc",
    "GNUS": "Genius Brands",
    "BNGO": "Bionano Genomics",
    "HYLN": "Hyliion Holdings",
    "CHPT": "ChargePoint Holdings",
    "BLNK": "Blink Charging",
    "BTBT": "Bit Digital",
    "KPLT": "Katapult Holdings",
    "XELA": "Exela Technologies",
    "VERB": "Verb Technology",
    "ENVB": "Enveric Biosciences",
    "ATNX": "Athenex Inc",
    "NRXP": "NRx Pharmaceuticals",
    "SHIP": "Seanergy Maritime",
    "CTRM": "Castor Maritime",
    "CEI":  "Camber Energy",
    "SIGA": "SIGA Technologies",
    "IDEX": "Ideanomics Inc",
}

# Category membership — used by the pipeline to tag each scored record
TICKER_CATEGORIES: dict[str, str] = {
    ticker: "High Dividend Yield & High Earnings"
    for ticker in [
        "T", "VZ", "MO", "PM", "KO", "PEP", "JNJ", "PFE", "IBM", "CVX",
        "XOM", "JPM", "BAC", "ABBV", "MCD", "HD", "CAT", "UPS", "VLO", "EPD",
        "O", "WMB", "LYB", "WFC", "MMM",
    ]
} | {
    ticker: "Penny Stocks"
    for ticker in [
        "SNDL", "TLRY", "WKHS", "NKLA", "MVIS", "CLOV", "OCGN", "MNMD", "GNUS", "BNGO",
        "HYLN", "CHPT", "BLNK", "BTBT", "KPLT", "XELA", "VERB", "ENVB", "ATNX", "NRXP",
        "SHIP", "CTRM", "CEI", "SIGA", "IDEX",
    ]
}
