"""
Single source of truth for the SwingPulse ticker universe.

Both fetch_and_score.py and enrich_moomoo.py import from here so the
two scripts always operate on the same set of symbols.
"""

# 25-ticker swing-trading universe
UNIVERSE: list[str] = [
    # Low-float / speculative swing plays (under ~$10)
    "PLUG", "NIO", "SOFI", "MARA", "VALE", "F", "AAL", "SNAP", "NOK", "XPEV",
    # Mid/large-cap sector leaders
    "LMT", "CIEN", "FIX", "MPC", "MU", "AMAT",
    # Mega-cap momentum
    "NVDA", "META", "TSLA", "AMZN", "MSFT", "AAPL", "GE", "FDX", "GOOGL",
]

# Human-readable display names (shown in the UI)
TICKER_NAMES: dict[str, str] = {
    "PLUG":  "Plug Power",
    "NIO":   "NIO Inc",
    "SOFI":  "SoFi Technologies",
    "MARA":  "Marathon Digital",
    "VALE":  "Vale S.A.",
    "F":     "Ford Motor",
    "AAL":   "American Airlines",
    "SNAP":  "Snap Inc",
    "NOK":   "Nokia",
    "XPEV":  "XPeng Inc",
    "LMT":   "Lockheed Martin",
    "CIEN":  "Ciena Corp",
    "FIX":   "Comfort Systems",
    "MPC":   "Marathon Petroleum",
    "MU":    "Micron Technology",
    "AMAT":  "Applied Materials",
    "NVDA":  "NVIDIA",
    "META":  "Meta Platforms",
    "TSLA":  "Tesla",
    "AMZN":  "Amazon",
    "MSFT":  "Microsoft",
    "AAPL":  "Apple",
    "GE":    "GE Aerospace",
    "FDX":   "FedEx",
    "GOOGL": "Alphabet",
}
