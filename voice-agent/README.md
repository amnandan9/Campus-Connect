# Pipecat Voice Agent Microservice — Campus-Connect

This repository contains the independent **Pipecat Voice Agent Application** built as a decoupled microservice. It communicates with the **Campus-Connect Django Backend Server** over HTTPS strictly via authenticated REST APIs.

---

## 🏛️ Microservice Architecture

```
┌────────────────────────────────────────┐          HTTPS REST APIs         ┌───────────────────────────────────────┐
│              Voice Agent               │  ──────────────────────────────►  │             Django Backend            │
│       (Pipecat Framework App)          │     (X-API-KEY / Bearer Auth)     │       (PythonAnywhere Server)         │
│                                        │                                   │                                       │
│  - STT / TTS / LLM Pipeline            │  ◄──────────────────────────────  │  - Single Source of Truth             │
│  - Natural Command Parser              │            JSON Data              │  - SQLite Database (Server-only)      │
│  - Standalone Microservice             │                                   │  - Secure API Endpoints (/api/v1/...) │
└────────────────────────────────────────┘                                   └───────────────────────────────────────┘
```

The Django server remains the **single source of truth**. The voice agent never accesses SQLite database files directly or relies on local file paths.

---

## 🚀 Quick Setup & Installation

### 1. Requirements
- Python 3.10+
- Virtual environment

### 2. Installation
```bash
cd voice-agent
python -m venv venv

# On Windows (Powershell)
.\venv\Scripts\Activate.ps1

# On Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```env
# Development Environment (Local IDE)
# DJANGO_API_BASE_URL=http://127.0.0.1:8000

# Production Environment (PythonAnywhere HTTPS)
DJANGO_API_BASE_URL=https://amkeerthana.pythonanywhere.com

# Shared Authentication Key
VOICE_AGENT_API_KEY=campus_connect_voice_secret_key_2026

# Parent Outreach Threshold (Percentage < 40% triggers call requirement)
PARENT_CALL_OUTREACH_THRESHOLD=40.0

LOG_LEVEL=INFO
VOICE_SERVICE_PORT=8765
```

---

## 🧪 Testing the Voice Agent

Run the interactive test harness against either environment:

### Test against Production (PythonAnywhere)
```bash
python test_agent.py --url https://amkeerthana.pythonanywhere.com
```

### Test against Local Development Server
```bash
python test_agent.py --url http://127.0.0.1:8000
```

---

## 📡 Authenticated Django REST API Endpoints

All requests require header `X-API-KEY: campus_connect_voice_secret_key_2026` or `Authorization: Bearer campus_connect_voice_secret_key_2026`.

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/voice/student/?query=Rahul` | `GET` | Get student profile, section, and fee status |
| `/api/v1/voice/marks/` | `POST` | Update student marks & evaluate parent outreach threshold |
| `/api/v1/voice/attendance/` | `POST` | Mark/update student attendance (`present`, `absent`, `late`) |
| `/api/v1/voice/parent/?name=Rahul` | `GET` | Get parent phone number & academic summary |
| `/api/v1/voice/notification/` | `POST` | Create announcement/call notification log |
| `/api/v1/voice/teacher/?username=teacher1` | `GET` | Get teacher profile and assigned sections/subjects |
| `/api/v1/voice/academic-summary/?query=Rahul` | `GET` | Get average score %, attendance %, and fee status |

---

## ☁️ Deployment Instructions

### 1. Django Backend (PythonAnywhere)
In PythonAnywhere Bash Console:
```bash
cd ~/Campus-Connect
git pull origin main
source ~/.virtualenvs/campus-connect-env/bin/activate
python manage.py collectstatic --noinput
python manage.py migrate
```
Then click **Reload amkeerthana.pythonanywhere.com** under the **Web** tab.

### 2. Voice Agent Microservice (Google Cloud Run / Container)
Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8765
EXPOSE 8765
CMD ["python", "main.py"]
```
Deploy to Cloud Run:
```bash
gcloud run deploy pipecat-voice-agent \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DJANGO_API_BASE_URL="https://amkeerthana.pythonanywhere.com",VOICE_AGENT_API_KEY="campus_connect_voice_secret_key_2026"
```
