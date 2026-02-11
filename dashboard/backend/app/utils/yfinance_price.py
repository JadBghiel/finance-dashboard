import os
import json
import time
from datetime import datetime, timezone
from typing import Optional, Dict, List

# local json cache file for price data
CACHE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".yfinance_cache.json"))
CACHE_TTL = 86400  # 24 hours (fetch once per day)
MIN_REQUEST_DELAY = 0.2  # 200ms minimum between requests (rate limiting)

def _load_price_cache() -> Dict:
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"prices": {}, "last_request_time": 0}

def _save_price_cache(data: Dict):
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception:
        pass

def get_price(symbol: str) -> Optional[float]:
    """
    Fetch current price for a symbol using yfinance.
    Uses local cache with 5-minute TTL.
    Implements rate-limiting (200ms delay between requests).
    Returns price as float or None if unavailable.
    """
    symbol = symbol.upper()
    cache = _load_price_cache()
    now_ts = int(time.time())

    # check cache validity
    if symbol in cache["prices"]:
        entry = cache["prices"][symbol]
        if now_ts - entry.get("ts", 0) < CACHE_TTL:
            return entry.get("price")

    # rate limiting: enforce minimum delay between API requests
    last_req = cache.get("last_request_time", 0)
    time_since = time.time() - last_req
    if time_since < MIN_REQUEST_DELAY:
        time.sleep(MIN_REQUEST_DELAY - time_since)

    # fetch price from yfinance
    price = None
    try:
        import yfinance as yf
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if not data.empty:
            price = float(data["Close"].iloc[-1])
    except Exception as e:
        # yfinance may fail or not be installed; log and continue
        print(f"Failed to fetch price for {symbol}: {e}")
        price = None

    # update cache and record request time
    cache["prices"][symbol] = {"price": price, "ts": now_ts}
    cache["last_request_time"] = time.time()
    _save_price_cache(cache)

    return price

def get_prices_batch(symbols: List[str]) -> Dict[str, Optional[float]]:
    """
    Fetch prices for multiple symbols.
    Applies delays between individual requests to respect rate limits.
    Returns dict of {symbol: price}.
    """
    result = {}
    for sym in symbols:
        result[sym] = get_price(sym)
        time.sleep(0.2)  # delay between requests
    return result
