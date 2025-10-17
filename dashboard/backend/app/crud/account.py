from sqlalchemy.orm import Session, joinedload
from app.models.account import Account as AccountModel
from app.schemas.account import AccountCreate

def get_account(db: Session, account_id: int):
    # Add joinedload here
    return db.query(AccountModel).options(
        joinedload(AccountModel.incomes),
        joinedload(AccountModel.expenses)
    ).filter(AccountModel.id == account_id).first()

def get_accounts(db: Session, skip: int = 0, limit: int = 100):
    # Add joinedload here
    return db.query(AccountModel).options(
        joinedload(AccountModel.incomes),
        joinedload(AccountModel.expenses)
    ).offset(skip).limit(limit).all()

def create_account(db: Session, account: AccountCreate):
    db_account = AccountModel(name=account.name)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account