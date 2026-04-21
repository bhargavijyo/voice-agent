import asyncio
import logging
from .database import SessionLocal, Appointment, Patient
from datetime import datetime, timedelta

logger = logging.getLogger("Campaign")

class OutboundCampaignManager:
    def __init__(self, agent_callback):
        self.agent_callback = agent_callback
        self.db = SessionLocal()

    async def scan_reminders(self):
        """
        Scans for appointments starting in 24 hours.
        """
        tomorrow = datetime.now() + timedelta(days=1)
        reminders = self.db.query(Appointment).filter(
            Appointment.start_time >= tomorrow,
            Appointment.status == "booked"
        ).all()
        
        for appt in reminders:
            patient = self.db.query(Patient).filter(Patient.id == appt.patient_id).first()
            if patient:
                logger.info(f"Initiating outbound call for {patient.phone}")
                await self.agent_callback(patient.phone, f"Hello, this is a reminder for your appointment with doctor ID {appt.doctor_id} tomorrow.")

    async def run_scheduler(self):
        while True:
            await self.scan_reminders()
            await asyncio.sleep(3600) # Check every hour
