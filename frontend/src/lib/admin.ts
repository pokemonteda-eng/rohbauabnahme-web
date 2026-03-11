export type AdminSection = "aufbauten" | "lampen" | "benutzer" | "stammdaten";

export type Lampentyp = {
  id: number;
  name: string;
  beschreibung: string;
  icon_url: string;
  standard_preis: number;
  angelegt_am: string;
  aktualisiert_am: string;
};

export type LampentypPayload = {
  name: string;
  beschreibung: string;
  icon_url: string;
  standard_preis: number;
};

export type AdminSectionContent = {
  label: string;
  description: string;
  eyebrow: string;
  title: string;
  body: string;
};

export const DEFAULT_ADMIN_SECTION: AdminSection = "aufbauten";

export const ADMIN_SECTIONS: Record<AdminSection, AdminSectionContent> = {
  aufbauten: {
    label: "Aufbauten",
    description: "Grundstruktur für die spätere Verwaltung von Fahrzeugaufbauten und Medien.",
    eyebrow: "TASK-101 Vorbereitung",
    title: "Aufbau-Verwaltung vorbereiten",
    body: "Hier werden CRUD-Ansichten für Aufbautypen und zugehörige PNG-Vorlagen angedockt. Die Routing-Struktur steht bereits stabil unter /admin."
  },
  lampen: {
    label: "Lampen",
    description: "Reservierter Einstiegspunkt für Lampentypen, Konfigurationen und Zuordnungen.",
    eyebrow: "TASK-102 Vorbereitung",
    title: "Lampentypen als eigenes Modul",
    body: "Die Navigation trennt Lampen bereits als eigenen Verantwortungsbereich, damit kommende Formulare und Tabellen ohne Umbau ergänzt werden können."
  },
  benutzer: {
    label: "Benutzer",
    description: "Zentrale Stelle für Rollen, Zuordnungen und zukünftige Benutzerverwaltung.",
    eyebrow: "TASK-104 Vorbereitung",
    title: "Benutzer und Rollen bündeln",
    body: "Der Bereich ist auf das Rollensystem aus TASK-701 ausgerichtet. Admin-Zugriff bleibt auf /admin begrenzt, weitere Rollen bekommen hier bewusst keinen Zutritt."
  },
  stammdaten: {
    label: "Stammdaten",
    description: "Sammelpunkt für Dropdown-Werte und weitere globale Konfiguration.",
    eyebrow: "TASK-103 Vorbereitung",
    title: "Stammdaten konsolidieren",
    body: "Bestehende Stammdaten-Endpunkte können hier später direkt angebunden werden. Das Layout bietet dafür bereits eine eigenständige Content-Fläche."
  }
};

export function isAdminSection(section: string | null): section is AdminSection {
  return section !== null && Object.prototype.hasOwnProperty.call(ADMIN_SECTIONS, section);
}

export function getAdminSectionHref(section: AdminSection) {
  return `/admin?section=${section}`;
}

export function getAdminSectionFromSearch(search: string) {
  const params = new URLSearchParams(search);
  const section = params.get("section");

  if (isAdminSection(section)) {
    return section;
  }

  return DEFAULT_ADMIN_SECTION;
}

async function parseAdminResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let detail = "Admin-Anfrage fehlgeschlagen";

  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) {
      detail = payload.detail;
    }
  } catch {
    // Ignore invalid error bodies and use the fallback message.
  }

  throw new Error(detail);
}

export async function fetchLampentypen() {
  const response = await fetch("/api/v1/lampen-typen");
  return parseAdminResponse<Lampentyp[]>(response);
}

export async function createLampentyp(payload: LampentypPayload) {
  const response = await fetch("/api/v1/lampen-typen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseAdminResponse<Lampentyp>(response);
}

export async function updateLampentyp(id: number, payload: LampentypPayload) {
  const response = await fetch(`/api/v1/lampen-typen/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseAdminResponse<Lampentyp>(response);
}
