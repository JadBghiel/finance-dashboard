from sqlalchemy import Column, Integer, String, Numeric, Text
from app.core.database import Base

class WatchlistItem(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    type = Column(String, nullable=False)  # stock|etf|crypto|mutual_fund
    target_price = Column(Numeric(20, 6), nullable=True)
    notes = Column(Text, nullable=True)
