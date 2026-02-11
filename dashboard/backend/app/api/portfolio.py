from typing import Dict, List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from decimal import Decimal
from app.core.database import get_db
from app.models.investment import Investment as InvestmentModel
from app.utils.market import batch_get_last_prices, search_symbols
import os
import csv
from functools import lru_cache

router = APIRouter()

@router.get("/portfolio/summary/")
def portfolio_summary(db: Session = Depends(get_db)):
    rows: List[InvestmentModel] = db.query(InvestmentModel).all()
    total_value = Decimal("0")
    total_invested = Decimal("0")
    alloc: Dict[str, Decimal] = {}

    for r in rows:
        qty = Decimal(str(r.quantity or 0))
        pp = Decimal(str(r.purchase_price or 0))
        cp = Decimal(str(r.current_price if r.current_price is not None else r.purchase_price or 0))
        v = (cp * qty)
        i = (pp * qty)
        total_value += v
        total_invested += i
        key = (r.type or "unknown").lower()
        alloc[key] = alloc.get(key, Decimal("0")) + v

    pnl = total_value - total_invested
    pnl_pct = float((pnl / total_invested * 100)) if total_invested > 0 else 0.0

    return {
        "total_value": float(total_value),
        "total_invested": float(total_invested),
        "cash_position": 0.0,  # can be wired to account types if available
        "total_pnl": float(pnl),
        "pnl_percentage": float(pnl_pct),
        "allocation": {k: float(v) for k, v in alloc.items()},
    }

@router.post("/portfolio/refresh-prices/")
def portfolio_refresh_prices(force: bool = False, db: Session = Depends(get_db)):
    rows: List[InvestmentModel] = db.query(InvestmentModel).all()
    symbols = sorted({(r.symbol or "").upper() for r in rows if r.symbol})
    if not symbols:
        return {"updated": 0}

    prices = batch_get_last_prices(symbols, force_refresh=force)
    updated = 0
    for r in rows:
        s = (r.symbol or "").upper()
        p = prices.get(s)
        if p is not None:
            r.current_price = Decimal(str(p))
            updated += 1
    db.commit()
    return {"updated": updated}

# csv ticker search (tickers.csv at repo root)
CSV_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "tickers.csv"))

@lru_cache(maxsize=1)
def _load_tickers() -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    try:
        with open(CSV_PATH, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row or len(row) < 2:
                    continue
                symbol = (row[0] or "").strip().upper()
                raw_cat = (row[1] or "").strip().lower()
                # normalize category to match frontend types
                if raw_cat in ("etf", "etfs"):
                    norm_cat = "etf"
                elif raw_cat in ("mutual_fund", "mutual_funds"):
                    norm_cat = "mutual_fund"
                elif raw_cat in ("crypto", "stock", "bond"):
                    norm_cat = raw_cat
                else:
                    norm_cat = raw_cat  # fallback
                if symbol and norm_cat:
                    items.append({"symbol": symbol, "category": norm_cat})
    except Exception:
        items = []
    return items

@router.get("/markets/tickers/")
def market_tickers(q: str = Query("", min_length=1, description="search query"), category: Optional[str] = None):
    data = _load_tickers()
    if not q:
        return {"items": []}
    query = q.strip().upper()
    cat = category.strip().lower() if category else None
    out = []
    for it in data:
        if cat and it.get("category") != cat:
            continue
        if query in (it.get("symbol") or ""):
            out.append(it)
        if len(out) >= 20:
            break
    return {"items": out}
