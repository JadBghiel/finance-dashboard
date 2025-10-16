from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.category import Category, CategoryCreate, CategoryUpdate
from app.crud import category as crud_category
from app.core.database import get_db

router = APIRouter()

@router.post("/categories/", response_model=Category)
def create_new_category(category: CategoryCreate, db: Session = Depends(get_db)):
    return crud_category.create_category(db=db, category=category)

@router.get("/categories/", response_model=List[Category])
def read_all_categories(type: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud_category.get_categories(db, category_type=type, skip=skip, limit=limit)

@router.get("/categories/{category_id}", response_model=Category)
def read_single_category(category_id: int, db: Session = Depends(get_db)):
    db_category = crud_category.get_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.put("/categories/{category_id}", response_model=Category)
def update_existing_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = crud_category.update_category(db, category_id, category)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category

@router.delete("/categories/{category_id}", response_model=Category)
def delete_single_category(category_id: int, db: Session = Depends(get_db)):
    db_category = crud_category.delete_category(db, category_id=category_id)
    if db_category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    return db_category