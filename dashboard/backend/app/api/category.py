from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.schemas.category import Category, CategoryCreate
from app.crud import category as crud_category
from app.core.database import get_db

router = APIRouter()

@router.post("/categories/", response_model=Category)
def create_new_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return crud_category.create_category(db=db, category=category)

@router.get("/categories/", response_model=List[Category])
def read_all_categories(
    category_type: Optional[str] = Query(None, alias="type"),
    db: Session = Depends(get_db),
):
    return crud_category.get_categories(db, category_type=category_type)