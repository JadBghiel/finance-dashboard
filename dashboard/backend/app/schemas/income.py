from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from .category import Category
from .account import Account

class IncomeBase(BaseModel):
    """base schema for income data"""
    amount: Decimal
    currency: str
    description: str | None = None
    date: datetime
    category_id: int
    account_id: int

class IncomeCreate(IncomeBase):
    """schema for creating a new income transaction"""
    pass

class IncomeUpdate(IncomeBase):
    """schema for updating an income transaction"""
    pass

class Income(IncomeBase):
    """schema for returning income data from the API"""
    id: int
    category: Category
    account: Account
    model_config = ConfigDict(from_attributes=True)