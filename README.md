# IncidentMind 🧠⚡

**Self-Learning On-Call Incident Response Agent for Fintech Payment Gateways**

IncidentMind is an AI agent built for fintech payment engineering teams (handling high-volume UPI and card gateway outages). Unlike standard RAG or static prompt systems, **IncidentMind remembers every past incident**—error signatures, root causes, attempted fixes, historical success rates, and engineer attributions. When a new outage alert fires, it recalls past evidence from **Hindsight (Vectorize)** memory and recommends the fix with the proven highest historical success rate.

Over time, as engineers submit feedback ("Fix worked" / "Fix failed"), IncidentMind retains the outcomes, allowing its memory bank to self-correct: remedies that cause regressions are downgraded, while effective remedies are promoted.

---

## 🌟 Key Features

1. **Alert Intake & Triage**: Paste raw error logs or select quick presets (`payment-gateway`, `upi-switch`, `ledger-service`, `auth-service`).
2. **Hindsight TEMPR 4-Way Recall & Agent Reasoning**: Recalls matching historical incidents and ranks recommendations strictly by past success rate %.
3. **Self-Correcting Feedback Loop**: "Fix worked" and "Fix failed" buttons retain outcome updates to Hindsight so memory self-corrects over time.
4. **Before/After Side-by-Side Toggle**: Compare generic LLM response (Memory OFF) vs IncidentMind response (Memory ON) side-by-side.
5. **Memory Inspector Panel**: Real-time right sidebar inspecting Hindsight retained memories, recalled evidence snippets, and `reflect()` synthesis.
6. **Learning Curve Chart**: Visualizes first-suggestion success rate growth over time (from 45% baseline up to 92%+).
7. **Proactive Deployment Risk Warning**: Evaluates proposed code/config changes against past incident memories to warn before outages happen.
8. **Synthetic History Generator**: One-click "Seed History" populates 60+ realistic 6-month past incidents, including edge cases (conflicting advice, flaky fixes, repeated incidents).

---

## 🏗️ Architecture

```mermaid
flowchart TD
    User([On-Call Engineer / UI]) -->|1. Submit Alert or Feedback| Frontend[React + Vite + Tailwind UI]
    Frontend -->|2. REST API| FastAPI[FastAPI Backend]
    
    subgraph Backend Engine
        FastAPI -->|3. Query / Retain Memory| MemoryLayer[Hindsight SDK Wrapper]
        FastAPI -->|4. Agent Reasoning| IncidentAgent[Incident Agent]
        IncidentAgent -->|5. Structured Prompt & Tool Retry| LLMWrapper[Groq LLM Client]
        FastAPI -->|6. Learning Curve Stats| StatsStore[Stats Store]
    end
    
    MemoryLayer -->|Official SDK retain/recall/reflect| Hindsight[Hindsight Vectorize API / Cloud]
    LLMWrapper -->|Primary: gpt-oss-120b | Fallback: qwen3-32b| Groq[Groq API]
```

---

## 🧠 How Hindsight Memory is Used

IncidentMind uses the official **Hindsight (Vectorize)** SDK (`hindsight-client`) for agentic memory operations:

### 1. `retain()` & `retain_batch()`
Stores structured incident memories into the `incidentmind-bank` memory bank.
- **What is stored**: Incident ID, timestamp, target service, error code signature, log stack trace, root cause, fix applied, outcome (`WORKED` or `FAILED`), engineer name, and caveat notes.
- **Self-Correction**: When an engineer clicks "Fix worked" or "Fix failed", a new feedback memory observation is retained into Hindsight, updating the bank's beliefs.

### 2. `recall()`
Uses Hindsight's **TEMPR 4-Way Retrieval** (combining world facts, observations, and experience memories with exact source chunk extraction) to retrieve past incidents matching the incoming error signature.

### 3. `reflect()`
Runs agentic reflection across the memory bank to synthesize macro trends, reconcile conflicting advice (e.g., PgBouncer query pooling vs raw Postgres `max_connections` increase), and generate evidence-grounded insights.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your API keys:
```ini
GROQ_API_KEY=gsk_your_groq_api_key_here
PRIMARY_LLM_MODEL=openai/gpt-oss-120b
FALLBACK_LLM_MODEL=qwen/qwen3-32b

# Hindsight Configuration
# Hindsight Cloud: https://api.hindsight.vectorize.io
# Local Open-Source Hindsight Server: http://localhost:8888
HINDSIGHT_BASE_URL=http://localhost:8888
HINDSIGHT_API_KEY=your_hindsight_api_key_here
HINDSIGHT_BANK_ID=incidentmind-bank
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate | On Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install --ignore-scripts
node node_modules/vite/bin/vite.js
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Running with Docker

You can run both IncidentMind and a local open-source Hindsight vector memory server using Docker Compose:

```bash
docker-compose up --build
```
Access the application at [http://localhost:8000](http://localhost:8000).

---

## 🎬 60-Second Demo Script for Judges

1. **Step 1: Seed History (0:05s)**
   - Click the **"Seed History (60 Incidents)"** button in the header.
   - Watch 60 realistic 6-month past incidents load into Hindsight memory bank.

2. **Step 2: Analyze Outage Alert (0:15s)**
   - Click the preset **"PGW: Pool Exhaustion"**.
   - Click **"Recall Hindsight & Analyze Alert"**.
   - Show how IncidentMind ranks PgBouncer pooling at **100% success rate** with attribution to engineer *Priya Sharma*.

3. **Step 3: Before / After Comparison (0:30s)**
   - Click **"Compare Memory OFF vs ON"**.
   - Point out how generic LLM (Memory OFF) gives generic "Restart pod" advice, whereas IncidentMind (Memory ON) identifies the exact root cause and warns against raw connection slot increases.

4. **Step 4: Self-Correcting Feedback (0:45s)**
   - Click **"Fix Worked"** on recommendation #1.
   - Inspect the **Hindsight Memory Inspector** right sidebar to see the live retained memory update and the **Learning Curve Chart** jumping to **92%+ success rate**.

5. **Step 5: Proactive Deploy Safety Check (0:60s)**
   - Click **"Proactive Deploy Risk"** in header and run Preset #1.
   - Show the **HIGH Risk Alert (78%)** warning against increasing Postgres `max_connections` directly.

---

## 🧪 Running Tests

```bash
# Run backend memory and LLM unit tests
$env:PYTHONPATH="backend"
python -m pytest backend/tests/
```
