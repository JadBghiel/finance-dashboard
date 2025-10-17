from sqlalchemy.orm import Session, joinedload
from app.models.income import Income as IncomeModel
from app.schemas.income import IncomeCreate, IncomeUpdate

def get_income(db: Session, income_id: int):
    """Fetches a single income transaction by its ID, with its category."""
    return db.query(IncomeModel).options(
        joinedload(IncomeModel.category),
        joinedload(IncomeModel.account)  # --- ADD THIS LINE ---
    ).filter(IncomeModel.id == income_id).first()

def get_incomes(db: Session, skip: int = 0, limit: int = 100):
    """Fetches a list of income transactions with pagination, with their categories."""
    return db.query(IncomeModel).options(
        joinedload(IncomeModel.category),
        joinedload(IncomeModel.account)  # --- ADD THIS LINE ---
    ).offset(skip).limit(limit).all()

def create_income(db: Session, income: IncomeCreate):
    """
    Creates a new income transaction and returns it with the category loaded.
    """
    db_income = IncomeModel(**income.dict())
    db.add(db_income)
    db.commit()
    db.refresh(db_income)

    # After creating, we must re-fetch it with the relationship loaded
    # to ensure the response model is satisfied.
    return get_income(db, db_income.id)

def update_income(db: Session, income_id: int, income_data: IncomeUpdate):
    """Updates an existing income transaction."""
    db_income = get_income(db, income_id)
    if not db_income:
        return None
    
    for key, value in income_data.dict().items():
        setattr(db_income, key, value)
        
    db.commit()
    db.refresh(db_income)
    return get_income(db, db_income.id) # Return with category loaded

def delete_income(db: Session, income_id: int):
    """Deletes an income transaction from the database."""
    db_income = get_income(db, income_id)
    if not db_income:
        return None
        
    db.delete(db_income)
    db.commit()
    return db_income