"""
ClinicalAgent — stateful multi-turn voice AI agent for healthcare appointment management.

Architecture:
  - Receives conversation history + current booking state every turn.
  - Builds a rich system prompt that includes the current state machine context.
  - Calls OpenAI with function tools for booking actions.
  - Falls back to deterministic rule-based mock when OpenAI is unavailable.
"""

import json
import os
from openai import OpenAI
from typing import List, Dict, Any, Tuple
from scheduler.appointment_engine import AppointmentEngine
from datetime import datetime, timedelta
from langdetect import detect
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def _tomorrow() -> str:
    return (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

def _detect_lang(text: str) -> str:
    try:
        code = detect(text)
        return "Hindi" if code == "hi" else "Tamil" if code == "ta" else "English"
    except Exception:
        return "English"


# ─────────────────────────────────────────
# Agent
# ─────────────────────────────────────────

class ClinicalAgent:
    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY", "")
        self.client = OpenAI(api_key=api_key) if api_key else None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")
        self.engine = AppointmentEngine()

    # ─────────────────
    # System prompt
    # ─────────────────

    def _build_system_prompt(self, state: Dict[str, Any]) -> str:
        state_json = json.dumps(state, indent=2)
        return f"""
You are 2Care.ai — a premium, empathetic, real-time voice AI healthcare assistant for City Clinic.
Your role: manage the full appointment lifecycle (Book, Reschedule, Cancel, Check Availability).

## LANGUAGES
Detect the patient's language automatically. Always reply in the EXACT same language:
- English, Hindi (हिन्दी), Tamil (தமிழ்)

## CONVERSATION STATE (current)
{state_json}

## STATE MACHINE RULES
Follow these steps in order when intent = "booking":
  start       → ask which doctor/specialty
  ask_doctor  → got doctor → ask for date
  ask_date    → got date   → ask for time (suggest 10:00 AM if not given)
  ask_time    → got time   → confirm with patient (read back: doctor, date, time)
  confirm     → patient says yes → call book_appointment tool → done
              → patient says no  → restart from start

For "cancellation":
  start → ask for appointment_id → call cancel_appointment → done

For "rescheduling":
  start → ask for appointment_id → ask new date → ask new time → call reschedule_appointment → done

## CRITICAL RULES
- NEVER skip a step. Collect ONE missing slot at a time.
- Keep responses SHORT — optimised for voice (≤ 2 sentences).
- update `next_state` with the NEXT step and any newly collected slots.
- Always include `language` in your JSON response.
- When calling a tool, set tool_call to the function and arguments.

## AVAILABLE DOCTORS (always suggest from this list)
- Dr. Arjun Mehta   — Cardiologist     — Mon-Fri 09:00-17:00
- Dr. Kavita Rao    — Dermatologist    — Mon-Wed 10:00-14:00
- Dr. Sarah Williams— Pediatrician     — Tue-Sat 12:00-18:00
- Dr. Rajesh Kumar  — General Physician— Mon-Sat 08:00-20:00
- Dr. Lakshmi       — Gynecologist     — Mon-Fri 11:00-16:00

## RESPONSE FORMAT (strict JSON)
{{
  "intent":   "greeting | booking | cancellation | rescheduling | information | unknown",
  "language": "English | Hindi | Tamil",
  "response_text": "<spoken reply>",
  "tool_call": {{ "name": "<tool>", "arguments": {{}} }} | null,
  "reasoning_trace": "<internal thought process>",
  "next_state": {{
    "intent":  "<same or updated>",
    "step":    "<next step name>",
    "doctor":  "<value or null>",
    "date":    "<YYYY-MM-DD or null>",
    "time":    "<HH:MM or null>",
    "appointment_id": "<value or null>"
  }}
}}

Current UTC time: {datetime.utcnow().strftime("%Y-%m-%d %H:%M")}
""".strip()

    # ─────────────────
    # Tool definitions
    # ─────────────────

    def _tools(self) -> List[Dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": "check_availability",
                    "description": "List available doctors by name or specialty.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "specialty": {"type": "string", "description": "Medical specialty, e.g. Cardiologist"}
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "book_appointment",
                    "description": "Book a confirmed appointment after patient approval.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "patient_id": {"type": "string"},
                            "doctor":     {"type": "string", "description": "Full doctor name"},
                            "date":       {"type": "string", "description": "YYYY-MM-DD"},
                            "time":       {"type": "string", "description": "HH:MM (24h)"}
                        },
                        "required": ["patient_id", "doctor", "date", "time"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "cancel_appointment",
                    "description": "Cancel an existing appointment by ID.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "string"}
                        },
                        "required": ["appointment_id"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "reschedule_appointment",
                    "description": "Move an existing appointment to a new date/time.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "appointment_id": {"type": "string"},
                            "new_date":       {"type": "string", "description": "YYYY-MM-DD"},
                            "new_time":       {"type": "string", "description": "HH:MM (24h)"}
                        },
                        "required": ["appointment_id", "new_date", "new_time"]
                    }
                }
            }
        ]

    # ─────────────────
    # Tool execution
    # ─────────────────

    def _run_tool(self, name: str, args: Dict, patient_id: str) -> Dict:
        try:
            if name == "check_availability":
                doctors = self.engine.get_doctors(args.get("specialty"))
                return {"doctors": [{"name": d.name, "specialty": d.specialty, "availability": d.availability} for d in doctors]}
            elif name == "book_appointment":
                return self.engine.book_appointment(
                    args.get("patient_id", patient_id),
                    args["doctor"],
                    args["date"],
                    args["time"]
                )
            elif name == "cancel_appointment":
                return self.engine.cancel_appointment(args["appointment_id"])
            elif name == "reschedule_appointment":
                return self.engine.reschedule_appointment(
                    args["appointment_id"], args["new_date"], args["new_time"]
                )
        except Exception as e:
            return {"status": "error", "message": str(e)}
        return {"status": "ok"}

    # ─────────────────
    # Main entry point
    # ─────────────────

    async def process(
        self,
        user_text: str,
        history: List[Dict[str, str]],
        state: Dict[str, Any],
        patient_id: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Returns:
          (agent_data dict, new_state dict)
        """
        lang = _detect_lang(user_text)

        if self.client:
            try:
                return await self._llm_process(user_text, history, state, patient_id, lang)
            except Exception as e:
                print(f"[ClinicalAgent] LLM error: {e}")

        # Fallback to deterministic state machine
        return self._rule_based(user_text, state, patient_id, lang)

    async def _llm_process(
        self,
        user_text: str,
        history: List[Dict],
        state: Dict,
        patient_id: str,
        lang: str
    ) -> Tuple[Dict, Dict]:

        messages = [{"role": "system", "content": self._build_system_prompt(state)}]
        messages.extend(history[-12:])  # last 6 turns
        messages.append({"role": "user", "content": user_text})

        # First LLM call
        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            tools=self._tools(),
            tool_choice="auto",
            response_format={"type": "json_object"}
        )
        msg = response.choices[0].message

        # Handle tool calls
        if msg.tool_calls:
            messages.append(msg)
            for tc in msg.tool_calls:
                args = json.loads(tc.function.arguments)
                result = self._run_tool(tc.function.name, args, patient_id)
                messages.append({
                    "tool_call_id": tc.id,
                    "role": "tool",
                    "name": tc.function.name,
                    "content": json.dumps(result)
                })
            # Second LLM call to produce final response
            final = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={"type": "json_object"}
            )
            raw = final.choices[0].message.content
        else:
            raw = msg.content

        agent_data = json.loads(raw)
        new_state = agent_data.get("next_state") or state
        return agent_data, new_state

    # ─────────────────────────────────────────
    # Deterministic rule-based fallback
    # ─────────────────────────────────────────

    def _rule_based(
        self,
        text: str,
        state: Dict,
        patient_id: str,
        lang: str
    ) -> Tuple[Dict, Dict]:

        t = text.lower().strip()
        step = state.get("step", "start")
        new_state = dict(state)

        # ── DETECT GLOBAL INTENT ──
        if any(w in t for w in ["book", "appointment", "schedule", "fix", "अपॉइंटमेंट", "பதிவு"]):
            new_state["intent"] = "booking"
        elif any(w in t for w in ["cancel", "रद्द", "ரத்து"]):
            new_state["intent"] = "cancellation"
        elif any(w in t for w in ["reschedule", "move", "change", "बदल", "மாற்று"]):
            new_state["intent"] = "rescheduling"
        elif any(w in t for w in ["hello", "hi", "hey", "नमस्ते", "வணக்கம்"]):
            new_state["intent"] = "greeting"

        intent = new_state.get("intent")

        # ── GREETING ──
        if intent == "greeting" or not intent:
            response, trace = self._greet(lang)
            new_state["step"] = "start"
            return self._pack(intent or "greeting", lang, response, trace, new_state), new_state

        # ── BOOKING FLOW ──
        if intent == "booking":
            return self._booking_flow(t, text, new_state, patient_id, lang)

        # ── CANCELLATION FLOW ──
        if intent == "cancellation":
            return self._cancel_flow(t, new_state, lang)

        # ── RESCHEDULING FLOW ──
        if intent == "rescheduling":
            return self._reschedule_flow(t, new_state, lang)

        # ── FALLBACK ──
        resp = {"English": "I can help with booking, cancelling, or rescheduling appointments. What would you like?",
                "Hindi":   "मैं अपॉइंटमेंट बुक करने, रद्द करने या पुनर्निर्धारित करने में मदद कर सकता हूँ। आप क्या चाहते हैं?",
                "Tamil":   "நான் அப்பாயிண்ட்மெண்ட் புக் செய்ய, ரத்து செய்ய அல்லது மாற்ற உதவ முடியும். நீங்கள் என்ன விரும்புகிறீர்கள்?"}.get(lang, "")
        return self._pack("unknown", lang, resp, "Intent not recognised, prompted for clarification.", new_state), new_state

    # ── Booking steps ──

    def _booking_flow(self, t: str, raw: str, state: Dict, patient_id: str, lang: str):
        step = state.get("step", "start")

        if step in ("start", "ask_doctor") and not state.get("doctor"):
            # Try to extract doctor/specialty from utterance
            doctor = self._extract_doctor(t)
            if doctor:
                state["doctor"] = doctor
                state["step"] = "ask_date"
                resp = {"English": f"Great! I found {doctor}. What date would you like?",
                        "Hindi":   f"बहुत अच्छा! मुझे {doctor} मिल गए। आप किस तारीख को मिलना चाहते हैं?",
                        "Tamil":   f"நன்று! {doctor} கிடைத்தார். எந்த தேதியில் வர விரும்புகிறீர்கள்?"}.get(lang)
                return self._pack("booking", lang, resp, f"Doctor extracted: {doctor}. Asking for date.", state), state
            else:
                state["step"] = "ask_doctor"
                resp = {"English": "Which doctor or specialty are you looking for? We have Cardiologist, Dermatologist, Pediatrician, General Physician, and Gynecologist.",
                        "Hindi":   "आप किस डॉक्टर या विशेषज्ञ से मिलना चाहते हैं? हमारे पास कार्डियोलॉजिस्ट, डर्मेटोलॉजिस्ट, पेडियाट्रिशियन, जनरल फिजिशियन और गाइनेकोलॉजिस्ट हैं।",
                        "Tamil":   "எந்த மருத்துவர் அல்லது நிபுணரை பார்க்க விரும்புகிறீர்கள்? எங்களிடம் இதயநோய் மருத்துவர், தோல் மருத்துவர், குழந்தை மருத்துவர், பொது மருத்துவர் மற்றும் மகளிர் மருத்துவர் உள்ளனர்."}.get(lang)
                return self._pack("booking", lang, resp, "No doctor found. Asking for doctor/specialty.", state), state

        if step == "ask_date" and not state.get("date"):
            date = self._extract_date(t)
            if date:
                state["date"] = date
                state["step"] = "ask_time"
                resp = {"English": f"Perfect — {date}. What time works for you? For example, 10 AM or 2:30 PM.",
                        "Hindi":   f"ठीक है — {date}। आपके लिए कौन सा समय ठीक रहेगा? उदाहरण के लिए, सुबह 10 बजे या दोपहर 2:30 बजे।",
                        "Tamil":   f"சரி — {date}. உங்களுக்கு எந்த நேரம் சரியாக இருக்கும்? உதாரணமாக, காலை 10 மணி அல்லது மதியம் 2:30."}.get(lang)
            else:
                resp = {"English": "What date would you prefer? You can say 'tomorrow' or a specific date.",
                        "Hindi":   "आप कौन सी तारीख चाहते हैं? आप 'कल' या कोई विशेष तारीख बता सकते हैं।",
                        "Tamil":   "எந்த தேதி விரும்புகிறீர்கள்? 'நாளை' அல்லது ஒரு குறிப்பிட்ட தேதி சொல்லலாம்."}.get(lang)
            return self._pack("booking", lang, resp, f"Date extraction: {state.get('date')}.", state), state

        if step == "ask_time" and not state.get("time"):
            time_val = self._extract_time(t)
            if time_val:
                state["time"] = time_val
                state["step"] = "confirm"
                doc, dt, tm = state.get("doctor"), state.get("date"), time_val
                resp = {"English": f"Got it! To confirm: {doc} on {dt} at {tm}. Shall I book this?",
                        "Hindi":   f"समझ गया! पुष्टि के लिए: {dt} को {tm} बजे {doc} के साथ। क्या मैं यह बुक करूं?",
                        "Tamil":   f"புரிந்தது! உறுதிப்படுத்த: {dt} அன்று {tm}க்கு {doc}. இதை புக் செய்யட்டுமா?"}.get(lang)
            else:
                resp = {"English": "What time would you prefer? Say something like 10 AM or 2:30 PM.",
                        "Hindi":   "आप किस समय मिलना चाहते हैं? उदाहरण के लिए, सुबह 10 बजे या दोपहर 2:30 बजे।",
                        "Tamil":   "எந்த நேரம் விரும்புகிறீர்கள்? உதாரணமாக, காலை 10 மணி அல்லது மதியம் 2:30."}.get(lang)
            return self._pack("booking", lang, resp, f"Time extraction: {state.get('time')}.", state), state

        if step == "confirm":
            if any(w in t for w in ["yes", "confirm", "ok", "sure", "yeah", "हाँ", "हां", "ஆம்", "சரி"]):
                # Book it
                result = self.engine.book_appointment(patient_id, state["doctor"], state["date"], state["time"])
                if result.get("status") == "success":
                    appt_id = result.get("appointment_id")
                    resp = {"English": f"Done! Your appointment with {state['doctor']} on {state['date']} at {state['time']} is confirmed. Your ID is #{appt_id}.",
                            "Hindi":   f"हो गया! {state['date']} को {state['time']} बजे {state['doctor']} के साथ आपका अपॉइंटमेंट पुष्ट हो गया। आपकी आईडी #{appt_id} है।",
                            "Tamil":   f"முடிந்தது! {state['date']} அன்று {state['time']}க்கு {state['doctor']}உடன் உங்கள் அப்பாயிண்ட்மெண்ட் உறுதி. உங்கள் ID #{appt_id}."}.get(lang)
                    tool_call = {"name": "book_appointment", "arguments": state}
                else:
                    resp = {"English": f"Sorry, that slot is not available. {result.get('message', '')} Shall we try a different time?",
                            "Hindi":   f"क्षमा करें, वह समय उपलब्ध नहीं है। {result.get('message', '')} क्या हम कोई और समय आजमाएं?",
                            "Tamil":   f"மன்னிக்கவும், அந்த நேரம் கிடைக்கவில்லை. {result.get('message', '')} வேறு நேரம் முயற்சிக்கலாமா?"}.get(lang)
                    tool_call = None
                    state["step"] = "ask_time"
                    state["time"] = None
                # Reset state after successful booking
                state["step"] = "done"
                agent_data = self._pack("booking", lang, resp, "Appointment booking executed.", state)
                agent_data["tool_call"] = tool_call
                return agent_data, {**self._make_default_state()}  # fresh state
            else:
                state["step"] = "start"
                state.update({"doctor": None, "date": None, "time": None})
                resp = {"English": "No problem! Let's start over. Which doctor would you like?",
                        "Hindi":   "कोई बात नहीं! फिर से शुरू करते हैं। आप किस डॉक्टर से मिलना चाहते हैं?",
                        "Tamil":   "பரவாயில்லை! மீண்டும் தொடங்குவோம். எந்த மருத்துவரை பார்க்க விரும்புகிறீர்கள்?"}.get(lang)
                return self._pack("booking", lang, resp, "Patient said no — restarting booking flow.", state), state

        # Fallthrough — re-enter from current step
        state["step"] = "ask_doctor"
        resp = {"English": "Let's get started with your booking. Which doctor would you like to see?",
                "Hindi":   "आपकी बुकिंग शुरू करते हैं। आप किस डॉक्टर से मिलना चाहते हैं?",
                "Tamil":   "உங்கள் புக்கிங் தொடங்குவோம். எந்த மருத்துவரை சந்திக்க விரும்புகிறீர்கள்?"}.get(lang)
        return self._pack("booking", lang, resp, "Booking initiated.", state), state

    # ── Cancellation flow ──

    def _cancel_flow(self, t: str, state: Dict, lang: str):
        appt_id = state.get("appointment_id") or self._extract_number(t)
        if appt_id:
            result = self.engine.cancel_appointment(appt_id)
            resp = {"English": f"Done. Appointment #{appt_id} has been cancelled.",
                    "Hindi":   f"हो गया। अपॉइंटमेंट #{appt_id} रद्द कर दिया गया है।",
                    "Tamil":   f"முடிந்தது. அப்பாயிண்ட்மெண்ட் #{appt_id} ரத்து செய்யப்பட்டது."}.get(lang)
            state["step"] = "done"
        else:
            resp = {"English": "Please provide your appointment ID so I can cancel it.",
                    "Hindi":   "कृपया अपनी अपॉइंटमेंट आईडी बताएं ताकि मैं रद्द कर सकूं।",
                    "Tamil":   "உங்கள் அப்பாயிண்ட்மெண்ட் ஐடியை தயவுசெய்து தெரிவிக்கவும்."}.get(lang)
            state["step"] = "ask_appointment_id"
        return self._pack("cancellation", lang, resp, f"Cancel attempt, id={appt_id}.", state), state

    # ── Rescheduling flow ──

    def _reschedule_flow(self, t: str, state: Dict, lang: str):
        appt_id = state.get("appointment_id") or self._extract_number(t)
        if not appt_id:
            resp = {"English": "Please give me your appointment ID to reschedule.",
                    "Hindi":   "कृपया पुनर्निर्धारित करने के लिए अपनी अपॉइंटमेंट आईडी दें।",
                    "Tamil":   "மேலும் திட்டமிட உங்கள் அப்பாயிண்ட்மெண்ட் ஐடியை தரவும்."}.get(lang)
            state["step"] = "ask_appointment_id"
            return self._pack("rescheduling", lang, resp, "Asking for appt ID.", state), state

        state["appointment_id"] = appt_id
        if not state.get("date"):
            resp = {"English": "What new date would you like?",
                    "Hindi":   "आप कौन सी नई तारीख चाहते हैं?",
                    "Tamil":   "எந்த புதிய தேதி விரும்புகிறீர்கள்?"}.get(lang)
            state["step"] = "ask_date"
            return self._pack("rescheduling", lang, resp, "Asking for new date.", state), state

        new_date = self._extract_date(t) or state.get("date")
        if not state.get("time"):
            state["date"] = new_date
            resp = {"English": "What time?",
                    "Hindi":   "कितने बजे?",
                    "Tamil":   "எந்த நேரம்?"}.get(lang)
            state["step"] = "ask_time"
            return self._pack("rescheduling", lang, resp, "Asking for new time.", state), state

        new_time = self._extract_time(t) or state.get("time")
        result = self.engine.reschedule_appointment(appt_id, new_date, new_time)
        resp = {"English": f"Done! Appointment #{appt_id} moved to {new_date} at {new_time}.",
                "Hindi":   f"हो गया! अपॉइंटमेंट #{appt_id} को {new_date} को {new_time} बजे के लिए स्थानांतरित किया गया।",
                "Tamil":   f"முடிந்தது! அப்பாயிண்ட்மெண்ட் #{appt_id} {new_date} அன்று {new_time}க்கு மாற்றப்பட்டது."}.get(lang)
        state["step"] = "done"
        agent_data = self._pack("rescheduling", lang, resp, "Rescheduling executed.", state)
        agent_data["tool_call"] = {"name": "reschedule_appointment", "arguments": {"appointment_id": appt_id, "new_date": new_date, "new_time": new_time}}
        return agent_data, {**self._make_default_state()}

    # ─────────────────────────────────────────
    # NLP helpers (rule-based extraction)
    # ─────────────────────────────────────────

    def _extract_doctor(self, text: str) -> str | None:
        mapping = {
            "mehta": "Dr. Arjun Mehta",   "arjun": "Dr. Arjun Mehta",
            "cardiolog": "Dr. Arjun Mehta",
            "rao": "Dr. Kavita Rao",       "kavita": "Dr. Kavita Rao",
            "dermatolog": "Dr. Kavita Rao","skin": "Dr. Kavita Rao",
            "williams": "Dr. Sarah Williams","sarah": "Dr. Sarah Williams",
            "pediatr": "Dr. Sarah Williams","child": "Dr. Sarah Williams",
            "kumar": "Dr. Rajesh Kumar",   "rajesh": "Dr. Rajesh Kumar",
            "general": "Dr. Rajesh Kumar", "gp": "Dr. Rajesh Kumar",
            "lakshmi": "Dr. Lakshmi",      "gynecolog": "Dr. Lakshmi",
            "डॉक्टर मेहता": "Dr. Arjun Mehta",
        }
        for key, doctor in mapping.items():
            if key in text:
                return doctor
        return None

    def _extract_date(self, text: str) -> str | None:
        today = datetime.now()
        if "tomorrow" in text or "कल" in text or "நாளை" in text:
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        if "today" in text or "आज" in text or "இன்று" in text:
            return today.strftime("%Y-%m-%d")
        if "day after" in text or "परसों" in text:
            return (today + timedelta(days=2)).strftime("%Y-%m-%d")
        # Try to parse "April 25" or "25 April" style  
        import re
        months = {"january":1,"february":2,"march":3,"april":4,"may":5,"june":6,
                  "july":7,"august":8,"september":9,"october":10,"november":11,"december":12}
        m = re.search(r'(\d{1,2})[\s/-](\w+)', text)
        if m:
            day, month_s = int(m.group(1)), m.group(2).lower()
            if month_s in months:
                return f"{today.year}-{months[month_s]:02d}-{day:02d}"
        m = re.search(r'(\w+)[\s](\d{1,2})', text)
        if m:
            month_s, day = m.group(1).lower(), int(m.group(2))
            if month_s in months:
                return f"{today.year}-{months[month_s]:02d}-{day:02d}"
        return None

    def _extract_time(self, text: str) -> str | None:
        import re
        # "2:30 pm", "10am", "14:00", "10 AM"
        m = re.search(r'(\d{1,2})(?::(\d{2}))?\s*(am|pm)?', text, re.IGNORECASE)
        if m:
            hour = int(m.group(1))
            minute = int(m.group(2)) if m.group(2) else 0
            meridiem = (m.group(3) or "").lower()
            if meridiem == "pm" and hour != 12:
                hour += 12
            elif meridiem == "am" and hour == 12:
                hour = 0
            return f"{hour:02d}:{minute:02d}"
        return None

    def _extract_number(self, text: str) -> str | None:
        import re
        m = re.search(r'\b(\d+)\b', text)
        return m.group(1) if m else None

    # ─────────────────────────────────────────
    # Utilities
    # ─────────────────────────────────────────

    def _greet(self, lang: str):
        responses = {
            "English": "Hello! I'm your 2Care AI assistant. I can help you book, cancel, or reschedule appointments. How can I help you today?",
            "Hindi":   "नमस्ते! मैं आपका 2Care AI सहायक हूँ। मैं आपके अपॉइंटमेंट बुक, रद्द या पुनर्निर्धारित करने में मदद कर सकता हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
            "Tamil":   "வணக்கம்! நான் உங்கள் 2Care AI உதவியாளர். நான் அப்பாயிண்ட்மெண்ட் புக் செய்ய, ரத்து செய்ய அல்லது மாற்ற உதவ முடியும். இன்று நான் எப்படி உதவ முடியும்?"
        }
        return responses.get(lang, responses["English"]), "Greeting response generated."

    def _make_default_state(self):
        return {"intent": None, "step": "start", "doctor": None, "date": None, "time": None, "appointment_id": None}

    def _pack(self, intent: str, lang: str, response_text: str, trace: str, next_state: Dict) -> Dict:
        return {
            "intent": intent,
            "language": lang,
            "response_text": response_text,
            "tool_call": None,
            "reasoning_trace": trace,
            "next_state": next_state
        }
