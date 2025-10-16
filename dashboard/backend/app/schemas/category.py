from pydantic import BaseModel, ConfigDict

class CategoryBase(BaseModel):
    """Base schema for category data."""
    name: str
    type: str

class CategoryCreate(CategoryBase):
    """Schema for creating a new category."""
    pass

class CategoryUpdate(CategoryBase):
    """Schema for updating an existing category."""
    pass

class Category(CategoryBase):
    """Schema for returning a category from the API."""
    id: int
    model_config = ConfigDict(from_attributes=True)