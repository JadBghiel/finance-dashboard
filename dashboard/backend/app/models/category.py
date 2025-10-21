from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Category(Base):
    """db model for a category (salary, side hustl etc)"""
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False)

    incomes = relationship("Income", back_populates="category")
    expenses = relationship("Expense", back_populates="category")