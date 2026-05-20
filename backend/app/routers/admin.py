from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session 
from app import models, schemas
from app.database import get_db

router = APIRouter()

@router.post("/admins", response_model=schemas.AdminOut)
def create_admin(
    admin: schemas.AdminCreate,
    db: Session = Depends(get_db)
):

    new_admin = models.Admin(
        user_id=admin.user_id,
        first_name=admin.first_name,
        last_name=admin.last_name,
        phone=admin.phone
    )

    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    return new_admin