from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Account(Base):
    """db model for an account (main, savings etc)"""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True, nullable=False)
    emoji = Column(String, nullable=True)  # persisted emoji for account (optional)

    # relationships
    incomes = relationship("Income", back_populates="account")
    expenses = relationship("Expense", back_populates="account")