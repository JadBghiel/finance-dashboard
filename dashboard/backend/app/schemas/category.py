from pydantic import BaseModel, ConfigDict
from typing import List, TYPE_CHECKING

# askip a common pattern to handle circular imports with pydantic
if TYPE_CHECKING:
    from .income import Income
    from .expense import Expense

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    incomes: List["Income"] = []   # define the relationship
    expenses: List["Expense"] = [] # define the relationship

    model_config = ConfigDict(from_attributes=True)