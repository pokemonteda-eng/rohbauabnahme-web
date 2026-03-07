# Rohbauabnahme Web

Initiale Projektstruktur für die Web-Anwendung zur Rohbauabnahme.

## Architektur (Startpunkt)

- `backend/` FastAPI-Basis (API, Business-Logik)
- `frontend/` React + TypeScript Basis
- `docker-compose.yml` Container-Orchestrierung (PostgreSQL, Backend, Frontend)

## Quickstart

### Mit Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Alternative aus dem `docker/`-Ordner:

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
