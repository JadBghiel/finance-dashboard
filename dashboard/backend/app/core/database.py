from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import DATABASE_URL
from sqlalchemy.pool import NullPool

#  disable the
# same-thread check and avoid persistent pools which can cause locking in uvicorn multhreding
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