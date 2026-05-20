from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import app.models as models, app.schemas as schemas, app.database as database, app.auth as auth

router = APIRouter(prefix="/api/patients", tags=["Patients"])

@router.get("/", response_model=List[schemas.PatientOut])
def get_patients(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(models.Patient).all()

@router.get("/{id}", response_model=schemas.PatientOut)
def get_patient(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Only admin, doctor, or the patient themselves can view
    if current_user.role == "patient" and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return patient

@router.put("/{id}", response_model=schemas.PatientOut)
def update_patient(id: int, patient_update: schemas.PatientCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if current_user.role == "patient" and patient.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Update patient information
    patient.first_name = patient_update.first_name
    patient.last_name = patient_update.last_name
    patient.phone = patient_update.phone
    patient.date_of_birth = patient_update.date_of_birth
    patient.gender = patient_update.gender
    patient.address = patient_update.address
    db.commit()
    db.refresh(patient)
    return patient