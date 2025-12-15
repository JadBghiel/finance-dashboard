import time
from typing import Dict, List, Optional
import requests
import yfinance as yf

# simple in-memory caches (process-local)
_price_cache: Dict[str, Dict[str, float]] = {}  # {symbol: {"ts": epoch, "price": value}}
_search_cache: Dict[str, Dict] = {}             # {query: {"ts": epoch, "items": [...]}}
PRICE_TTL = 300     # 5 min
SEARCH_TTL = 600    # 10 min

def _now() -> float:
    return time.time()

def get_last_price(symbol: str) -> Optional[float]:
    s = symbol.strip().upper()
    if not s:
        return None
    c = _price_cache.get(s)
    if c and (_now() - c.get("ts", 0) < PRICE_TTL):
        return c.get("price")

    price = None
    try:
        t = yf.Ticker(s)
        fi = getattr(t, "fast_info", None)
        if fi:
            price = fi.get("last_price") or fi.get("last_close") or fi.get("previous_close")
        if price is None:
            hist = t.history(period="1d")
            if not hist.empty:
                price = float(hist["Close"].iloc[-1])
    except Exception:
        price = None

    if price is not None:
        _price_cache[s] = {"ts": _now(), "price": float(price)}
        return float(price)
    return None

def batch_get_last_prices(symbols: List[str]) -> Dict[str, Optional[float]]:
    # try cache first
    out: Dict[str, Optional[float]] = {}
    fresh: List[str] = []
    now = _now()
    for s in symbols:
        key = s.strip().upper()
        cached = _price_cache.get(key)
        if cached and (now - cached.get("ts", 0) < PRICE_TTL):
            out[key] = cached.get("price")
        else:
            fresh.append(key)

    if fresh:
        # yfinance Tickers aggregator
        joined = " ".join(fresh)
        try:
            tk = yf.Tickers(joined)
            for sym in fresh:
                price = None
                try:
                    ti = tk.tickers.get(sym)
                    if ti:
                        fi = getattr(ti, "fast_info", None)
                        if fi:
                            price = fi.get("last_price") or fi.get("last_close") or fi.get("previous_close")
                        if price is None:
                            hist = ti.history(period="1d")
                            if not hist.empty:
                                price = float(hist["Close"].iloc[-1])
                except Exception:
                    price = None
                if price is not None:
                    _price_cache[sym] = {"ts": now, "price": float(price)}
                out[sym] = float(price) if price is not None else None
        except Exception:
            # fallback to single calls
            for sym in fresh:
                out[sym] = get_last_price(sym)

    # ensure all requested appear
    for s in symbols:
        key = s.strip().upper()
        if key not in out:
            out[key] = None
    return out

def search_symbols(query: str) -> List[Dict]:
    """
    Proxy Yahoo Finance search API to avoid CORS.
    Returns up to ~10 items: {symbol, name, typeDisp, exchDisp}
    """
    q = (query or "").strip()
    if not q:
        return []
    c = _search_cache.get(q)
    if c and (_now() - c.get("ts", 0) < SEARCH_TTL):
        return c.get("items", [])

    url = "https://query1.finance.yahoo.com/v1/finance/search"
    try:
        r = requests.get(url, params={"q": q, "lang": "en-US", "region": "US"}, timeout=5)
        if r.status_code == 200:
            data = r.json()
            quotes = data.get("quotes", []) or []
            items = []
            for it in quotes[:10]:
                items.append({
                    "symbol": it.get("symbol"),
                    "name": it.get("shortname") or it.get("longname") or it.get("quoteType"),
                    "type": it.get("typeDisp") or it.get("quoteType"),
                    "exchange": it.get("exchDisp") or it.get("exchangeDisplay")
                })
            _search_cache[q] = {"ts": _now(), "items": items}
            return items
    except Exception:
        pass
    return []
