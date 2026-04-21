# 2Care.ai: Real-Time Multilingual Voice AI Agent

## 🚀 Overview
A high-performance, real-time voice AI agent designed for digital healthcare platforms. This agent automates clinical appointment booking, rescheduling, and cancellations across English, Hindi, and Tamil with sub-450ms latency.

## 🏗️ Architecture
The system follows a standard real-time communication pipeline:
1. **Frontend**: React + TS (Vite) with a premium health-dashboard aesthetic.
2. **Backend**: FastAPI (Python) for asynchronous processing.
3. **Agent**: GPT-4o with Tool Calling for intent extraction and reasoning.
4. **Memory**: Dual-layer system using Redis for session context and SQL for persistent history.
5. **Scheduler**: Custom conflict detection engine to prevent double-bookings.

### Latency Optimization Strategy
- **Streaming**: Audio and text are processed in chunks where possible.
- **Async Processing**: Using Python's `asyncio` to parallelize database calls, LLM reasoning, and TTS generation.
- **Global CDNs**: Fast TTS delivery via optimized endpoints.

## 🛠️ Design Decisions

### 1. Memory Design
- **Session Memory**: Transient conversation state stored in Redis with a 1-hour TTL. This keeps the prompt context relevant to the current call.
- **Persistent Memory**: Patient profiles and preferences (like language) are stored in the SQL database, allowing the agent to remember "last doctor" or "preferred language" across different calls.

### 2. Multi-Level Reasoning
The agent doesn't just "chat." It uses a structured tool-call approach:
1. **Identify Intent**: (Booking vs Rescheduling vs Cancelling).
2. **Search Doctors**: Access the live database for available specialties.
3. **Validate Availability**: Cross-reference with the appointment engine before confirming.
4. **Suggest Alternatives**: If a slot is full, the agent proactively offers the next two available slots.

### 3. Outbound Mode
A background task scans for upcoming appointments and initiates proactive reminder calls, handling rescheduling requests mid-stream if the patient is no longer available.

## 📂 Project Structure
```text
├── backend/            # FastAPI Server
├── agent/              # Reasoning Logic & Tools
├── services/           # STT, TTS, Audio Pipeline
├── scheduler/          # Appointment & Conflict Engine
├── memory/             # Redis & Context Manager
└── frontend/           # Vite Dashboard (TS)
```

## 🚦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js & NPM
- Redis (Optional, fallback provided)
- OpenAI API Key

### Setup
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📊 Latency Breakdown (Target: <450ms)
| Stage | Est. Time (ms) |
| :--- | :--- |
| STT processing | ~100ms |
| LLM Reasoning (GPT-4o) | ~200ms |
| TTS Generation | ~120ms |
| Network / Overhead | ~30ms |
| **Total** | **~450ms** |
