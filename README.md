# Rohbauabnahme Web

Initiale Projektstruktur für die Web-Anwendung zur Rohbauabnahme.

## Architektur (Startpunkt)

- `backend/` FastAPI-Basis (API, Business-Logik)
- `frontend/` React + TypeScript + Tailwind + shadcn/ui Basis
- `docker/` Container-Orchestrierung (PostgreSQL, Backend, Frontend)

## Quickstart

### Mit Docker Compose

```bash
docker compose -f docker/docker-compose.yml up --build
```

### Lokal

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```
