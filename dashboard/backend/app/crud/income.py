from sqlalchemy.orm import Session
from app.models.income import Income as IncomeModel
from app.schemas.income import IncomeCreate, IncomeUpdate

def get_income(db: Session, income_id: int):
    """Fetch a single income transaction by its ID."""
    return db.query(IncomeModel).filter(IncomeModel.id == income_id).first()

def get_incomes(db: Session, skip: int = 0, limit: int = 100):
    """Fetch a list of income transactions with pagination."""
    return db.query(IncomeModel).offset(skip).limit(limit).all()

def create_income(db: Session, income: IncomeCreate):
    """
    Create a new income transaction and return it.
    """
    db_income = IncomeModel(**income.dict())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return get_income(db, db_income.id)

def update_income(db: Session, income_id: int, income_data: IncomeUpdate):
    """Update an existing income transaction."""
    db_income = get_income(db, income_id)
    if not db_income:
        return None

    update_data = income_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_income, key, value)
        
    db.commit()
    db.refresh(db_income)
    return get_income(db, db_income.id)

def delete_income(db: Session, income_id: int):
    """Delete an income transaction from the database."""
    db_income = get_income(db, income_id)
    if not db_income:
        return None
        
    db.delete(db_income)
    db.commit()
    return db_income