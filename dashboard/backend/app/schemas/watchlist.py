from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal

class WatchlistBase(BaseModel):
    symbol: str
    name: Optional[str] = None
    type: str
    target_price: Optional[Decimal] = None
    notes: Optional[str] = None

class WatchlistCreate(WatchlistBase):
    pass

class WatchlistUpdate(BaseModel):
    symbol: Optional[str]
    name: Optional[str]
    type: Optional[str]
    target_price: Optional[Decimal]
    notes: Optional[str]

class WatchlistItem(WatchlistBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
