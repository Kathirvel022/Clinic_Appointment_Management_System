from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
import models, database, auth

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_summary(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
        
    total_patients = db.query(models.Patient).count()
    active_doctors = db.query(models.Doctor).filter(models.Doctor.is_active == True).count()
    today_appointments = db.query(models.Appointment).filter(models.Appointment.appointment_date == date.today()).count()
    pending_appointments = db.query(models.Appointment).filter(models.Appointment.status == "pending").count()
    
    return {
        "total_patients": total_patients,
        "active_doctors": active_doctors,
        "today_appointments": today_appointments,
        "pending_appointments": pending_appointments
    }
