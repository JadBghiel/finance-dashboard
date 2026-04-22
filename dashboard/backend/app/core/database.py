import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

def _resolve_database_url() -> tuple[str, str]:
    # prefer explicit project vars first, then common Vercel Postgres vars
    candidates = [
        "STORAGE_DATABASE_URL",
        "DATABASE_URL",
        "POSTGRES_URL",
        "POSTGRES_URL_NON_POOLING",
        "POSTGRES_PRISMA_URL",
        "NEON_DATABASE_URL",
    ]
    for key in candidates:
        val = os.getenv(key)
        if val:
            return val, key
    return "sqlite:///./finance.db", "sqlite-default"


DATABASE_URL, DATABASE_SOURCE = _resolve_database_url()

# debug: log which db we're connecting to
print(
    f"[database] DATABASE_URL source: {DATABASE_SOURCE} | "
    f"mode: {'postgres' if 'postgres' in DATABASE_URL else 'sqlite'}"
)

# neon uses postgres:// but sqlalchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# detect if using postgres or sqlite
is_postgres = DATABASE_URL.startswith("postgresql://")

# on Vercel, never silently run on empty local sqlite if db env vars are missing
is_vercel_runtime = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
if is_vercel_runtime and not is_postgres:
    raise RuntimeError(
        "No Postgres database URL found in Vercel environment. "
        "Set STORAGE_DATABASE_URL (or DATABASE_URL/POSTGRES_URL) in backend project env vars."
    )

print(f"[database] Connecting to: {'Postgres (Neon)' if is_postgres else 'SQLite (local)'}")

# configure engine based on database type
if is_postgres:
    # postgres config (for Neon/Vercel)
    engine = create_engine(
        DATABASE_URL,
        future=True,
        poolclass=NullPool,
        echo=False,
    )
else:
    # sqlite config (for local dev)
    engine = create_engine(
        DATABASE_URL,
        future=True,
        connect_args={"check_same_thread": False},
        poolclass=NullPool,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()