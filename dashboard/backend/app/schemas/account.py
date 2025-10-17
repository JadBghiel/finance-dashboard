from pydantic import BaseModel, ConfigDict
from typing import List, TYPE_CHECKING

if TYPE_CHECKING:
    from .income import Income
    from .expense import Expense

class AccountBase(BaseModel):
    name: str

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    incomes: List["Income"] = []   # define the relationship
    expenses: List["Expense"] = [] # define the relationship

    model_config = ConfigDict(from_attributes=True)