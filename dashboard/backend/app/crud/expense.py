from sqlalchemy.orm import Session
from app.models.expense import Expense as ExpenseModel
from app.schemas.expense import ExpenseCreate, ExpenseUpdate

def get_expense(db: Session, expense_id: int):
    """fetches a single expense transaction by its id"""
    return db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()

def get_expenses(db: Session, skip: int = 0, limit: int = 100):
    """fetches a list of expense transactions with pagination"""
    return db.query(ExpenseModel).offset(skip).limit(limit).all()

def create_expense(db: Session, expense: ExpenseCreate):
    """creates a new expense transaction in the db"""
    db_expense = ExpenseModel(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

def update_expense(db: Session, expense_id: int, expense_data: ExpenseUpdate):
    """updates an existing expense transaction"""
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
    
    for key, value in expense_data.dict().items():
        setattr(db_expense, key, value)
        
    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, expense_id: int):
    """deletes an expense transaction from the db"""
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
        
    db.delete(db_expense)
    db.commit()
    return db_expense