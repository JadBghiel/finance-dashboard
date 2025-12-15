from pydantic import BaseModel, ConfigDict
from datetime import datetime
from decimal import Decimal
from typing import Optional
from .account import Account

class InvestmentBase(BaseModel):
    symbol: str
    name: Optional[str] = None
    type: str
    quantity: Decimal
    purchase_price: Decimal
    purchase_date: datetime
    current_price: Optional[Decimal] = None
    currency: str
    account_id: int
    notes: Optional[str] = None

class InvestmentCreate(InvestmentBase):
    pass

class InvestmentUpdate(BaseModel):
    symbol: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    quantity: Optional[Decimal] = None
    purchase_price: Optional[Decimal] = None
    purchase_date: Optional[datetime] = None
    current_price: Optional[Decimal] = None
    currency: Optional[str] = None
    account_id: Optional[int] = None
    notes: Optional[str] = None

class Investment(InvestmentBase):
    id: int
    account: Optional[Account] = None
    model_config = ConfigDict(from_attributes=True)
