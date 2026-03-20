"""enrich_moomoo.py — Enriches Supabase `stocks` table with moomoo data.

Connects to a running FutuOpenD instance (127.0.0.1:11111), fetches the
market snapshot for all 25 SwingPulse tickers, and PATCHes the Supabase
`stocks` table with:
  - short_interest  (short_sell_ratio × 100, as a percentage)
  - earnings_date   (next earnings date, ISO format)
  - earnings_warning (True if earnings are within EARNINGS_WARN_DAYS)

Usage:
  1. Start FutuOpenD: run FutuOpenD.exe (or keep it running via Task Scheduler).
  2. Ensure pipeline/.env has SUPABASE_URL and SUPABASE_SERVICE_KEY.
  3. Run: python enrich_moomoo.py
  4. (Optional) Schedule daily via run_enrich.bat in Windows Task Scheduler.
"""

import logging
import os
from datetime import datetime, timedelta, timezone

import moomoo as ft
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────

FUTU_HOST: str = os.getenv("FUTU_HOST", "127.0.0.1")
FUTU_PORT: int = int(os.getenv("FUTU_PORT", "11111"))

SUPABASE_URL: str = os.getenv(
    "SUPABASE_URL", "https://vffizmkzwfxpewtfoerm.supabase.co"
)
SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")

EARNINGS_WARN_DAYS: int = 14  # flag as warning if earnings within this window

# 25-ticker SwingPulse universe
_TICKERS: list[str] = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA",
    "JPM", "V", "MA", "UNH", "JNJ", "XOM", "CVX", "BAC",
    "HD", "NFLX", "DIS", "COST", "WMT", "LLY", "AVGO", "AMD", "CRM", "ADBE",
]
FUTU_TICKERS: list[str] = [f"US.{t}" for t in _TICKERS]


# ── moomoo data fetch ─────────────────────────────────────────────────────────

def fetch_moomoo_snapshot() -> dict[str, dict]:
    """Fetches market snapshot from FutuOpenD and returns enrichment data.

    Opens an OpenQuoteContext, calls get_market_snapshot for all 25 tickers,
    and extracts short_interest and earnings_date/earnings_warning.

    Returns:
        Dict mapping bare ticker symbol (e.g. "AAPL") to a dict with keys:
            short_interest (float | None): Short sell ratio as percentage 0–100.
            earnings_date (str | None): Next earnings date in "YYYY-MM-DD" form.
            earnings_warning (bool): True if earnings fall within EARNINGS_WARN_DAYS.
    """
    results: dict[str, dict] = {}

    logger.info("Connecting to FutuOpenD at %s:%d …", FUTU_HOST, FUTU_PORT)
    quote_ctx = ft.OpenQuoteContext(host=FUTU_HOST, port=FUTU_PORT)

    try:
        ret_code, data = quote_ctx.get_market_snapshot(FUTU_TICKERS)
        if ret_code != ft.RET_OK:
            logger.error("get_market_snapshot failed (code %s): %s", ret_code, data)
            return results

        now = datetime.now(timezone.utc)
        warn_cutoff = now + timedelta(days=EARNINGS_WARN_DAYS)

        for _, row in data.iterrows():
            code: str = row["code"]          # e.g. "US.AAPL"
            ticker = code.split(".", 1)[1]   # e.g. "AAPL"

            # ── Short interest ────────────────────────────────────────────────
            raw_ratio = row.get("short_sell_ratio", None)
            short_interest: float | None = None
            if raw_ratio is not None and str(raw_ratio) not in ("None", "nan", "--"):
                try:
                    short_interest = round(float(raw_ratio) * 100, 2)
                except (TypeError, ValueError):
                    logger.warning("%s: could not parse short_sell_ratio=%r", ticker, raw_ratio)

            # ── Earnings date ─────────────────────────────────────────────────
            earn_raw = row.get("earn_time", None)
            earnings_date: str | None = None
            earnings_warning: bool = False

            if earn_raw is not None and str(earn_raw) not in ("None", "nan", "NaT", "--"):
                try:
                    earn_dt = datetime.fromisoformat(str(earn_raw).replace(" ", "T"))
                    if earn_dt.tzinfo is None:
                        earn_dt = earn_dt.replace(tzinfo=timezone.utc)
                    earnings_date = earn_dt.strftime("%Y-%m-%d")
                    if now <= earn_dt <= warn_cutoff:
                        earnings_warning = True
                except (ValueError, TypeError):
                    logger.warning("%s: could not parse earn_time=%r", ticker, earn_raw)

            results[ticker] = {
                "short_interest": short_interest,
                "earnings_date": earnings_date,
                "earnings_warning": earnings_warning,
            }

            logger.info(
                "%-6s  short=%-8s  earn=%-12s  warn=%s",
                ticker,
                f"{short_interest:.2f}%" if short_interest is not None else "N/A",
                earnings_date or "—",
                earnings_warning,
            )

    finally:
        quote_ctx.close()
        logger.info("FutuOpenD connection closed.")

    return results


# ── Supabase patch ────────────────────────────────────────────────────────────

def patch_supabase(enrichment: dict[str, dict]) -> None:
    """PATCHes the Supabase stocks table with moomoo enrichment data.

    Args:
        enrichment: Mapping returned by fetch_moomoo_snapshot().
    """
    if not SUPABASE_SERVICE_KEY:
        logger.error(
            "SUPABASE_SERVICE_KEY is not set in .env — cannot write to Supabase."
        )
        return

    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    success = 0
    fail = 0

    for ticker, payload in enrichment.items():
        try:
            update_data: dict = {
                "earnings_warning": payload["earnings_warning"],
            }
            if payload["short_interest"] is not None:
                update_data["short_interest"] = payload["short_interest"]
            if payload["earnings_date"] is not None:
                update_data["earnings_date"] = payload["earnings_date"]

            client.table("stocks").update(update_data).eq("ticker", ticker).execute()
            success += 1

        except Exception as exc:
            logger.error("Failed to patch ticker %s: %s", ticker, exc)
            fail += 1

    logger.info(
        "Supabase patch complete — %d updated, %d failed", success, fail
    )


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    logger.info("=== enrich_moomoo.py starting ===")

    enrichment = fetch_moomoo_snapshot()
    if not enrichment:
        logger.warning("No enrichment data returned from moomoo — skipping Supabase patch.")
        return

    patch_supabase(enrichment)
    logger.info("=== enrich_moomoo.py complete ===")


if __name__ == "__main__":
    main()
