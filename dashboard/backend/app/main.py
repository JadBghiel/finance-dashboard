from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import category, income, expense, account, settings, investments, watchlist, portfolio
from sqlalchemy import text
from app.core.database import engine, Base  # added Base
import os

# import models so metadata knows about investments/watchlist before create_all
from app.models import account as _m_account  # noqa: F401
from app.models import income as _m_income   # noqa: F401
from app.models import expense as _m_expense # noqa: F401
from app.models import investment as _m_investment  # noqa: F401
from app.models import watchlist as _m_watchlist    # noqa: F401

app = FastAPI(
    title="Personal Finance Dashboard API",
    description="API for tracking income, expenses, savings, and investments",
    version="0.1.0",
)

# CORS configuration
_default_origins = [
    "http://localhost:3000",
]

origins = os.getenv("FRONTEND_ORIGINS", "").split(",") if os.getenv("FRONTEND_ORIGINS") else _default_origins
origins = [o.strip() for o in origins if o.strip()]  # remove empty and whitespace-only origins

if len(origins) == 0:
    # no FRONTEND_ORIGINS configured (possible on deployment) -> fallback
    origins = _default_origins
    if os.getenv("VERCEL") or os.getenv("NODE_ENV") == "production":
        origins = ["*"]

allow_credentials_flag = False if origins == ["*"] else True
print(f"[startup] Resolved FRONTEND_ORIGINS -> {origins}, allow_credentials={allow_credentials_flag}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials_flag,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ensure emoji columns exist in DB at startup (safe: ALTER TABLE ADD COLUMN is no-op if column exists will raise -> caught)
def _ensure_emoji_columns():
    try:
        with engine.connect() as conn:
            # only ensure accounts emoji column (categories emoji removed)
            try:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN emoji VARCHAR"))
            except Exception:
                pass
    except Exception:
        # best-effort only; don't break startup if engine not available
        pass


@app.on_event("startup")
def _on_startup():
    # ensure core tables exist (including new investments/watchlist)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    _ensure_emoji_columns()

# by using include_router this way, FastAPI handles the trailing slash automatically
app.include_router(category.router, prefix="/api", tags=["Categories"])
app.include_router(income.router, prefix="/api", tags=["Incomes"])
app.include_router(expense.router, prefix="/api", tags=["Expenses"])
app.include_router(account.router, prefix="/api", tags=["Accounts"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])
app.include_router(investments.router, prefix="/api", tags=["Investments"])
app.include_router(watchlist.router, prefix="/api", tags=["Watchlist"])
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio"])