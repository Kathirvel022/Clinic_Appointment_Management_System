from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
import models, schemas, database, auth

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

@router.get("/", response_model=List[schemas.AppointmentOut])
def get_appointments(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role == "admin":
        return db.query(models.Appointment).all()
    elif current_user.role == "doctor":
        # Ensure doctor_profile is loaded
        if not current_user.doctor_profile:
            return []
        return db.query(models.Appointment).filter(models.Appointment.doctor_id == current_user.doctor_profile.id).all()
    elif current_user.role == "patient":
        if not current_user.patient_profile:
            return []
        return db.query(models.Appointment).filter(models.Appointment.patient_id == current_user.patient_profile.id).all()
    return []

@router.post("/", response_model=schemas.AppointmentOut)
def book_appointment(appointment: schemas.AppointmentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book appointments directly")
    
    patient = current_user.patient_profile
    if not patient:
         raise HTTPException(status_code=400, detail="Patient profile not found")

    new_app = models.Appointment(
        patient_id=patient.id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        reason_for_visit=appointment.reason_for_visit,
        status="pending"
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.put("/{id}/status", response_model=schemas.AppointmentOut)
def update_status(id: int, status_update: schemas.AppointmentUpdateStatus, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == "patient" and status_update.status != "cancelled":
        raise HTTPException(status_code=403, detail="Patients can only cancel appointments")
    
    appointment.status = status_update.status
    db.commit()
    db.refresh(appointment)
    return appointment

@router.put("/{id}/notes", response_model=schemas.AppointmentOut)
def add_notes(id: int, notes_update: schemas.AppointmentAddNotes, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can add notes")
        
    appointment = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not appointment or not current_user.doctor_profile or appointment.doctor_id != current_user.doctor_profile.id:
        raise HTTPException(status_code=404, detail="Appointment not found or not assigned to you")
        
    appointment.consultation_notes = notes_update.consultation_notes
    appointment.status = notes_update.status
    db.commit()
    db.refresh(appointment)
    return appointment
