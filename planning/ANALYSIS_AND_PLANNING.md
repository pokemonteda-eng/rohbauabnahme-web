# Rohbauabnahmeprotokoll - Analyse & Web-App Planning

**Datei:** `301_10_fb_rohbauabnahmeprotokoll-2.xlsm`  
**Analysiert am:** 2026-03-06  
**Dateigröße:** 607 KB (komplexes Excel mit VBA)

---

## 📋 ZUSAMMENFASSUNG

Dies ist ein **Fachbereichs-Formular** für die Abnahme von Fahrzeugaufbauten (Rohbau) bei Müller Umwelttechnik. Es handelt sich um ein Multi-Sheet Excel mit umfangreichen VBA-Makros, ActiveX-Controls und komplexer Geschäftslogik.

---

## 🔍 DETAILLIERTE ANALYSE

### 1. Arbeitsblätter (10 Sheets)

| Sheet | Name | Funktion | Komplexität |
|-------|------|----------|-------------|
| 1 | **FB_Rohbauabnahmeprotokoll** | Hauptformular - Eingabe & Übersicht | 🔴 Hoch |
| 2 | **1** | Vermutlich: Detail-Daten/Positionen | 🟡 Mittel |
| 3 | **FZB** | Fahrzeugbezogene Daten | 🟡 Mittel |
| 4 | **Ergebnis** | Berechnete Ergebnisse/Auswertung | 🟡 Mittel |
| 5 | **Lackierung u. Beschichtung** | Spezifikation Oberflächen | 🟢 Niedrig |
| 6 | **Fahrzeugbeschriftung** | Beschriftungs-Details | 🟢 Niedrig |
| 7 | **Fahrzeugbeleuchtung** | Beleuchtungskonfiguration | 🟢 Niedrig |
| 8 | **Zubehör** | Zubehör-Liste & Preise | 🟡 Mittel |
| 9 | **Kabel u. Funklayout** | Elektrische Installation | 🟢 Niedrig |
| 10 | **Techn. Änderung** | Änderungsmanagement | 🟡 Mittel |

### 2. Named Ranges (Definierte Namen)

```
Aufbautyp              → FB_Rohbauabnahmeprotokoll!$F$4
Auftrags_Nr           → FB_Rohbauabnahmeprotokoll!$S$3
Bedienung1            → FB_Rohbauabnahmeprotokoll!$AK$69:$AK$83
Bedienung2            → FB_Rohbauabnahmeprotokoll!$AL$69:$AL$83
BedienungVom          → FB_Rohbauabnahmeprotokoll!$U$69:$X$83
Bereich_Gesamt        → Komplexer zusammengesetzter Bereich
```

### 3. Tabellen (7 Data Tables)

- `table1.xml` bis `table7.xml` - Wahrscheinlich Lookup-Tabellen für:
  - Zubehör-Katalog
  - Preislisten
  - Auswahllisten (Dropdowns)
  - Validierungsregeln

### 4. ActiveX Controls (12 Stück)

Die Datei enthält 12 ActiveX-Controls (Formular-Elemente mit VBA-Code):
- `activeX1.bin` bis `activeX12.bin`

Diese sind typischerweise:
- Checkboxen
- Dropdown-Listen
- Buttons
- Textfelder mit spezieller Validierung

### 5. VBA-Projekt (637 KB!)

**Sehr umfangreich!** Das VBA-Projekt ist 637 KB groß - das bedeutet:
- Mehrere hundert Zeilen Code
- Mehrere Module/Klassen
- Event-Handler für Formular-Interaktionen
- Datenvalidierung
- Berechnungslogik
- Druck-/Export-Funktionen
- Wahrscheinlich: PDF-Generierung

### 6. Custom UI/Ribbon

- **9 PNG-Icons** im `customUI/images/` Ordner
- `customUI14.xml` - Ribbon-Anpassung
- Eigene Toolbar-Buttons mit Makro-Zuweisung

### 7. Drawings & Bilder

- **22 Bilder** (EMF/PNG) - vermutlich:
  - Schaltpläne
  - Fahrzeugschemata
  - Unterschriftenfelder
  - Logos

### 8. Druckereinstellungen

