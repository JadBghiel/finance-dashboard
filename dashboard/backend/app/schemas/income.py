from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from .category import Category
from .account import Account  # --- ADD THIS IMPORT ---

class IncomeBase(BaseModel):
    """Base schema for income data."""
    amount: Decimal
    currency: str
    description: str | None = None
    date: datetime
    category_id: int
    account_id: int  # --- ADD THIS LINE ---

class IncomeCreate(IncomeBase):
    """Schema for creating a new income transaction."""
    pass

class IncomeUpdate(IncomeBase):
    """Schema for updating an income transaction."""
    pass

class Income(IncomeBase):
    """Schema for returning income data from the API."""
    id: int
    category: Category
    account: Account  # --- ADD THIS LINE ---
    model_config = ConfigDict(from_attributes=True)