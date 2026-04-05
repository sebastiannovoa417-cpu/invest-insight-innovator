"""
conftest.py — mock heavy network deps so pure math functions can be imported
and tested without a working yfinance / dotenv / tenacity install.
"""
import os
import sys
from unittest.mock import MagicMock

# Set required env vars before fetch_and_score is imported (they're read at
# module level and would raise KeyError without this).
os.environ.setdefault("SUPABASE_SYNC_URL", "https://test.example.com/functions/v1/sync-ingest")
os.environ.setdefault("SYNC_API_KEY", "test-key")

# These modules are imported at the top of fetch_and_score.py but are NOT
# needed by the pure indicator functions (rsi, atr, macd, sma).
# Mocking them here lets pytest collect and run the tests in environments
# where the full pipeline stack cannot be installed (e.g. CI without internet).
for mod in ["yfinance", "dotenv", "tenacity", "requests", "psycopg2"]:
    if mod not in sys.modules:
        sys.modules[mod] = MagicMock()

# tenacity decorators must return the wrapped function unchanged
tenacity_mock = sys.modules["tenacity"]
tenacity_mock.retry.return_value = lambda f: f
tenacity_mock.stop_after_attempt.return_value = None
tenacity_mock.wait_exponential.return_value = None
tenacity_mock.before_sleep_log.return_value = None

# dotenv.load_dotenv must be a no-op callable
sys.modules["dotenv"].load_dotenv = lambda: None
