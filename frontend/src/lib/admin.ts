export type AdminSection = "aufbauten" | "lampen" | "benutzer" | "stammdaten";

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
    description: "CRUD fuer Fahrzeugaufbauten mit PNG-Vorlagen, Aktivstatus und direkter Vorschau.",
    eyebrow: "TASK-101",
    title: "Aufbau-Verwaltung",
    body: "Aufbauten werden hier zentral gepflegt und stehen anschliessend als aktive Auswahl fuer Folge-Module wie Beleuchtung und Kopfdaten bereit."
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
