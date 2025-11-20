from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import category, income, expense, account, settings
from sqlalchemy import text
from app.core.database import engine

app = FastAPI(
    title="Personal Finance Dashboard API",
    description="API for tracking income, expenses, savings, and investments",
    version="0.1.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
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
    _ensure_emoji_columns()

# by using include_router this way, FastAPI handles the trailing slash automatically
app.include_router(category.router, prefix="/api", tags=["Categories"])
app.include_router(income.router, prefix="/api", tags=["Incomes"])
app.include_router(expense.router, prefix="/api", tags=["Expenses"])
app.include_router(account.router, prefix="/api", tags=["Accounts"])
app.include_router(settings.router, prefix="/api", tags=["Settings"])


@app.get("/", tags=["Root"])
def read_root():
    """welcome, this confirms the API is running"""
    return {"message": "Welcome to the personal finance dashboard API"}