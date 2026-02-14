import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

# get database url from environment (Neon Postgres on Vercel, SQLite locally)
# try STORAGE_DATABASE_URL first (Vercel Neon prefix), then DATABASE_URL, then fallback to sqlite
DATABASE_URL = os.getenv("STORAGE_DATABASE_URL") or os.getenv("DATABASE_URL", "sqlite:///./finance.db")

# debug: log which db we're connecting to
print(f"[database] DATABASE_URL env: {'SET (postgres)' if 'postgres' in DATABASE_URL else 'NOT SET (using sqlite)'}")

# neon uses postgres:// but sqlalchemy needs postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# detect if using postgres or sqlite
is_postgres = DATABASE_URL.startswith("postgresql://")

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