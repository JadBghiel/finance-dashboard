from typing import Optional
from sqlalchemy.orm import Session, joinedload
from app.models.category import Category as CategoryModel
from app.schemas.category import CategoryCreate, CategoryUpdate

def get_category(db: Session, category_id: int):
    return db.query(CategoryModel).options(
        joinedload(CategoryModel.incomes),
        joinedload(CategoryModel.expenses)
    ).filter(CategoryModel.id == category_id).first()

def get_categories(db: Session, category_type: Optional[str] = None, skip: int = 0, limit: int = 100):
    query = db.query(CategoryModel).options(
        joinedload(CategoryModel.incomes),
        joinedload(CategoryModel.expenses)
    )
    if category_type:
        query = query.filter(CategoryModel.type == category_type)
    return query.offset(skip).limit(limit).all()

def create_category(db: Session, category: CategoryCreate):
    db_category = CategoryModel(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def update_category(db: Session, category_id: int, category_data: CategoryUpdate):
    """Updates an existing category."""
    db_category = get_category(db, category_id)
    if not db_category:
        return None
    
    db_category.name = category_data.name
    db_category.type = category_data.type
    db.commit()
    db.refresh(db_category)
    return db_category

def delete_category(db: Session, category_id: int):
    """Deletes a category from the database."""
    db_category = get_category(db, category_id)
    if not db_category:
        return None
        
    db.delete(db_category)
    db.commit()
    return db_category