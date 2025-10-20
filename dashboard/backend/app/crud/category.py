from sqlalchemy.orm import Session
from app.models.category import Category as CategoryModel
from app.schemas.category import CategoryCreate, CategoryUpdate

def get_category(db: Session, category_id: int):
    """Fetches a single category by its ID."""
    return db.query(CategoryModel).filter(CategoryModel.id == category_id).first()

def get_categories(db: Session, category_type: str | None = None, skip: int = 0, limit: int = 100):
    """
    Fetches categories with pagination.
    Optionally filters by category_type if provided.
    """
    query = db.query(CategoryModel)
    if category_type:
        query = query.filter(CategoryModel.type == category_type)
    return query.offset(skip).limit(limit).all()

def create_category(db: Session, category: CategoryCreate):
    """Creates a new category in the database."""
    db_category = CategoryModel(name=category.name, type=category.type)
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