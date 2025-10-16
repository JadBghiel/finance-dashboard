from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from .category import Category  # Import for nested response

class IncomeBase(BaseModel):
    """Base schema for income data."""
    amount: Decimal
    currency: str
    description: str | None = None
    date: datetime
    category_id: int

class IncomeCreate(IncomeBase):
    """Schema for creating a new income transaction."""
    pass

class IncomeUpdate(IncomeBase):
    """Schema for updating an income transaction."""
    pass

class Income(IncomeBase):
    """Schema for returning income data from the API."""
    id: int
    category: Category  # Nested category details
    model_config = ConfigDict(from_attributes=True)