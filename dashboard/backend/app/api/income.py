from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.income import Income, IncomeCreate, IncomeUpdate
from app.crud import income as crud_income
from app.core.database import get_db

router = APIRouter()

@router.post("/incomes/", response_model=Income)
def create_new_income(income: IncomeCreate, db: Session = Depends(get_db)):
    """create a new income transaction"""
    return crud_income.create_income(db=db, income=income)

@router.get("/incomes/", response_model=List[Income])
def read_all_incomes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """retrieve all income transactions"""
    return crud_income.get_incomes(db, skip=skip, limit=limit)

@router.get("/incomes/{income_id}/", response_model=Income)
def read_single_income(income_id: int, db: Session = Depends(get_db)):
    """retrieve a single income transaction by its id"""
    db_income = crud_income.get_income(db, income_id=income_id)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    return db_income

@router.put("/incomes/{income_id}/", response_model=Income)
def update_existing_income(income_id: int, income: IncomeUpdate, db: Session = Depends(get_db)):
    """update an income transaction"""
    db_income = crud_income.update_income(db, income_id, income)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    return db_income

@router.delete("/incomes/{income_id}/", response_model=Income)
def delete_single_income(income_id: int, db: Session = Depends(get_db)):
    """delete an income transaction"""
    db_income = crud_income.delete_income(db, income_id=income_id)
    if db_income is None:
        raise HTTPException(status_code=404, detail="Income not found")
    return db_income