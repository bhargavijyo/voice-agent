"""
FastAPI backend for 2Care AI Voice Agent.

Changes from previous version:
- Each WebSocket connection gets a unique session_id (UUID).
- Booking state machine is loaded from memory every turn and persisted back.
- blocking time.sleep() replaced with asyncio.sleep() throughout.
- /ws endpoint (no path param) so frontend can connect without knowing a pre-set session.
- Full latency tracking (STT / LLM / TTS phases).
"""

import time
import uuid
import json
import logging
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from agent.reasoning import ClinicalAgent
from memory.memory_manager import MemoryManager
from scheduler.database import init_db
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("VoiceAgent")

app = FastAPI(title="2Care Voice AI Agent API", version="2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Shared singletons (stateless or self-managing)
agent = ClinicalAgent()
memory = MemoryManager()


@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Database initialised. Agent and Memory ready.")


# ─────────────────────────────────────────
# WebSocket endpoint
# ─────────────────────────────────────────

@app.websocket("/ws")
async def voice_websocket(websocket: WebSocket):
    await websocket.accept()

    # Every connection gets its own unique session
    session_id = str(uuid.uuid4())
    logger.info(f"New session: {session_id}")

    # Send the session_id back to the client so it could be logged/displayed
    await websocket.send_json({"type": "session_init", "session_id": session_id})

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            user_text = data.get("text", "").strip()
            patient_id = data.get("patient_id", "PT-DEMO")

            if not user_text:
                continue

            logger.info(f"[{session_id}] User: {user_text!r}")

            # ── 1. STT phase (mocked; in production Whisper goes here) ──
            stt_t0 = time.perf_counter()
            await asyncio.sleep(0.03)           # non-blocking sleep
            stt_ms = round((time.perf_counter() - stt_t0) * 1000)

            # ── 2. LLM / reasoning phase ──
            llm_t0 = time.perf_counter()

            # Load session state (history + booking state)
            history = memory.get_history(session_id)
            booking_state = memory.get_state(session_id)

            agent_data, new_state = await agent.process(
                user_text, history, booking_state, patient_id
            )

            response_text = agent_data.get("response_text", "")

            # Persist updated state and history
            memory.save_state(session_id, new_state)
            memory.append_turn(session_id, user_text, response_text)

            # Update persistent patient profile with language preference
            lang = agent_data.get("language", "English")
            memory.update_patient_profile(patient_id, {"preferred_language": lang})

            llm_ms = round((time.perf_counter() - llm_t0) * 1000)

            # ── 3. TTS phase (mocked; in production ElevenLabs/Azure TTS goes here) ──
            tts_t0 = time.perf_counter()
            await asyncio.sleep(0.05)           # non-blocking sleep
            tts_ms = round((time.perf_counter() - tts_t0) * 1000)

            total_ms = stt_ms + llm_ms + tts_ms

            latency = {"STT": stt_ms, "LLM": llm_ms, "TTS": tts_ms, "TOTAL": total_ms}

            await websocket.send_json({
                "type":       "agent_response",
                "text":       response_text,
                "agent_data": agent_data,
                "latency":    latency,
                "session_id": session_id,
                "status":     "success"
            })

            logger.info(f"[{session_id}] AI: {response_text!r} | latency={total_ms}ms | intent={agent_data.get('intent')} | step={new_state.get('step')}")

    except WebSocketDisconnect:
        logger.info(f"Session {session_id} disconnected cleanly.")
    except Exception as e:
        logger.error(f"Session {session_id} error: {e}", exc_info=True)
        try:
            await websocket.send_json({"type": "error", "message": "Server error. Please try again."})
        except Exception:
            pass


# ─────────────────────────────────────────
# REST: outbound campaign stub
# ─────────────────────────────────────────

@app.post("/api/campaign/start")
async def start_campaign():
    # Placeholder — wire to OutboundCampaignManager when ready
    return {"status": "started", "message": "Outbound campaign scheduler is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
