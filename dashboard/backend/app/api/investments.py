from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.investment import Investment, InvestmentCreate, InvestmentUpdate
from app.crud import investment as crud_investment
from app.core.database import get_db
from app.utils.market import get_last_price

router = APIRouter()

@router.post("/investments/", response_model=Investment)
def create_investment_endpoint(payload: InvestmentCreate, db: Session = Depends(get_db)):
    if payload.current_price is None:
        try:
            p = get_last_price(payload.symbol)
            if p is not None:
                payload.current_price = p  # type: ignore
        except Exception:
            pass
    return crud_investment.create_investment(db, payload)

@router.get("/investments/", response_model=List[Investment])
def list_investments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_investment.get_investments(db, skip=skip, limit=limit)

@router.get("/investments/{inv_id}/", response_model=Investment)
def get_investment_endpoint(inv_id: int, db: Session = Depends(get_db)):
    obj = crud_investment.get_investment(db, inv_id)
    if not obj:
        raise HTTPException(status_code=404, detail="investment not found")
    return obj

@router.put("/investments/{inv_id}/", response_model=Investment)
def update_investment_endpoint(inv_id: int, payload: InvestmentUpdate, db: Session = Depends(get_db)):
    obj = crud_investment.update_investment(db, inv_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="investment not found")
    return obj

@router.delete("/investments/{inv_id}/", response_model=Investment)
def delete_investment_endpoint(inv_id: int, db: Session = Depends(get_db)):
    obj = crud_investment.delete_investment(db, inv_id)
    if not obj:
        raise HTTPException(status_code=404, detail="investment not found")
    return obj

@router.post("/investments/{inv_id}/refresh-price/")
def refresh_price(inv_id: int):
    # stub - not implemented yet
    return {"status": "accepted", "message": "price refresh queued (stub)"}
