from datetime import datetime, timedelta, date, time
from .database import SessionLocal, Appointment, Doctor, Patient
from sqlalchemy import or_, and_

class AppointmentEngine:
    def __init__(self):
        self._db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def get_doctors(self, specialty=None):
        query = self.db.query(Doctor)
        if specialty:
            query = query.filter(Doctor.specialty.ilike(f"%{specialty}%"))
        return query.all()

    def check_availability(self, doctor_name, appointment_date, appointment_time):
        # Check for existing bookings on same date and time for the doctor
        conflict = self.db.query(Appointment).filter(
            Appointment.doctor == doctor_name,
            Appointment.date == appointment_date,
            Appointment.time == appointment_time,
            Appointment.status == "booked"
        ).first()
        return conflict is None

    def book_appointment(self, patient_id, doctor, date_str, time_str):
        # Convert strings to date and time objects
        app_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        app_time = datetime.strptime(time_str, '%H:%M').time()

        if not self.check_availability(doctor, app_date, app_time):
            return {"status": "error", "message": f"Dr. {doctor} is not available at {time_str} on {date_str}"}
            
        new_appointment = Appointment(
            patient_id=patient_id,
            doctor=doctor,
            date=app_date,
            time=app_time,
            status="booked"
        )
        self.db.add(new_appointment)
        self.db.commit()
        self.db.refresh(new_appointment)
        return {
            "status": "success", 
            "appointment_id": new_appointment.id,
            "message": f"Appointment booked with {doctor} for {date_str} at {time_str}"
        }

    def cancel_appointment(self, appointment_id):
        appointment = self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if appointment:
            appointment.status = "cancelled"
            self.db.commit()
            return {"status": "success", "message": f"Appointment {appointment_id} cancelled"}
        return {"status": "error", "message": "Appointment not found"}

    def reschedule_appointment(self, appointment_id, new_date_str, new_time_str):
        appointment = self.db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return {"status": "error", "message": "Appointment not found"}
        
        new_date = datetime.strptime(new_date_str, '%Y-%m-%d').date()
        new_time = datetime.strptime(new_time_str, '%H:%M').time()

        if not self.check_availability(appointment.doctor, new_date, new_time):
            return {"status": "error", "message": "New slot is not available"}

        appointment.date = new_date
        appointment.time = new_time
        self.db.commit()
        return {"status": "success", "message": f"Appointment moved to {new_date_str} at {new_time_str}"}

    def get_patient_history(self, patient_id):
        return self.db.query(Appointment).filter(Appointment.patient_id == patient_id).all()
        
    def __del__(self):
        if self._db:
            self._db.close()
