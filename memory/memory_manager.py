import redis
import json
import os
from typing import List, Dict, Any

class MemoryManager:
    """
    Manages two memory tiers:
    - Session memory: per-connection chat history (TTL 5 min)
    - Conversation state: booking step machine state (TTL 5 min)
    - Persistent memory: patient preferences (no expiry)
    Falls back to in-process dict if Redis is unavailable.
    """

    def __init__(self):
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", 6379))
        try:
            self.redis = redis.Redis(host=host, port=port, decode_responses=True)
            self.redis.ping()
            self.enabled = True
            print(f"[MemoryManager] Connected to Redis at {host}:{port}")
        except Exception:
            self.enabled = False
            self._store: Dict[str, str] = {}
            print("[MemoryManager] Redis unavailable — using in-process fallback.")

    # ──────────────────────────────────────────────
    # Low-level helpers
    # ──────────────────────────────────────────────

    def _get(self, key: str) -> Any | None:
        if self.enabled:
            raw = self.redis.get(key)
            return json.loads(raw) if raw else None
        return json.loads(self._store[key]) if key in self._store else None

    def _set(self, key: str, value: Any, ttl: int | None = None):
        serialized = json.dumps(value)
        if self.enabled:
            if ttl:
                self.redis.set(key, serialized, ex=ttl)
            else:
                self.redis.set(key, serialized)
        else:
            self._store[key] = serialized

    # ──────────────────────────────────────────────
    # Session chat history (OpenAI message format)
    # ──────────────────────────────────────────────

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return self._get(f"history:{session_id}") or []

    def save_history(self, session_id: str, history: List[Dict[str, str]]):
        # Keep last 20 turns to avoid token overflow; TTL = 5 min
        self._set(f"history:{session_id}", history[-20:], ttl=300)

    def append_turn(self, session_id: str, user_text: str, assistant_text: str):
        history = self.get_history(session_id)
        history.append({"role": "user",      "content": user_text})
        history.append({"role": "assistant", "content": assistant_text})
        self.save_history(session_id, history)

    # ──────────────────────────────────────────────
    # Booking state machine (step + collected slots)
    # ──────────────────────────────────────────────

    DEFAULT_STATE = {
        "intent":  None,   # "booking" | "cancellation" | "rescheduling"
        "step":    "start", # see state machine doc
        "doctor":  None,
        "date":    None,
        "time":    None,
        "appointment_id": None,
    }

    def get_state(self, session_id: str) -> Dict[str, Any]:
        return self._get(f"state:{session_id}") or dict(self.DEFAULT_STATE)

    def save_state(self, session_id: str, state: Dict[str, Any]):
        self._set(f"state:{session_id}", state, ttl=300)

    def reset_state(self, session_id: str):
        self.save_state(session_id, dict(self.DEFAULT_STATE))

    # ──────────────────────────────────────────────
    # Persistent patient preferences
    # ──────────────────────────────────────────────

    def get_patient_profile(self, patient_id: str) -> Dict[str, Any]:
        return self._get(f"patient:{patient_id}") or {}

    def save_patient_profile(self, patient_id: str, data: Dict[str, Any]):
        self._set(f"patient:{patient_id}", data)  # no TTL

    def update_patient_profile(self, patient_id: str, updates: Dict[str, Any]):
        profile = self.get_patient_profile(patient_id)
        profile.update(updates)
        self.save_patient_profile(patient_id, profile)
