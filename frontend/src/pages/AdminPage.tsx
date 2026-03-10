import { AdminLayout } from "@/components/admin/AdminLayout";
import { isAdminRole, getCurrentUserRole, type UserRole } from "@/lib/auth";
import { navigateTo } from "@/lib/navigation";

type AdminSection = "aufbauten" | "lampen" | "benutzer" | "stammdaten";

const ADMIN_SECTIONS: Record<
  AdminSection,
  {
    label: string;
    description: string;
    eyebrow: string;
    title: string;
    body: string;
  }
> = {
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

function getActiveSection(): AdminSection {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");

  if (section && section in ADMIN_SECTIONS) {
    return section as AdminSection;
  }

  return "aufbauten";
}

function roleLabel(role: UserRole) {
  if (role === "anonymous") {
    return "nicht angemeldet";
  }

  return role;
}

function AdminAccessDenied({ role }: { role: UserRole }) {
  return (
    <div className="min-h-screen bg-stone-950 px-4 py-12 text-stone-100 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-500/20 bg-[linear-gradient(180deg,_rgba(69,10,10,0.88),_rgba(28,25,23,0.96))] p-8 shadow-2xl shadow-stone-950/50">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-200">Zugriff gesperrt</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Admin-Rechte erforderlich</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
          Die Route <span className="font-semibold text-white">/admin</span> ist ausschließlich für Benutzer mit der Rolle
          <span className="font-semibold text-white"> admin</span> freigeschaltet. Aktuelle Rolle:{" "}
          <span className="font-semibold text-white">{roleLabel(role)}</span>.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigateTo("/")}
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-stone-200"
          >
            Zur Startseite
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const role = getCurrentUserRole();

  if (!isAdminRole(role)) {
    return <AdminAccessDenied role={role} />;
  }

  const activeSection = getActiveSection();
  const currentSection = ADMIN_SECTIONS[activeSection];

  return (
    <AdminLayout
      activeSection={activeSection}
      currentSection={{
        id: activeSection,
        label: currentSection.label,
        description: currentSection.description
      }}
      navigationItems={Object.entries(ADMIN_SECTIONS).map(([id, section]) => ({
        id: id as AdminSection,
        label: section.label,
        description: section.description
      }))}
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.9fr)]">
        <article className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-amber-200">{currentSection.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">{currentSection.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">{currentSection.body}</p>
        </article>
        <aside className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
          <h2 className="text-lg font-semibold text-white">Freigabe</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <dt className="text-stone-500">Rollenprüfung</dt>
              <dd className="mt-2 font-medium text-white">nur `admin`</dd>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <dt className="text-stone-500">Aktive Route</dt>
              <dd className="mt-2 font-medium text-white">/admin?section={activeSection}</dd>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <dt className="text-stone-500">Status</dt>
              <dd className="mt-2 font-medium text-white">Grundstruktur implementiert</dd>
            </div>
          </dl>
        </aside>
      </section>
    </AdminLayout>
  );
}
