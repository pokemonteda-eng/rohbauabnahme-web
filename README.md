# rohbauabnahme-web

Web-App fuer Bauabnahme-Prozesse mit Frontend (React + Vite) und Backend (FastAPI).

## Projektstruktur

- `frontend/`: React + TypeScript + Vite
- `backend/`: FastAPI API
- `docker-compose.yml`: Lokales Setup mit Services

## Voraussetzungen

- Node.js 20+
- npm 10+
- Python 3.11+ (fuer Backend lokal)
- Docker + Docker Compose (optional)

## Installation

1. Abhaengigkeiten fuer Frontend installieren:

```bash
cd frontend
npm install
```

2. Optional: Root-Skripte nutzen (delegieren an `frontend`):

```bash
cd ..
npm install
```

## Nutzung

Frontend lokal starten:

```bash
npm run dev
```

Produktions-Build erzeugen:

```bash
npm run build
```

Produktions-Preview starten:

```bash
npm run start
```

Tests ausfuehren:

```bash
npm run test
```

## Docker (optional)

```bash
cp .env.example .env
docker compose up --build
```

Alternative aus dem `docker/`-Ordner:

```bash
docker compose -f docker/docker-compose.yml up --build
```
