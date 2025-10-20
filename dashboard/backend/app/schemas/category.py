from pydantic import BaseModel, ConfigDict

# no longer needs to import income or expense, breaking the loop

class CategoryBase(BaseModel):
    name: str
    type: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# a new "public" schema that is safe for API responses
# it does not include the incomes or expenses fields
class CategoryPublic(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)