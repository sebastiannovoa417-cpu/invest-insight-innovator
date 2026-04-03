"""
Unit tests for technical indicator functions in fetch_and_score.py.

Tests use synthetic pandas Series with known values so results can be
verified analytically without network or file I/O.
"""

import math
import sys
import os

import numpy as np
import pandas as pd
import pytest

# Allow importing from the pipeline directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fetch_and_score import rsi, atr, macd, sma


# ── sma ────────────────────────────────────────────────────────────────────────────────


class TestSma:
    def test_exact_period(self):
        """SMA of [1,2,3] with period 3 should be 2.0."""
        s = pd.Series([1.0, 2.0, 3.0])
        assert sma(s, 3) == pytest.approx(2.0)

    def test_longer_series(self):
        """SMA of [1,2,3,4,5] with period 3 should use last 3 values."""
        s = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
        # last 3 values: 3,4,5 → mean = 4.0
        assert sma(s, 3) == pytest.approx(4.0)

    def test_fallback_when_shorter_than_period(self):
        """When series is shorter than period, falls back to expanding mean."""
        s = pd.Series([10.0, 20.0])
        # expanding mean of [10,20] = 15.0
        assert sma(s, 200) == pytest.approx(15.0)

    def test_single_element(self):
        """Single-element series returns that element."""
        s = pd.Series([42.0])
        assert sma(s, 200) == pytest.approx(42.0)

    def test_constant_series(self):
        """SMA of a constant series equals the constant."""
        s = pd.Series([5.0] * 50)
        assert sma(s, 20) == pytest.approx(5.0)


# ── rsi ────────────────────────────────────────────────────────────────────────────────


class TestRsi:
    def test_all_up_approaches_100(self):
        """A series that only goes up produces RSI close to 100."""
        s = pd.Series(range(1, 51, 1), dtype=float)
        result = rsi(s, period=14)
        assert result == pytest.approx(100.0)

    def test_all_down_approaches_0(self):
        """A series that only goes down produces RSI close to 0."""
        s = pd.Series(range(50, 0, -1), dtype=float)
        result = rsi(s, period=14)
        assert result == pytest.approx(0.0, abs=5.0)

    def test_flat_series_returns_50(self):
        """A completely flat series has no gains or losses, falls back to 50."""
        s = pd.Series([100.0] * 30)
        result = rsi(s, period=14)
        assert isinstance(result, float)

    def test_return_type_is_float(self):
        """Result is always a Python float."""
        s = pd.Series([100.0 + i * 0.5 for i in range(30)])
        result = rsi(s, period=14)
        assert isinstance(result, float)

    def test_not_nan(self):
        """Result is never NaN for a well-formed series."""
        s = pd.Series([100.0 - i if i % 3 else 100.0 + i for i in range(40)])
        result = rsi(s, period=14)
        assert not math.isnan(result)

    def test_range_0_to_100(self):
        """RSI result is bounded between 0 and 100."""
        rng = np.random.default_rng(42)
        prices = pd.Series(100 + rng.normal(0, 2, 60).cumsum())
        result = rsi(prices, period=14)
        assert 0.0 <= result <= 100.0


# ── atr ────────────────────────────────────────────────────────────────────────────────


class TestAtr:
    def _make_ohlcv(self, n: int, high_offset: float = 1.0, low_offset: float = 1.0):
        """Generate synthetic OHLCV: close=100, high=close+high_offset, low=close-low_offset."""
        close = pd.Series([100.0] * n)
        high  = close + high_offset
        low   = close - low_offset
        return high, low, close

    def test_constant_range(self):
        """When H-L is constant, ATR ≈ that constant range."""
        high, low, close = self._make_ohlcv(30, high_offset=2.0, low_offset=2.0)
        result = atr(high, low, close, period=14)
        assert result == pytest.approx(4.0, rel=0.05)

    def test_positive_result(self):
        """ATR is always positive."""
        rng = np.random.default_rng(7)
        base = 100 + rng.normal(0, 1, 40).cumsum()
        close = pd.Series(base)
        high  = close + abs(pd.Series(rng.normal(0, 0.5, 40)))
        low   = close - abs(pd.Series(rng.normal(0, 0.5, 40)))
        result = atr(high, low, close, period=14)
        assert result > 0.0

    def test_not_nan(self):
        """ATR is not NaN for a valid series."""
        high, low, close = self._make_ohlcv(30)
        result = atr(high, low, close, period=14)
        assert not math.isnan(result)

    def test_return_type(self):
        high, low, close = self._make_ohlcv(30)
        result = atr(high, low, close, period=14)
        assert isinstance(result, float)


# ── macd ────────────────────────────────────────────────────────────────────────────────


class TestMacd:
    def test_returns_tuple_of_two_floats(self):
        """macd() returns a (macd_line, signal_line) tuple of floats."""
        s = pd.Series([100.0 + i * 0.3 for i in range(50)])
        result = macd(s)
        assert isinstance(result, tuple)
        assert len(result) == 2
        assert all(isinstance(v, float) for v in result)

    def test_uptrend_positive_macd(self):
        """A consistent uptrend should produce a positive MACD line."""
        s = pd.Series([float(i) for i in range(1, 51)])
        macd_line, _ = macd(s)
        assert macd_line > 0

    def test_downtrend_negative_macd(self):
        """A consistent downtrend should produce a negative MACD line."""
        s = pd.Series([float(50 - i) for i in range(50)])
        macd_line, _ = macd(s)
        assert macd_line < 0

    def test_not_nan(self):
        """MACD values should not be NaN for a valid series."""
        s = pd.Series([100.0 + i * 0.1 for i in range(60)])
        macd_line, signal_line = macd(s)
        assert not math.isnan(macd_line)
        assert not math.isnan(signal_line)

    def test_flat_series_zero_macd(self):
        """A completely flat series should produce MACD ≈ 0."""
        s = pd.Series([100.0] * 60)
        macd_line, signal_line = macd(s)
        assert macd_line == pytest.approx(0.0, abs=1e-9)
        assert signal_line == pytest.approx(0.0, abs=1e-9)
