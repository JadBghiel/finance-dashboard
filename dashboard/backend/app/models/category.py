from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Category(Base):
    """
    SQLAlchemy model for categories
    A category can be for income, expense, etc.
    """
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    type = Column(String, nullable=False)  # "income", "expense", "investment"