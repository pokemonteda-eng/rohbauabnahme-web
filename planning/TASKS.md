# 🗂️ TASKS – Rohbauabnahme Web-App

> Stand: 2026-03-06  
> Quelle: `planning/ANALYSIS_AND_PLANNING.md`

## 🚀 Phase 1: Setup (Docker, DB, API)

### Task 1.1 – Docker-Basis für Local Dev
**Beschreibung:** Ein lauffähiges Docker-Setup für Frontend, Backend und PostgreSQL wird erstellt. Ziel ist ein reproduzierbarer lokaler Start mit einem einzigen Befehl.
**Status:** `Backlog`
**Dateien:**
- `docker/docker-compose.yml` (neu)
- `docker/Dockerfile.backend` (neu)
- `docker/Dockerfile.frontend` (neu)
- `.env.example` (neu)

**Akzeptanzkriterien:**
- [ ] `docker compose up` startet alle Services ohne Fehler
- [ ] Backend ist unter einem definierten Port erreichbar
- [ ] Frontend ist unter einem definierten Port erreichbar
- [ ] PostgreSQL ist mit persistiertem Volume konfiguriert

### Task 1.2 – DB-Grundschema + Migration
**Beschreibung:** Das initiale Datenbankschema für Protokolle, Kunden und Zubehör wird in einer ersten Migration angelegt. Tabellenstruktur folgt der Analyse.
**Status:** `Backlog`
**Dateien:**
- `backend/alembic/env.py` (neu/ändern)
- `backend/alembic/versions/0001_initial_schema.py` (neu)
- `backend/app/models/protokoll.py` (neu)
- `backend/app/models/kunde.py` (neu)
- `backend/app/models/zubehoer.py` (neu)

**Akzeptanzkriterien:**
- [ ] Migration läuft lokal durch (`upgrade head`)
- [ ] Tabellen `protokolle`, `kunden`, `zubehoer_katalog` existieren
- [ ] Primär- und Fremdschlüssel sind korrekt gesetzt
- [ ] Rollback der Migration funktioniert

### Task 1.3 – API-Scaffold + Health-Endpunkte
**Beschreibung:** Eine strukturierte FastAPI-Basis mit Versionierung und Health-Check-Endpunkten wird bereitgestellt. Dies dient als Fundament für alle weiteren Features.
**Status:** `Backlog`
**Dateien:**
- `backend/app/main.py` (neu)
- `backend/app/api/v1/api.py` (neu)
- `backend/app/api/v1/endpoints/health.py` (neu)
- `backend/app/core/config.py` (neu)

**Akzeptanzkriterien:**
- [ ] `/health/live` liefert HTTP 200
- [ ] `/health/ready` prüft DB-Verbindung
- [ ] API-Router ist unter `/api/v1` eingebunden
- [ ] Start ohne Runtime-Fehler möglich

## 🧩 Phase 2: UI Kopfteil

### Task 2.1 – Formular-Kopfteil-Komponente (Basisfelder)
**Beschreibung:** Der Kopfteil des Protokolls (Auftrags-Nr., Kunde, Aufbautyp, Datum) wird als eigene Komponente umgesetzt. Die Felder werden mit Grundvalidierung versehen.
**Status:** `Backlog`
**Dateien:**
- `frontend/src/components/forms/ProtokollHeader.tsx` (neu)
- `frontend/src/types/protokoll.ts` (neu)
- `frontend/src/pages/ProtokollPage.tsx` (ändern)

**Akzeptanzkriterien:**
- [ ] Felder sind sichtbar und editierbar
- [ ] Pflichtfelder werden im UI validiert
- [ ] Typen sind in TypeScript sauber abgebildet
- [ ] Komponente ist wiederverwendbar eingebunden

### Task 2.2 – Stammdaten-Dropdowns aus API
**Beschreibung:** Kunde, Projektleiter und Aufbautyp werden aus API-Quellen geladen und als Dropdowns bereitgestellt. Lade- und Fehlerzustände werden sauber dargestellt.
**Status:** `Backlog`
**Dateien:**
- `frontend/src/services/masterDataApi.ts` (neu)
- `frontend/src/hooks/useMasterData.ts` (neu)
- `frontend/src/components/forms/ProtokollHeader.tsx` (ändern)
- `backend/app/api/v1/endpoints/master_data.py` (neu)

**Akzeptanzkriterien:**
- [ ] Dropdown-Optionen kommen aus API-Response
- [ ] Loading-State ist sichtbar
- [ ] Fehler-State zeigt verständliche Meldung
- [ ] Keine Hardcoded-Listen im UI

## 🎨 Phase 3: Lackierung

### Task 3.1 – Lackierungssektion (Checkbox + Bemerkung)
**Beschreibung:** Die Lackierungsfelder aus dem Excel-Vorbild werden als strukturierte UI-Sektion implementiert. Checkboxen und optionale Bemerkungen werden gebunden gespeichert.
**Status:** `Backlog`
**Dateien:**
- `frontend/src/components/forms/LackierungSection.tsx` (neu)
- `frontend/src/types/lackierung.ts` (neu)
- `frontend/src/pages/ProtokollPage.tsx` (ändern)

**Akzeptanzkriterien:**
- [ ] Alle definierten Lackierungsoptionen sind vorhanden
- [ ] Bemerkungsfelder reagieren korrekt auf Aktivierung
- [ ] Form-State bleibt beim Seitenwechsel erhalten
- [ ] Werte werden in Payload korrekt serialisiert

### Task 3.2 – Lackierung API + Persistenz
**Beschreibung:** Lackierungsdaten werden serverseitig entgegengenommen, validiert und gespeichert. Es wird ein Update-Endpunkt für diesen Abschnitt bereitgestellt.
**Status:** `Backlog`
**Dateien:**
- `backend/app/schemas/protokoll.py` (neu/ändern)
- `backend/app/api/v1/endpoints/protokolle.py` (neu/ändern)
- `backend/app/services/validation_service.py` (neu)
- `backend/tests/test_protokoll_lackierung.py` (neu)

**Akzeptanzkriterien:**
- [ ] API akzeptiert nur gültige Lackierungsdaten
- [ ] Ungültige Payload liefert verständlichen 4xx-Fehler
- [ ] Daten sind nach Reload unverändert vorhanden
- [ ] Mindestens ein API-Test ist grün

## 🛠️ Phase 4: Zubehör (inkl. Preisberechnung)

### Task 4.1 – Zubehör-UI mit Kategorien
**Beschreibung:** Zubehör wird als kategorisierte Auswahloberfläche (z. B. Aufbau, Rahmen, Schränke) dargestellt. Mehrfachauswahl und klare Gruppierung stehen im Fokus.
**Status:** `Backlog`
**Dateien:**
- `frontend/src/components/forms/ZubehoerSection.tsx` (neu)
- `frontend/src/components/forms/ZubehoerCategory.tsx` (neu)
- `frontend/src/types/zubehoer.ts` (neu)

**Akzeptanzkriterien:**
- [ ] Kategorien sind visuell getrennt dargestellt
- [ ] Auswahlzustand bleibt stabil bei Re-Render
- [ ] Accessibility-Basis (Labels, Fokus) ist vorhanden
- [ ] Keine Duplikate bei mehrfacher Auswahl

### Task 4.2 – Preisberechnungslogik (Netto, €/TEA, €/TEK)
**Beschreibung:** Die Berechnung der Zubehörpreise wird als klarer Service implementiert und mit UI gekoppelt. Änderungen an Positionen aktualisieren Summen sofort.
**Status:** `Backlog`
**Dateien:**
- `backend/app/services/calculation_service.py` (neu)
- `backend/app/api/v1/endpoints/zubehoer.py` (neu)
- `frontend/src/services/pricing.ts` (neu)
- `frontend/src/components/forms/ZubehoerSection.tsx` (ändern)
- `backend/tests/test_calculation_service.py` (neu)

**Akzeptanzkriterien:**
- [ ] Netto-Gesamt wird korrekt berechnet
- [ ] €/TEA und €/TEK werden konsistent berechnet
- [ ] Berechnung ist mit Unit-Tests abgedeckt
- [ ] UI zeigt aktualisierte Preise ohne manuellen Refresh

## 🔧 Phase 5: Technische Änderungen

### Task 5.1 – UI für technische Änderungen
**Beschreibung:** Der Abschnitt für Kabel-/Funklayout-Änderungen und technische Hinweise wird als eigenes Form-Modul umgesetzt. Ja/Nein-Logik steuert Pflichtfelder.
**Status:** `Backlog`
**Dateien:**
- `frontend/src/components/forms/TechnAenderungSection.tsx` (neu)
- `frontend/src/types/technAenderung.ts` (neu)
- `frontend/src/pages/ProtokollPage.tsx` (ändern)

**Akzeptanzkriterien:**
- [ ] Toggle für „Layout geändert“ funktioniert stabil
- [ ] Textfeld wird bei Bedarf als Pflichtfeld validiert
- [ ] Datumsfeld ist integriert
- [ ] Fehlerhinweise sind klar und nah am Feld

### Task 5.2 – Audit-Logging für Änderungen
**Beschreibung:** Änderungen an technischen Feldern werden im Audit-Log nachvollziehbar gespeichert. Dadurch werden Nachverfolgbarkeit und Compliance verbessert.
**Status:** `Backlog`
**Dateien:**
- `backend/app/models/protokoll_audit.py` (neu)
- `backend/app/services/audit_service.py` (neu)
- `backend/app/api/v1/endpoints/protokolle.py` (ändern)
- `backend/tests/test_audit_log.py` (neu)

