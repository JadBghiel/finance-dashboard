from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    """base schema for category data"""
    name: str
    type: str

class CategoryCreate(CategoryBase):
    """schema for creating a new category"""
    pass

class CategoryUpdate(CategoryBase):
    """schema for updating an existing category"""
    pass

class Category(CategoryBase):
    """schema for returning a category from the API"""
    id: int
    model_config = ConfigDict(from_attributes=True)