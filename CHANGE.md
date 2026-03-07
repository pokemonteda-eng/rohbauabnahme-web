# CHANGE.md - rohbauabnahme-web

## Aktive Tickets

### R009 - DB Zubehör-Auswahl als JSONB
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** R007
- **Nächster Schritt:** Review abwarten
- **Branch:** feature/R009-zubehoer-jsonb
- **PR-Link:** https://github.com/pokemonteda-eng/rohbauabnahme-web/pull/10
- **CI Status:** ⏳ ausstehend
- **Notizen:** Neue JSONB-Spalte `protokolle.zubehoer_auswahl` inkl. Migration, Modell-Update und Tests
- **Fehler (2026-03-07):** Lokaler Testlauf fehlgeschlagen, da `pytest` in der aktuellen Umgebung nicht installiert ist (`/bin/bash: pytest: command not found`).
- **Fixplan:** 1) Backend-Abhaengigkeiten mit `pip install -r backend/requirements.txt` installieren. 2) R009-Tests erneut ausfuehren (`pytest -q tests/test_migration_20260307_0004_add_zubehoer_auswahl_jsonb.py tests/test_protokoll_model.py`). 3) Ergebnis in `CHANGE.md` nachziehen und CI-Status aktualisieren.
- **Fehler (2026-03-07):** Push auf `origin/feature/R009-zubehoer-jsonb` fehlgeschlagen (`Could not resolve host: github.com`).
- **Fixplan:** 1) Netzwerk/DNS fuer GitHub im Ausfuehrungsumfeld freischalten. 2) `git push origin feature/R009-zubehoer-jsonb` erneut ausfuehren. 3) Bestehende PR #10 pruefen und Ticket-Link im PR-Body verifizieren.

### CI006 - Lint + Type-Check Workflow
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** none
- **Nächster Schritt:** Review abwarten, dann mergen
- **Branch:** feature/CI006-lint-typecheck
- **PR-Link:** tbd
- **CI Status:** ⏳ ausstehend
- **Notizen:** Neuer GitHub Actions Workflow für ESLint, TypeScript Type-Check, Ruff und Pyright erstellt

### CI002 - Frontend Tests
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** none
- **Nächster Schritt:** Review abwarten, dann mergen
- **Branch:** feature/CI002-frontend-tests
- **PR-Link:** https://github.com/pokemonteda-eng/rohbauabnahme-web/pull/8
- **CI Status:** ✅ SUCCESS (Frontend Tests)
- **Notizen:** Bereit zum Merge (CLEAN, grün)

### CI003 - Playwright E2E Tests
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** none
- **Nächster Schritt:** Review abwarten, dann mergen
- **Branch:** feature/CI003-e2e-tests
- **PR-Link:** https://github.com/pokemonteda-eng/rohbauabnahme-web/pull/9
- **CI Status:** ✅ SUCCESS (E2E Tests)
- **Notizen:** Bereit zum Merge (CLEAN, grün)

### R006 - Protokoll-Kopfdaten
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** none
- **Nächster Schritt:** Review abwarten
- **Branch:** feature/add-planning-folder
- **PR-Link:** https://github.com/pokemonteda-eng/rohbauabnahme-web/pull/6
- **CI Status:** - (keine Checks)
- **Notizen:** Offen, wartet auf Review

### R007 - DB Lackierungsdaten
- **Status:** Überprüfung
- **Blocker:** none
- **Voraussetzungen:** none
- **Nächster Schritt:** Review abwarten
- **Branch:** feature/R007-lackierungsdaten
- **PR-Link:** https://github.com/pokemonteda-eng/rohbauabnahme-web/pull/7
- **CI Status:** - (keine Checks)
- **Notizen:** Offen, wartet auf Review

---

## Fertige Tickets
- R001-R005: Core Features (merged)
- CI001: Backend Tests (merged)

---

## Letzte Aktivität
- 2026-03-07: Ticket R009 umgesetzt, Branch erstellt und PR #10 geöffnet
