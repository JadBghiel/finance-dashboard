from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Expense(Base):
    """SQLAlchemy model for expense transactions."""
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String, nullable=False, default="USD")
    description = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    category_id = Column(Integer, ForeignKey("categories.id"))
    category = relationship("Category")