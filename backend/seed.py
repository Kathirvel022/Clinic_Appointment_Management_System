import models, database, auth

# Drop and recreate tables to ensure schema is correct
models.Base.metadata.drop_all(bind=database.engine)
models.Base.metadata.create_all(bind=database.engine)

def seed_data():
    db = database.SessionLocal()
    
    # Check if admin already exists
    admin_exists = db.query(models.User).filter(models.User.email == "admin@medicare.com").first()
    if admin_exists:
        print("Data already seeded.")
        return

    print("Seeding initial data...")
    
    # 1. Admin
    admin_pw = auth.get_password_hash("admin123")
    admin_user = models.User(email="admin@medicare.com", password_hash=admin_pw, role="admin")
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    admin_profile = models.Admin(user_id=admin_user.id, first_name="Super", last_name="Admin")
    db.add(admin_profile)

    # 2. Doctors
    docs_data = [
        {"email": "dr.smith@medicare.com", "first": "John", "last": "Smith", "spec": "Cardiology"},
        {"email": "dr.jones@medicare.com", "first": "Sarah", "last": "Jones", "spec": "Pediatrics"},
        {"email": "dr.lee@medicare.com", "first": "David", "last": "Lee", "spec": "General Practice"}
    ]
    
    doc_profiles = []
    for d in docs_data:
        pw = auth.get_password_hash("doc123")
        u = models.User(email=d["email"], password_hash=pw, role="doctor")
        db.add(u)
        db.commit()
        db.refresh(u)
        
        prof = models.Doctor(user_id=u.id, first_name=d["first"], last_name=d["last"], specialty=d["spec"], phone="555-0000")
        db.add(prof)
        db.commit()
        db.refresh(prof)
        doc_profiles.append(prof)
        
    # 3. Patients
    pats_data = [
        {"email": "jane@example.com", "first": "Jane", "last": "Doe"},
        {"email": "mike@example.com", "first": "Mike", "last": "Ross"}
    ]
    pat_profiles = []
    for p in pats_data:
        pw = auth.get_password_hash("pat123")
        u = models.User(email=p["email"], password_hash=pw, role="patient")
        db.add(u)
        db.commit()
        db.refresh(u)
        
        prof = models.Patient(user_id=u.id, first_name=p["first"], last_name=p["last"], phone="555-1111")
        db.add(prof)
        db.commit()
        db.refresh(prof)
        pat_profiles.append(prof)
        
    # 4. Appointments
    from datetime import date, time, timedelta
    
    today = date.today()
    appts = [
        models.Appointment(patient_id=pat_profiles[0].id, doctor_id=doc_profiles[0].id, appointment_date=today, appointment_time=time(10, 0), status="confirmed", reason_for_visit="Heart checkup"),
        models.Appointment(patient_id=pat_profiles[1].id, doctor_id=doc_profiles[1].id, appointment_date=today, appointment_time=time(11, 30), status="pending", reason_for_visit="Fever"),
        models.Appointment(patient_id=pat_profiles[0].id, doctor_id=doc_profiles[2].id, appointment_date=today - timedelta(days=2), appointment_time=time(9, 0), status="completed", consultation_notes="Prescribed rest.", reason_for_visit="Headache")
    ]
    
    for a in appts:
        db.add(a)
    db.commit()
    print("Seed complete.")
    db.close()

if __name__ == "__main__":
    seed_data()
