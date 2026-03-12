# Backend

FastAPI-Basis für die Rohbauabnahme-Web-App.

## Start lokal

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Healthcheck: `GET /health`

## Auth-Konfiguration

Die Admin-Authentifizierung ist absichtlich standardmaessig deaktiviert. Fuer Login und JWT-Ausstellung muessen folgende Umgebungsvariablen gesetzt sein:

- `AUTH_LOGIN_USERNAME`
- `AUTH_LOGIN_PASSWORD_HASH` mit einem gueltigen bcrypt- oder `crypt`-Hash
- `JWT_SECRET_KEY` mit einem langen, zufaelligen Secret

## Admin-Lampentypen API

`/api/v1/lampen-typen` ist komplett admin-geschuetzt und erwartet ein Bearer-Access-Token mit Rolle `admin`.

- `GET /api/v1/lampen-typen`: listet alle Lampentypen inklusive `version` fuer konkurrierende Schreibzugriffe.
- `POST /api/v1/lampen-typen`: legt einen neuen Lampentyp an; doppelte `name`-Werte liefern `409 Conflict`.
- `PATCH /api/v1/lampen-typen/{lampentyp_id}`: erwartet im JSON-Body eine aktuelle `version`; bei veralteter Version wird `409 Conflict` mit `Lampentyp wurde zwischenzeitlich geaendert` zurueckgegeben.
- `DELETE /api/v1/lampen-typen/{lampentyp_id}?version={version}`: loescht nur bei passender aktueller `version`; veraltete Versionen liefern ebenfalls `409 Conflict`.
