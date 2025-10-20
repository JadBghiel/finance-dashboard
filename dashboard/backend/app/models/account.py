from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Account(Base):
    """Database model for an account (e.g., Main, Savings)."""
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, unique=True, nullable=False)

    incomes = relationship("Income", back_populates="account", lazy="joined")
    expenses = relationship("Expense", back_populates="account", lazy="joined")