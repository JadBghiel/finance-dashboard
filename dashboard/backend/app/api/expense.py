from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.expense import Expense, ExpenseCreate, ExpenseUpdate
from app.crud import expense as crud_expense
from app.core.database import get_db

router = APIRouter()

@router.post("/", response_model=Expense)
def create_new_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    """Create a new expense transaction."""
    return crud_expense.create_expense(db=db, expense=expense)

@router.get("/", response_model=List[Expense])
def read_all_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all expense transactions."""
    return crud_expense.get_expenses(db, skip=skip, limit=limit)

@router.get("/{expense_id}", response_model=Expense)
def read_single_expense(expense_id: int, db: Session = Depends(get_db)):
    """Retrieve a single expense transaction by its ID."""
    db_expense = crud_expense.get_expense(db, expense_id=expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.put("/{expense_id}", response_model=Expense)
def update_existing_expense(expense_id: int, expense: ExpenseUpdate, db: Session = Depends(get_db)):
    """Update an expense transaction."""
    db_expense = crud_expense.update_expense(db, expense_id, expense)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@router.delete("/{expense_id}", response_model=Expense)
def delete_single_expense(expense_id: int, db: Session = Depends(get_db)):
    """Delete an expense transaction."""
    db_expense = crud_expense.delete_expense(db, expense_id=expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense