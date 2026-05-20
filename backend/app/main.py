from app.routers import appointments, dashboard, doctors
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import app.models as models, app.schemas as schemas, app.database as database, app.auth as auth
from app.routers import patients
from fastapi.security import OAuth2PasswordRequestForm

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="MediCare Clinic API")

@app.get("/")
def read_root():
    return {"message": "Welcome to MediCare Clinic API"}

# Setup CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.role == "patient":
        new_patient = models.Patient(
            user_id=new_user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone
        )
        db.add(new_patient)
    elif user.role == "doctor":
        new_doctor = models.Doctor(
            user_id=new_user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone
        )
        db.add(new_doctor)
    elif user.role == "admin":
        new_admin = models.Admin(
            user_id=new_user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone
        )
        db.add(new_admin)
    
    db.commit()
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/api/auth/profile")
def get_user_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role == "patient":
        return db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    elif current_user.role == "doctor":
        return db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
    elif current_user.role == "admin":
        return db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()
    raise HTTPException(status_code=404, detail="Profile not found")

@app.put("/api/auth/profile")
def update_user_profile(profile_data: schemas.ProfileUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    profile = None
    if current_user.role == "patient":
        profile = db.query(models.Patient).filter(models.Patient.user_id == current_user.id).first()
    elif current_user.role == "doctor":
        profile = db.query(models.Doctor).filter(models.Doctor.user_id == current_user.id).first()
        if profile_data.specialty:
            profile.specialty = profile_data.specialty
    elif current_user.role == "admin":
        profile = db.query(models.Admin).filter(models.Admin.user_id == current_user.id).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.first_name = profile_data.first_name
    profile.last_name = profile_data.last_name
    if profile_data.phone is not None:
        profile.phone = profile_data.phone

    db.commit()
    db.refresh(profile)
    return profile

app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(dashboard.router)
