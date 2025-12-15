from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class Investment(Base):
    __tablename__ = "investments"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, nullable=False, index=True)
    name = Column(String, nullable=True)
    type = Column(String, nullable=False)  # stock|etf|crypto|mutual_fund
    quantity = Column(Numeric(20, 6), nullable=False, default=0)
    purchase_price = Column(Numeric(20, 6), nullable=False, default=0)
    purchase_date = Column(DateTime, nullable=False)
    current_price = Column(Numeric(20, 6), nullable=True)
    currency = Column(String, nullable=False, default="USD")
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    notes = Column(Text, nullable=True)

    account = relationship("Account", back_populates="investments")
