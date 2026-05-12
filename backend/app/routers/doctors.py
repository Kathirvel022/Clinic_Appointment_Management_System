from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import app.models as models, app.schemas as schemas, app.database as database, app.auth as auth

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

@router.get("/", response_model=List[schemas.DoctorOut])
def get_doctors(db: Session = Depends(database.get_db)):
    # Public endpoint to view active doctors
    return db.query(models.Doctor).filter(models.Doctor.is_active == True).all()

@router.post("/", response_model=schemas.DoctorOut)
def create_doctor(doctor: schemas.DoctorCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if user email exists
    if db.query(models.User).filter(models.User.email == doctor.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = auth.get_password_hash(doctor.password)
    new_user = models.User(email=doctor.email, password_hash=hashed_password, role="doctor")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    new_doctor = models.Doctor(
        user_id=new_user.id,
        first_name=doctor.first_name,
        last_name=doctor.last_name,
        specialty=doctor.specialty,
        phone=doctor.phone,
        is_active=doctor.is_active
    )
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    return new_doctor
