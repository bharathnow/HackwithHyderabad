# IncidentMind - Walkthrough & Verification

IncidentMind is an on-call incident response AI agent designed for fintech payment gateway outages (`payment-gateway`, `upi-switch`, `ledger-service`, `auth-service`). It uses **Hindsight (Vectorize)** vector memory to remember historical incident patterns, root causes, attempted remedies, engineer attributions, and efficacy feedback over time.

---

## 🚀 Accomplishments

### Phase 1: Repo Scaffold & Core SDK Wrappers
- Initialized FastAPI backend and React + Vite + Tailwind CSS frontend.
- Created `HindsightWrapper` utilizing the official `hindsight-client` Python SDK for `retain`, `retain_batch`, `recall`, and `reflect`. Included a resilient fallback store when running offline.
- Created `LLMWrapper` supporting Groq API with `openai/gpt-oss-120b` (primary) and `qwen/qwen3-32b` (fallback), robust JSON repair, exponential backoff retries, and crash-prevention fallbacks.

### Phase 2: Synthetic Data & Seed Pipeline
- Generated 60+ realistic past incidents over 6 months in `backend/app/data/synthetic_incidents.json` across `payment-gateway`, `upi-switch`, `ledger-service`, and `auth-service`.
- Included real-world edge cases: conflicting advice (PgBouncer query pooling vs direct connection slot increases), flaky fixes (pod restarts failing when root cause is expired mTLS cert), and repeated incidents.
- Built a one-click **"Seed History"** endpoint to retain all 60 incidents into Hindsight bank `incidentmind-bank`.

### Phase 3 & 4: Agent Reasoning, API & Feedback Loop
- Built `IncidentAgent` to perform TEMPR 4-way retrieval from Hindsight, run `reflect()` for agentic synthesis, and produce ranked recommendations strictly ordered by historical success rate %.
- Exposed REST API endpoints: `/api/alerts/analyze`, `/api/feedback`, `/api/proactive-warning`, `/api/seed`, `/api/memories`, and `/api/stats`.
- Implemented **Feedback Loop**: "Fix worked" / "Fix failed" buttons retain outcome updates to Hindsight so memory self-corrects and updates the **Learning Curve Chart** dynamically.

### Phase 5 & 6: Polished UI, Docker & Documentation
- Built a sleek, dark-themed React dashboard featuring:
  - **Demo Header**: One-click "Seed History" button, memory status indicator, and "Proactive Deploy Risk" launcher.
  - **Alert Intake Panel**: Presets for 4 payment gateway outage scenarios, service selectors, and Hindsight Memory ON/OFF toggle switch.
  - **Incident Analysis View**: Likely root cause, confidence score %, ranked fixes with success bars, engineer attribution, and feedback buttons.
  - **Side-by-Side Comparison**: Compare generic LLM response (Memory OFF) vs IncidentMind response (Memory ON).
  - **Memory Inspector Panel**: Live right sidebar inspecting Hindsight retained memories, recalled TEMPR evidence, and `reflect()` synthesis.
  - **Learning Curve Chart**: Visualizing first-suggestion success rate growth over time (45% -> 92%+).
  - **Proactive Deployment Safety Guard**: Evaluates proposed deployment changes against past incident memories before code goes live.
- Configured root `Dockerfile`, `docker-compose.yml`, `.env.example`, `requirements.txt`, and comprehensive `README.md` with architecture diagram, Hindsight memory guide, and 60-second hackathon pitch demo script.

---

## 🧪 Verification Results

### Automated Unit Tests
Executed pytest test suite across memory, LLM wrapper, seed pipeline, and API endpoints:
```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests/
```
Result: **11 passed in 0.52s** (`test_phase1_smoke.py`, `test_phase2_seed.py`, `test_phase3_api.py`).

### Frontend Production Build
Executed Vite production build:
```bash
node node_modules/vite/bin/vite.js build
```
Result: **Clean production build** (`dist/index.html`, `dist/assets/index-CEW860aF.css`, `dist/assets/index-11kUa2f_.js`).

---

## 🎬 60-Second Hackathon Demo Flow

1. Click **"Seed History (60 Incidents)"** in top header to retain synthetic dataset into Hindsight.
2. Select **"PGW: Pool Exhaustion"** preset and click **"Recall Hindsight & Analyze Alert"**.
3. Inspect ranked recommendations: PgBouncer connection pooling is ranked #1 with **100% success rate** and attributed to *Priya Sharma*.
4. Click **"Compare Memory OFF vs ON"** to demonstrate how generic LLM gives generic "Restart pod" advice, while IncidentMind pinpoints the exact root cause.
5. Click **"Fix Worked"** to see feedback retained to Hindsight and watch the **Learning Curve Chart** jump to **92%+ success rate**.
6. Open **"Proactive Deploy Risk"** in header to analyze a mock database deployment change and receive a **HIGH Risk (78%)** warning based on past incident memories.
