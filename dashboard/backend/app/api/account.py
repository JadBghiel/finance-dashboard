from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from decimal import Decimal
from app.schemas.account import Account, AccountCreate, AccountBalance, CurrencyBreakdown
from app.crud import account as crud_account
from app.core.database import get_db
from app.core import config
from app.utils.exchange import get_rate

router = APIRouter()

@router.post("/accounts/", response_model=Account)
def create_new_account(account: AccountCreate, db: Session = Depends(get_db)):
    return crud_account.create_account(db=db, account=account)

@router.get("/accounts/", response_model=List[Account])
def read_all_accounts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_account.get_accounts(db, skip=skip, limit=limit)

@router.put("/accounts/{account_id}/", response_model=Account)
def update_existing_account(account_id: int, account: AccountCreate, db: Session = Depends(get_db)):
    acc = crud_account.update_account(db, account_id, account.dict(exclude_unset=True))
    if not acc:
        raise HTTPException(status_code=404, detail="account not found")
    return acc

@router.delete("/accounts/{account_id}/", status_code=204)
def delete_existing_account(account_id: int, db: Session = Depends(get_db)):
    ok = crud_account.delete_account(db, account_id)
    if not ok:
        raise HTTPException(status_code=404, detail="account not found")
    return None

@router.get("/accounts/{account_id}/balance/", response_model=AccountBalance)
def get_account_balance(
    account_id: int,
    base_currency: str | None = Query(default=None, description="optional base currency override"),
    db: Session = Depends(get_db),
):
    """
    calculate account net per currency (incomes-expenses), convert each currency to base currency
    using exchange utility (with caching and daily limit), returns breakdown and total in base currency
    """
    acc = crud_account.get_account(db, account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="account not found")

    per_currency = crud_account.get_account_balance_per_currency(db, account_id)

    base = (base_currency or config.BASE_CURRENCY).upper()
    total_converted = Decimal("0")
    any_conversion_ok = False
    breakdown_items: List[CurrencyBreakdown] = []

    for cur, amt in per_currency.items():
        converted = None
        if cur.upper() == base:
            converted = amt
            any_conversion_ok = True
            total_converted += converted
        else:
            rate = get_rate(cur.upper(), base)
            if rate is not None:
                converted = (amt * Decimal(str(rate)))
                any_conversion_ok = True
                total_converted += converted
            else:
                converted = None
        breakdown_items.append(CurrencyBreakdown(currency=cur.upper(), amount=amt, converted_amount=converted))

    result_total = total_converted if any_conversion_ok else None

    return AccountBalance(
        account_id=account_id,
        base_currency=base,
        total_converted=result_total,
        breakdown=breakdown_items
    )