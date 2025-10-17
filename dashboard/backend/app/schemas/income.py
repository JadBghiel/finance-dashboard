from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal

# forward references are handled by the other files now
from .category import Category
from .account import Account
from typing import Optional

class IncomeBase(BaseModel):
    amount: Decimal
    currency: str
    description: str | None = None
    date: datetime
    category_id: int
    account_id: int

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    category_id: Optional[int] = None
    account_id: Optional[int] = None

class Income(IncomeBase):
    id: int
    category: Category
    account: Account

    model_config = ConfigDict(from_attributes=True)