import os
import json
import time
from datetime import datetime, timezone
import requests

CACHE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".exchange_cache.json"))
DAILY_LIMIT = 30  # daily limit is 50 but to be safe
MONTHLY_LIMIT = 1400  # total allowed per month

def _load_cache():
    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        # init usage with both day and month counters
        return {"rates": {}, "usage": {"date": None, "count": 0, "month": None, "month_count": 0}}

def _save_cache(data):
    try:
        with open(CACHE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f)
    except Exception:
        pass

def _usage_ok(cache):
    """
    ensure we haven't exceeded DAILY_LIMIT or MONTHLY_LIMIT
    reset daily/monthly counters when a new day or month starts
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month = datetime.now(timezone.utc).strftime("%Y-%m")

    u = cache.get("usage", {})
    # init keys if missing
    if "date" not in u or "count" not in u or "month" not in u or "month_count" not in u:
        cache["usage"] = {"date": today, "count": 0, "month": month, "month_count": 0}
        _save_cache(cache)
        return True

    # month rolled over -> reset both day and month counters
    if u.get("month") != month:
        cache["usage"]["month"] = month
        cache["usage"]["month_count"] = 0
        cache["usage"]["date"] = today
        cache["usage"]["count"] = 0
        _save_cache(cache)
        return True

    # day rolled over -> reset daily counter only
    if u.get("date") != today:
        cache["usage"]["date"] = today
        cache["usage"]["count"] = 0
        _save_cache(cache)
        return True

    # enforce both daily and monthly limits
    day_ok = u.get("count", 0) < DAILY_LIMIT
    month_ok = u.get("month_count", 0) < MONTHLY_LIMIT
    return day_ok and month_ok

def _inc_usage(cache):
    """
    Increment daily and monthly counters and persist cache.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    month = datetime.now(timezone.utc).strftime("%Y-%m")

    if "usage" not in cache:
        cache["usage"] = {"date": today, "count": 0, "month": month, "month_count": 0}

    # rollovers ic
    if cache["usage"].get("month") != month:
        cache["usage"]["month"] = month
        cache["usage"]["month_count"] = 0
        cache["usage"]["date"] = today
        cache["usage"]["count"] = 0

    if cache["usage"].get("date") != today:
        cache["usage"]["date"] = today
        cache["usage"]["count"] = 0

    # ++
    cache["usage"]["count"] = cache["usage"].get("count", 0) + 1
    cache["usage"]["month_count"] = cache["usage"].get("month_count", 0) + 1

    # persist
    _save_cache(cache)

def get_rate(from_currency: str, to_currency: str) -> float | None:
    """
    return conv rate (multiply amount_in_from * rate -> amount_in_to)
    caches rates for 24h and enforces daily and monthly call limits

    scenarios when limit reached or external call fails:
      - if cached rate exists (even if outdated) -> will be returned
      - if no cached rate exists and cannot fetch returns none
    """
    from_currency = from_currency.upper()
    to_currency = to_currency.upper()
    key = f"{from_currency}_{to_currency}"

    cache = _load_cache()
    entry = cache.get("rates", {}).get(key)
    now_ts = int(time.time())

    # return fresh cached rate if <24h
    if entry and (now_ts - entry.get("ts", 0) < 24 * 3600):
        return entry.get("rate")

    # if daily/monthly limit reached, prioritize last cached value even if outdated
    if not _usage_ok(cache):
        if entry:
            return entry.get("rate")
        return None

    # try provider using configured key from exchangerate-API)
    api_key = os.getenv("EXCHANGERATE_API_KEY")
    rate = None
    try:
        if api_key:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/pair/{from_currency}/{to_currency}"
            r = requests.get(url, timeout=5)
            if r.status_code == 200:
                data = r.json()
                # api returns conversion_rate
                rate = data.get("conversion_rate") or data.get("rate")
        if rate is None:
            # if no key, fallback to exchangerate.host
            url2 = f"https://api.exchangerate.host/convert?from={from_currency}&to={to_currency}"
            r2 = requests.get(url2, timeout=5)
            if r2.status_code == 200:
                data2 = r2.json()
                rate = data2.get("info", {}).get("rate") or data2.get("result")
    except Exception:
        rate = None

    if rate is not None:
        # store in cache and ++ the usage (both daily n monthly)
        cache.setdefault("rates", {})[key] = {"rate": float(rate), "ts": now_ts}
        _inc_usage(cache)
        # ensure cache (rates + usage) is saved
        _save_cache(cache)
        return float(rate)

    # external call failed -> return last cached if available
    if entry:
        return entry.get("rate")

    return None