from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal
from app.core.database import get_db
from app.models.investment import Investment
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class PortfolioSummary(BaseModel):
    total_value: Decimal
    total_invested: Decimal
    total_pnl: Decimal
    pnl_percentage: Decimal
    cash_position: Decimal
    allocation: dict  # {type: value}

@router.get("/portfolio/summary/", response_model=PortfolioSummary)
def get_portfolio_summary(db: Session = Depends(get_db)):
    """Calculate and return portfolio summary metrics."""
    # get all investments
    investments = db.query(Investment).all()
    
    total_value = Decimal("0")
    total_invested = Decimal("0")
    allocation = {}
    
    for inv in investments:
        curr_price = inv.current_price or inv.purchase_price
        qty = Decimal(str(inv.quantity))
        purchase_price = Decimal(str(inv.purchase_price))
        current_price = Decimal(str(curr_price)) if curr_price else Decimal("0")
        
        value = current_price * qty
        invested = purchase_price * qty
        
        total_value += value
        total_invested += invested
        
        inv_type = inv.type
        if inv_type not in allocation:
            allocation[inv_type] = Decimal("0")
        allocation[inv_type] += value
    
    # convert to float for JSON serialization
    pnl = total_value - total_invested
    pnl_pct = (pnl / total_invested * 100) if total_invested > 0 else Decimal("0")
    
    return PortfolioSummary(
        total_value=total_value,
        total_invested=total_invested,
        total_pnl=pnl,
        pnl_percentage=pnl_pct,
        cash_position=Decimal("0"),  # TODO: compute from accounts with account_type='investment'
        allocation={k: float(v) for k, v in allocation.items()}
    )