- 10 verschiedene `printerSettings` - spezifische Drucklayouts für verschiedene Berichte

---

## 🏗️ EMPFOHLENE ARCHITEKTUR

### Technologie-Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Vue)                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Formular    │ │   Preview    │ │   PDF Generator      │ │
│  │  (Stepper)   │ │   (Live)     │ │   (Client-side)    │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│                    React Hook Form + Yup                    │
└─────────────────────────┬───────────────────────────────────┘
                          │ REST API / GraphQL
┌─────────────────────────▼───────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Auth/JWT    │ │  Business    │ │  Calculation         │ │
│  │              │ │  Logic       │ │  Engine              │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Templates   │ │  PDF Gen     │ │  Email/Export        │ │
│  │  Service     │ │  (WeasyPrint)│ │  Service             │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │ SQLAlchemy
┌─────────────────────────▼───────────────────────────────────┐
│                    DATABASE (PostgreSQL)                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Protokolle  │ │  Kunden      │ │  Zubehör-Katalog     │ │
│  │  (JSONB)     │ │              │ │                      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │
│  │  Templates   │ │  Audit Log   │ │  Users/Roles         │ │
│  │              │ │              │ │                      │ │
│  └──────────────┘ └──────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Empfohlener Tech Stack

| Layer | Technologie | Begründung |
|-------|-------------|------------|
| **Frontend** | **React 18 + TypeScript** | Komplexe Formulare, Type Safety |
| **State** | React Query + Zustand | Server-State, Form-State |
| **Forms** | React Hook Form + Zod | Performance, Validierung |
| **UI Lib** | shadcn/ui + Tailwind | Moderne Komponenten |
| **Backend** | **FastAPI (Python)** | Performance, VBA-Porting |
| **ORM** | SQLAlchemy 2.0 | Flexibel, Typ-Support |
| **DB** | **PostgreSQL 15** | JSONB für flexible Daten |
| **PDF** | WeasyPrint + Jinja2 | HTML→PDF, wie Excel-Templates |
| **Auth** | OAuth2 + JWT | Sicher, Standard |
| **Files** | MinIO/S3 | Bilder, PDFs |
| **Docker** | Multi-stage builds | Production-ready |

---

## 📁 PROJEKTSTRUKTUR

```
rohbauabnahme-web/
├── docker/
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.yml
│   └── nginx.conf
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── protokolle.py
│   │   │   │   │   ├── kunden.py
│   │   │   │   │   ├── zubehoer.py
│   │   │   │   │   └── export.py
│   │   │   │   └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── exceptions.py
│   │   ├── models/
│   │   │   ├── protokoll.py
│   │   │   ├── kunde.py
│   │   │   └── zubehoer.py
│   │   ├── schemas/
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── calculation_service.py    # VBA-Logik portiert
│   │   │   ├── pdf_service.py
│   │   │   └── validation_service.py
│   │   ├── templates/
│   │   │   └── protokoll_template.html
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── forms/
│   │   │   │   ├── ProtokollForm/
│   │   │   │   ├── LackierungSection/
│   │   │   │   ├── ZubehoerSection/
│   │   │   │   └── ...
│   │   │   └── ui/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   ├── public/
│   └── package.json
├── shared/
│   └── types/              # Gemeinsame TypeScript-Types
└── docs/
    ├── vba-mapping.md      # VBA → Python Mapping
    └── api-spec.yml
```

---

## 🔄 FUNKTIONS-MAPPING (Excel → Web)

### Hauptformular (FB_Rohbauabnahmeprotokoll)

| Excel-Feld | Web-Entität | Validierung | Bemerkung |
|------------|-------------|-------------|-----------|
| Kunde | Kunde (Autocomplete) | Pflicht | Master-Daten |
| Aufbautyp | Dropdown | Pflicht | FB, FZB, etc. |
| Auftrags-Nr. | Text | Eindeutig | Prüfung auf Dopplung |
| Vertriebsgebiet | Dropdown | - | Lookup-Table |
| Projektleiter | Dropdown | Pflicht | User-Liste |
| Datum | DatePicker | Pflicht | Standard: Heute |

### Lackierung u. Beschichtung (Sheet 5)

