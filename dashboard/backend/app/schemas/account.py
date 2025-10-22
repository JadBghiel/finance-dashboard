from pydantic import BaseModel, ConfigDict
from typing import List
from decimal import Decimal

class AccountBase(BaseModel):
    name: str

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# breakdown item
class CurrencyBreakdown(BaseModel):
    currency: str
    amount: Decimal
    converted_amount: Decimal | None  # converted into base currency, none if conv failed

class AccountBalance(BaseModel):
    account_id: int
    base_currency: str
    total_converted: Decimal | None
    breakdown: List[CurrencyBreakdown]