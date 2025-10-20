from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    """Database model for a category (e.g., Salary, Groceries)."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # income or expense

    incomes = relationship("Income", back_populates="category", lazy="joined")
    expenses = relationship("Expense", back_populates="category", lazy="joined")