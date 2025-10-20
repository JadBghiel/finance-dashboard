from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.schemas.account import Account, AccountCreate
from app.crud import account as crud_account
from app.core.database import get_db

router = APIRouter()

@router.post("/accounts/", response_model=Account)
def create_new_account(account: AccountCreate, db: Session = Depends(get_db)):
    return crud_account.create_account(db=db, account=account)

@router.get("/accounts/", response_model=List[Account])
def read_all_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_account.get_accounts(db, skip=skip, limit=limit)