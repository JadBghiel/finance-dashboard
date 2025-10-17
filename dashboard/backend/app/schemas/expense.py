from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from .category import Category
from .account import Account

class ExpenseBase(BaseModel):
    """Base schema for expense data."""
    amount: Decimal
    currency: str
    description: str | None = None
    date: datetime
    category_id: int
    account_id: int

class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense transaction."""
    pass

class ExpenseUpdate(ExpenseBase):
    """Schema for updating an expense transaction."""
    pass

class Expense(ExpenseBase):
    """Schema for returning expense data from the API."""
    id: int
    category: Category
    account: Account
    model_config = ConfigDict(from_attributes=True)