from __future__ import annotations

import json
import math
from datetime import datetime, timedelta, timezone
from typing import List, Tuple
from urllib import error, parse, request

YAHOO_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"

MARKET_UNIVERSE = [
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "sector": "Semiconductors"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "sector": "Communication Services"},
]


class MarketDataError(Exception):
    """Raised when a remote market data provider fails."""


def fetch_market_series(symbol: str, interval: str, range_: str) -> Tuple[str | None, List[dict]]:
    """Attempt Yahoo! Finance first, fall back to deterministic synthetic data."""
    try:
        return _fetch_from_yahoo(symbol, interval, range_)
    except MarketDataError:
        return "USD", _synthetic_series(symbol)


def _fetch_from_yahoo(symbol: str, interval: str, range_: str) -> Tuple[str | None, List[dict]]:
    params = parse.urlencode({"interval": interval, "range": range_})
    encoded_symbol = parse.quote(symbol.upper())
    url = f"{YAHOO_ENDPOINT.format(symbol=encoded_symbol)}?{params}"
    try:
        with request.urlopen(url, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except error.URLError as exc:
        raise MarketDataError(str(exc)) from exc

    try:
        result = payload["chart"]["result"][0]
        timestamps = result.get("timestamp") or []
        closes = result["indicators"]["quote"][0]["close"]
    except (KeyError, IndexError, TypeError) as exc:
        raise MarketDataError("Malformed response") from exc

    points: List[dict] = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        points.append({"timestamp": dt, "close": float(close)})

    if not points:
        raise MarketDataError("Empty price series")

    currency = result.get("meta", {}).get("currency")
    return currency, points


def _synthetic_series(symbol: str, length: int = 30) -> List[dict]:
    """Deterministic pseudo-random walk for offline/test mode."""
    now = datetime.now(tz=timezone.utc)
    baseline = (abs(hash(symbol.upper())) % 5000) / 50 + 20
    points: List[dict] = []
    for idx in range(length):
        ts = now - timedelta(days=length - idx)
        drift = idx * 0.4
        seasonal = math.sin(idx / 3) * 2.5
        price = round(baseline + drift + seasonal, 2)
        points.append({"timestamp": ts, "close": price})
    return points
