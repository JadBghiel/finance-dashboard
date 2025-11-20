from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.account import Account as AccountModel
from app.models.income import Income as IncomeModel
from app.models.expense import Expense as ExpenseModel
from app.schemas.account import AccountCreate
from decimal import Decimal

def get_account(db: Session, account_id: int):
    return db.query(AccountModel).filter(AccountModel.id == account_id).first()

def get_accounts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(AccountModel).offset(skip).limit(limit).all()

def create_account(db: Session, account: AccountCreate):
    db_account = AccountModel(name=account.name, emoji=getattr(account, 'emoji', None))
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

def update_account(db: Session, account_id: int, data: dict):
    acc = get_account(db, account_id)
    if not acc:
        return None
    if 'name' in data:
        acc.name = data['name']
    if 'emoji' in data:
        acc.emoji = data['emoji']
    db.add(acc)
    db.commit()
    db.refresh(acc)
    return acc

def delete_account(db: Session, account_id: int):
    acc = get_account(db, account_id)
    if not acc:
        return False
    db.delete(acc)
    db.commit()
    return True

def get_account_balance_per_currency(db: Session, account_id: int) -> dict[str, Decimal]:
    """
    returns a dict of currency -> net amount (in that currency) for given account:
      net = sum(incomes) - sum(expenses) grouped by currency obvi
    """
    # incomes grouped by currency
    inc_rows = db.query(IncomeModel.currency, func.coalesce(func.sum(IncomeModel.amount), 0)).filter(
        IncomeModel.account_id == account_id
    ).group_by(IncomeModel.currency).all()

    exp_rows = db.query(ExpenseModel.currency, func.coalesce(func.sum(ExpenseModel.amount), 0)).filter(
        ExpenseModel.account_id == account_id
    ).group_by(ExpenseModel.currency).all()

    inc_map: dict[str, Decimal] = {row[0]: Decimal(str(row[1])) for row in inc_rows}
    exp_map: dict[str, Decimal] = {row[0]: Decimal(str(row[1])) for row in exp_rows}

    currencies = set(list(inc_map.keys()) + list(exp_map.keys()))
    result: dict[str, Decimal] = {}
    for cur in currencies:
        inc_val = inc_map.get(cur, Decimal("0"))
        exp_val = exp_map.get(cur, Decimal("0"))
        result[cur] = inc_val - exp_val

    return result