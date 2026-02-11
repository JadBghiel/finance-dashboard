from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.watchlist import WatchlistItem, WatchlistCreate, WatchlistUpdate
from app.crud import watchlist as crud_watchlist
from app.core.database import get_db

router = APIRouter()

@router.post("/watchlist/", response_model=WatchlistItem)
def create_watchlist(payload: WatchlistCreate, db: Session = Depends(get_db)):
    return crud_watchlist.create_watchlist_item(db, payload)

@router.get("/watchlist/", response_model=List[WatchlistItem])
def list_watchlist(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_watchlist.get_watchlist(db, skip=skip, limit=limit)

@router.put("/watchlist/{item_id}/", response_model=WatchlistItem)
def update_watchlist(item_id: int, payload: WatchlistUpdate, db: Session = Depends(get_db)):
    obj = crud_watchlist.update_watchlist_item(db, item_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="watchlist item not found")
    return obj

@router.delete("/watchlist/{item_id}/", response_model=WatchlistItem)
def delete_watchlist(item_id: int, db: Session = Depends(get_db)):
    obj = crud_watchlist.delete_watchlist_item(db, item_id)
    if not obj:
        raise HTTPException(status_code=404, detail="watchlist item not found")
    return obj

@router.post("/watchlist/refresh-prices/")
def refresh_watchlist_prices():
    return {"status": "accepted", "message": "watchlist price refresh enqueued (stub)"}
