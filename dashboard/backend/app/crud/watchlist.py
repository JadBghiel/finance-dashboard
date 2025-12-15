from sqlalchemy.orm import Session
from app.models.watchlist import WatchlistItem as WatchlistModel
from app.schemas.watchlist import WatchlistCreate, WatchlistUpdate
from typing import List, Optional

def get_watchlist(db: Session, skip: int = 0, limit: int = 100) -> List[WatchlistModel]:
    return db.query(WatchlistModel).offset(skip).limit(limit).all()

def get_watchlist_item(db: Session, item_id: int) -> Optional[WatchlistModel]:
    return db.query(WatchlistModel).filter(WatchlistModel.id == item_id).first()

def create_watchlist_item(db: Session, item: WatchlistCreate) -> WatchlistModel:
    obj = WatchlistModel(**item.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_watchlist_item(db: Session, item_id: int, data: WatchlistUpdate):
    obj = get_watchlist_item(db, item_id)
    if not obj:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_watchlist_item(db: Session, item_id: int):
    obj = get_watchlist_item(db, item_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj
