from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    """Database model for a category (e.g., Salary, Groceries)."""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False) # 'income' or 'expense'

    # --- ADD THESE TWO RELATIONSHIP LINES ---
    # This tells the Category model that it can be linked to many incomes and expenses.
    incomes = relationship("Income", back_populates="category")
    expenses = relationship("Expense", back_populates="category")