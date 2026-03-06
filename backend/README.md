# Backend

FastAPI-Basis für die Rohbauabnahme-Web-App.

## Start lokal

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Healthcheck: `GET /health`
