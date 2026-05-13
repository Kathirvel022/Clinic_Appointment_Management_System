from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, time, datetime

# Token
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# User
class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "patient"
    first_name: str
    last_name: str

class UserOut(UserBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Profiles 
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientOut(PatientBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

class DoctorBase(BaseModel):
    first_name: str
    last_name: str
    specialty: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True

class DoctorCreate(DoctorBase):
    email: EmailStr
    password: str

class DoctorOut(DoctorBase):
    id: int
    user_id: int
    class Config:
        from_attributes = True

# Appointments
class AppointmentBase(BaseModel):
    appointment_date: date
    appointment_time: time
    reason_for_visit: Optional[str] = None

class AppointmentCreate(AppointmentBase):
    doctor_id: int

class AppointmentUpdateStatus(BaseModel):
    status: str

class AppointmentAddNotes(BaseModel):
    consultation_notes: str
    status: str = "completed"

class AppointmentOut(AppointmentBase):
    id: int
    patient_id: int
    doctor_id: int
    status: str
    consultation_notes: Optional[str] = None
    created_at: datetime
    
    patient: Optional[PatientOut] = None
    doctor: Optional[DoctorOut] = None

    class Config:
        from_attributes = True