```
Klarlackschicht        → Checkbox + Textfeld
Zinkstaubbeschichtung  → Checkbox + Textfeld  
E-Kolbenbeschichtung   → Checkbox + Textfeld
Projektleiter MU       → Dropdown
```

### Bedienung (Named Ranges)

```
Bedienung1, Bedienung2 → Dynamic Arrays/Repeaters
BedienungVom           → Datumsbereich-Validierung
```

### Zubehör (Sheet 8) mit Preisen

```
Wird Zubehör vom Kunden beigestellt? → Ja/Nein Toggle
Aufbau                              → Checkbox-Grid
Rahmen                              → Checkbox
Schüttblende Außen/Innen           → Checkboxen
Schrottkasten                       → Checkbox
Schränke (oben/unten/innen)        → Checkboxen
Kleiderschrank                      → Checkbox
Netto Gesamt                        → Auto-Berechnung
€/TEA, €/TEK                        → Preis-Felder
```

### Technische Änderungen (Sheet 10)

```
Hat sich das Kabel oder Funklayout geändert? → Ja/Nein
Technische Änderungen → Textfeld (mehrzeilig)
Datum → DatePicker
Unterschriften → Digital Signature / Upload
```

---

## 📊 DATENMODELL (ER-Entwurf)

```sql
-- Hauptentität: Rohbauabnahmeprotokoll
CREATE TABLE protokolle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auftrags_nr VARCHAR(50) UNIQUE NOT NULL,
    kunde_id UUID REFERENCES kunden(id),
    aufbautyp VARCHAR(20), -- FB, FZB, etc.
    vertriebsgebiet VARCHAR(50),
    projektleiter_id UUID REFERENCES users(id),
    datum DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Lackierung u. Beschichtung
    klarlackschicht BOOLEAN,
    klarlackschicht_bemerkung TEXT,
    zinkstaubbeschichtung BOOLEAN,
    zinkstaubbeschichtung_bemerkung TEXT,
    e_kolbenbeschichtung BOOLEAN,
    e_kolbenbeschichtung_bemerkung TEXT,
    
    -- Zubehör (als JSONB für Flexibilität)
    zubehoer JSONB DEFAULT '{}',
    zubehoer_kunden_beigestellt BOOLEAN DEFAULT FALSE,
    
    -- Technische Änderungen
    kabel_funklayout_geaendert BOOLEAN,
    techn_aenderungen TEXT,
    
    -- Preise
    netto_gesamt DECIMAL(10,2),
    preis_tea DECIMAL(10,2),
    preis_tek DECIMAL(10,2),
    
    -- Status & Workflow
    status VARCHAR(20) DEFAULT 'entwurf', -- entwurf, freigegeben, archiviert
    erstellt_von UUID REFERENCES users(id),
    erstellt_am TIMESTAMP DEFAULT NOW(),
    aktualisiert_am TIMESTAMP DEFAULT NOW(),
    
    -- Unterschriften (Referenzen zu Files)
    unterschrift_mu_file_id UUID,
    unterschrift_kunde_file_id UUID
);

-- Kundenstamm
CREATE TABLE kunden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kunden_nr VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    adresse TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Zubehör-Katalog (aus Excel-Tabellen extrahiert)
CREATE TABLE zubehoer_katalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kategorie VARCHAR(50), -- Aufbau, Rahmen, etc.
    bezeichnung VARCHAR(255),
    artikel_nr VARCHAR(50),
    standard_preis DECIMAL(10,2),
    aktiv BOOLEAN DEFAULT TRUE
);

-- Audit-Log für Änderungen (wichtig für Compliance!)
CREATE TABLE protokoll_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protokoll_id UUID REFERENCES protokolle(id),
    geaendert_von UUID REFERENCES users(id),
    geaendert_am TIMESTAMP DEFAULT NOW(),
    feld VARCHAR(100),
    alter_wert TEXT,
    neuer_wert TEXT
);

-- Files/Attachments
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protokoll_id UUID REFERENCES protokolle(id),
    filename VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 IMPLEMENTIERUNGSPHASEN

### Phase 1: Foundation (Woche 1-2)
- [ ] Docker-Setup mit PostgreSQL
- [ ] FastAPI Basis-Struktur
- [ ] Datenbank-Migrationen (Alembic)
- [ ] Auth-System (JWT)
- [ ] React + Vite Setup
- [ ] Tailwind + shadcn/ui Integration

### Phase 2: Daten-Migration (Woche 3)
- [ ] Excel-Daten extrahieren (openpyxl)
- [ ] Lookup-Tabellen importieren
- [ ] Kunden-Stammdaten migrieren
- [ ] Testdaten-Generator

### Phase 3: Core Features (Woche 4-6)
- [ ] Protokoll-CRUD API
- [ ] Hauptformular (Stepper/Wizard)
- [ ] Zubehör-Grid mit Preisberechnung
- [ ] Auto-Save (Draft-Funktionalität)

### Phase 4: Business Logic (Woche 7-8)
- [ ] VBA-Logik portieren (Python)
- [ ] Berechnungs-Engine
- [ ] Validierungs-Regeln
- [ ] PDF-Generierung

### Phase 5: Advanced Features (Woche 9-10)
- [ ] Unterschriften-Integration
- [ ] E-Mail-Versand
- [ ] Export (Excel/PDF)
- [ ] Dashboard/Auswertungen

### Phase 6: Polish (Woche 11-12)
- [ ] UI/UX Verbesserungen
- [ ] Mobile-Optimierung
- [ ] Performance-Tuning
- [ ] Dokumentation

---

## ⚠️ KRITISCHE PUNKTE

### 1. VBA-Reverse-Engineering
- **637 KB VBA-Code** müssen analysiert werden
- Empfehlung: Excel-Datei mit "VBA-Entschlüsselung" öffnen oder `xlwings`/`pyxlsb` verwenden
- Code-Review: Was machen die Makros genau?

### 2. Complex Validierungen
- Excel hat wahrscheinlich zellbasierte Validierungen
- Diese müssen in Zod-Schemas übersetzt werden
- Abhängigkeiten zwischen Felden (If A then B required)

### 3. ActiveX Controls
- 12 ActiveX-Elemente → React-Komponenten
- Event-Handler neu implementieren
- Zustandsmanagement

### 4. Drucklayouts
- 10 verschiedene Printer Settings
- Entspricht wahrscheinlich verschiedenen PDF-Vorlagen
- WeasyPrint-Templates erstellen

### 5. Unterschriften
- Digitale Unterschriften (Tablet/Touch)
- Oder: Upload gescannter Unterschriften
- Rechtliche Anforderungen prüfen!

---

## 🔧 EMPFEHLUNGEN

### Sofortige Schritte

1. **VBA-Code analysieren:**
   ```bash
   # Tools für VBA-Extraktion:
   # 1. olevba (olefile)
   pip install oletools
   olevba 301_10_fb_rohbauabnahmeprotokoll-2.xlsm > vba_code.txt
   
   # 2. Alternativ: Excel mit xlwings öffnen
   ```

2. **Excel-Struktur verstehen:**
   - Jede Zelle im Hauptformular dokumentieren
   - Formeln identifizieren
   - Abhängigkeiten mappen

3. **Stakeholder-Interview:**
   - Wer nutzt das Formular?
   - Welche Workflows gibt es?
   - Was ist "Must-have" vs "Nice-to-have"?

### Technische Entscheidungen

| Entscheidung | Empfehlung | Begründung |
|--------------|------------|------------|
| **Formular-Layout** | Stepper/Wizard | Besser als 10 Tabs |
| **State Management** | React Query + Zustand | Server-First, Caching |
| **PDF Engine** | WeasyPrint | HTML→PDF, wartbar |
| **File Storage** | MinIO (S3-API) | Self-hosted, kostengünstig |
| **Real-time** | Nicht nötig | Auto-Save reicht |

---

## 📚 NÄCHSTE SCHRITTE

1. [ ] VBA-Code vollständig extrahieren & dokumentieren
2. [ ] Stakeholder-Workshop: Anforderungen klären
3. [ ] Proof-of-Concept: Ein Tab als React-Formular
4. [ ] Daten-Migration-Strategie definieren
5. [ ] UI/UX-Design erstellen (Figma)

---

*Dieses Dokument ist ein Living Document - bei Fragen oder Unklarheiten erweitern!*
