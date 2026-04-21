from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Text, Date, Time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from both project root and backend/ (whichever uvicorn is launched from)
_project_root = Path(__file__).parent.parent
load_dotenv(_project_root / "backend" / ".env")
load_dotenv(_project_root / ".env")

Base = declarative_base()


class Doctor(Base):
    __tablename__ = 'doctors'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    specialty = Column(String)
    availability = Column(Text) 

class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    phone = Column(String, unique=True)
    language_preference = Column(String, default="en")

class Appointment(Base):
    __tablename__ = 'appointments'
    id = Column(Integer, primary_key=True)
    patient_id = Column(String) # Storing as string (phone or ID)
    doctor = Column(String)     # Storing doctor name as requested
    date = Column(Date)
    time = Column(Time)
    status = Column(String) # booked, cancelled, completed

# Default to SQLite for local dev — set DATABASE_URL in backend/.env for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./healthcare.db")
if "sqlite" in DATABASE_URL:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Seed doctors if empty
    if db.query(Doctor).count() == 0:
        doctors = [
            Doctor(name="Dr. Arjun Mehta", specialty="Cardiologist", availability="Mon-Fri 09:00-17:00"),
            Doctor(name="Dr. Kavita Rao", specialty="Dermatologist", availability="Mon-Wed 10:00-14:00"),
            Doctor(name="Dr. Sarah Williams", specialty="Pediatrician", availability="Tue-Sat 12:00-18:00"),
            Doctor(name="Dr. Rajesh Kumar", specialty="General Physician", availability="Mon-Sat 08:00-20:00"),
            Doctor(name="Dr. Lakshmi", specialty="Gynecologist", availability="Mon-Fri 11:00-16:00")
        ]
        db.add_all(doctors)
        db.commit()
    db.close()
