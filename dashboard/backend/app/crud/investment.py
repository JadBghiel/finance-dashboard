from sqlalchemy.orm import Session
from app.models.investment import Investment as InvestmentModel
from app.schemas.investment import InvestmentCreate, InvestmentUpdate
from typing import List, Optional

def get_investment(db: Session, inv_id: int) -> Optional[InvestmentModel]:
    return db.query(InvestmentModel).filter(InvestmentModel.id == inv_id).first()

def get_investments(db: Session, skip: int = 0, limit: int = 100) -> List[InvestmentModel]:
    return db.query(InvestmentModel).offset(skip).limit(limit).all()

def create_investment(db: Session, inv: InvestmentCreate) -> InvestmentModel:
    db_obj = InvestmentModel(**inv.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def update_investment(db: Session, inv_id: int, data: InvestmentUpdate):
    obj = get_investment(db, inv_id)
    if not obj:
        return None
    for k, v in data.dict(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_investment(db: Session, inv_id: int):
    obj = get_investment(db, inv_id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj
