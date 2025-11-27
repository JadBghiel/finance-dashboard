from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import category, income, expense, account, settings
from sqlalchemy import text
from app.core.database import engine
import os
from typing import List

app = FastAPI(
    title="Personal Finance Dashboard API",
    description="API for tracking income, expenses, savings, and investments",
    version="0.1.0",
)

# CORS configuration
# Default for local development; in production set FRONTEND_ORIGINS env var (comma-separated)
_default_origins: List[str] = ["http://localhost:3000"]
_env_origins = os.getenv("FRONTEND_ORIGINS", "").strip()

if _env_origins:
    # allow passing "*" to allow all origins, or a comma-separated list of allowed origins
    if _env_origins == "*":
        origins = ["*"]
    else:
        origins = [o.strip() for o in _env_origins.split(",") if o.strip()]
else:
    origins = _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ensure emoji columns exist in DB at startup (best-effort; don't break startup if engine not available)
def _ensure_emoji_columns():
    try:
        with engine.connect() as conn:
            # only ensure accounts emoji column (categories emoji removed)
            try:
                conn.execute(text("ALTER TABLE accounts ADD COLUMN emoji VARCHAR"))
            except Exception:
                # column exists or other ALTER error; ignore on best-effort basis
                pass
    except Exception:
        # best-effort only; don't break startup if engine not available
        pass


@app.on_event("startup")
def _on_startup():
    _ensure_emoji_columns()


# by using include_router this way, FastAPI handles the trailing slash automatically
app.include_router(category.router, prefix="/api", tags=["Categories"])
app.include_router(income.router, prefix="/api", tags=["Incomes"])
app.include_router(expense.router, prefix="/api", tags=["Expenses"])
app.include_router(account.router, prefix="/api", tags=["Accounts"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])


@app.get("/", tags=["Root"])
@app.get("/api/", tags=["Root"])
def read_root():
    """welcome, this confirms the API is running"""
    return {"message": "Welcome to the personal finance dashboard API"}

# temporary debug endpoint — remove after debugging
from fastapi import Request

@app.get("/api/_debug/cors")
def _debug_cors(request: Request):
    env = os.getenv("FRONTEND_ORIGINS", "")
    if env.strip() == "*":
        allowed = ["*"]
    elif env.strip() == "":
        allowed = ["http://localhost:3000"]
    else:
        allowed = [o.strip() for o in env.split(",") if o.strip()]
    return {
        "FRONTEND_ORIGINS_env": env,
        "allowed_parsed_list": allowed,
        "request_origin_header": request.headers.get("origin"),
    }