**Akzeptanzkriterien:**
- [ ] Jede relevante Feldänderung erzeugt einen Audit-Eintrag
- [ ] Alter und neuer Wert werden gespeichert
- [ ] Ändernder Benutzer wird referenziert
- [ ] Audit-Daten sind pro Protokoll abrufbar

## 📄 Phase 6: PDF & Export

### Task 6.1 – PDF-Template + Render-Service
**Beschreibung:** Ein HTML-basiertes Protokoll-Template wird erstellt und als PDF gerendert. Der Export bildet die Kernsektionen inkl. Preise ab.
**Status:** `Backlog`
**Dateien:**
- `backend/app/templates/protokoll_template.html` (neu)
- `backend/app/services/pdf_service.py` (neu)
- `backend/app/api/v1/endpoints/export.py` (neu)

**Akzeptanzkriterien:**
- [ ] PDF wird serverseitig erzeugt
- [ ] Export enthält Kopfteil, Lackierung, Zubehör und technische Änderungen
- [ ] Layout ist auf A4 stabil
- [ ] Download-Endpunkt liefert korrektes MIME-Type

### Task 6.2 – Datenexport (JSON/Excel)
**Beschreibung:** Neben PDF wird ein strukturierter Export für Weiterverarbeitung bereitgestellt. Mindestens JSON und optional Excel werden unterstützt.
**Status:** `Backlog`
**Dateien:**
- `backend/app/services/export_service.py` (neu)
- `backend/app/api/v1/endpoints/export.py` (ändern)
- `backend/tests/test_export_endpoints.py` (neu)

**Akzeptanzkriterien:**
- [ ] JSON-Export enthält vollständige Protokolldaten
- [ ] Export-Endpunkt validiert Protokoll-ID sauber
- [ ] Fehlerfälle liefern klare API-Responses
- [ ] Mindestens ein automatisierter Export-Test ist grün

## 🔐 Phase 7: Auth & Berechtigungen

### Task 7.1 – JWT Login + Rollenmodell
**Beschreibung:** Basis-Authentifizierung mit JWT sowie Rollen (z. B. Admin, Projektleiter, Viewer) wird eingeführt. Tokens schützen sensible Endpunkte.
**Status:** `Backlog`
**Dateien:**
- `backend/app/core/security.py` (neu)
- `backend/app/models/user.py` (neu)
- `backend/app/api/v1/endpoints/auth.py` (neu)
- `backend/app/schemas/auth.py` (neu)

**Akzeptanzkriterien:**
- [ ] Login liefert gültiges Access-Token
- [ ] Ungültige Credentials führen zu 401
- [ ] Token-Validierung schützt private Endpunkte
- [ ] Rollen sind im User-Modell hinterlegt

### Task 7.2 – Rechteprüfung auf Endpunkte & UI
**Beschreibung:** Rollenabhängige Zugriffe werden in API und Frontend durchgesetzt. Nicht berechtigte Aktionen werden klar blockiert.
**Status:** `Backlog`
**Dateien:**
- `backend/app/api/deps/permissions.py` (neu)
- `backend/app/api/v1/endpoints/protokolle.py` (ändern)
- `frontend/src/hooks/usePermissions.ts` (neu)
- `frontend/src/components/auth/Guard.tsx` (neu)

**Akzeptanzkriterien:**
- [ ] Schreibzugriffe sind rollenbasiert eingeschränkt
- [ ] Unberechtigte API-Zugriffe liefern 403
- [ ] UI blendet gesperrte Aktionen aus
- [ ] Rechteverhalten ist in mindestens einem Integrationstest geprüft

## ✅ Definition of Done

- [ ] Task ist fachlich umgesetzt und lokal manuell geprüft
- [ ] Relevante Unit-/API-Tests sind vorhanden und grün
- [ ] Code ist gelintet/formatiert und ohne kritische Warnungen
- [ ] Dokumentation/README für neue Module wurde ergänzt
- [ ] Akzeptanzkriterien des Tasks vollständig erfüllt
- [ ] Kein bekannter Blocker mehr offen

## ❓ Blocker/Fragen

- [ ] VBA-Logik ist noch nicht vollständig extrahiert und fachlich verifiziert
- [ ] Finale Preisformeln für `€/TEA` und `€/TEK` müssen mit Fachbereich bestätigt werden
- [ ] Rechtsanforderungen für digitale Unterschriften sind offen
- [ ] Zielumfang für Excel-Export (Format/Treue zum Original) ist noch nicht final
- [ ] Rollen- und Rechte-Matrix muss mit Stakeholdern abgestimmt werden
