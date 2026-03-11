import { type FormEvent, useEffect, useState } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { isAdminRole, getCurrentUserRole, type UserRole } from "@/lib/auth";
import {
  ADMIN_SECTIONS,
  createLampentyp,
  fetchLampentypen,
  getAdminSectionFromSearch,
  getAdminSectionHref,
  type Lampentyp,
  type LampentypPayload,
  updateLampentyp,
  type AdminSection
} from "@/lib/admin";
import { navigateTo } from "@/lib/navigation";

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

const EMPTY_LAMPENTYP_FORM = {
  name: "",
  beschreibung: "",
  icon_url: "",
  standard_preis: "0.00"
};

function LampentypenSection() {
  const [lampentypen, setLampentypen] = useState<Lampentyp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formValues, setFormValues] = useState({
    name: "",
    beschreibung: "",
    icon_url: "",
    standard_preis: "0.00"
  });

  useEffect(() => {
    let isMounted = true;

    async function loadLampentypen() {
      try {
        setIsLoading(true);
        setError(null);
        const entries = await fetchLampentypen();

        if (!isMounted) {
          return;
        }

        setLampentypen(entries);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Lampentypen konnten nicht geladen werden");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLampentypen();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLampentyp = lampentypen.find((entry) => entry.id === selectedId) ?? null;

  function resetForm() {
    setSelectedId(null);
    setFormValues({ ...EMPTY_LAMPENTYP_FORM });
  }

  function startEdit(lampentyp: Lampentyp) {
    setSelectedId(lampentyp.id);
    setFormValues({
      name: lampentyp.name,
      beschreibung: lampentyp.beschreibung,
      icon_url: lampentyp.icon_url,
      standard_preis: lampentyp.standard_preis.toFixed(2)
    });
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: LampentypPayload = {
      name: formValues.name.trim(),
      beschreibung: formValues.beschreibung.trim(),
      icon_url: formValues.icon_url.trim(),
      standard_preis: Number(formValues.standard_preis)
    };

    try {
      const savedLampentyp = selectedLampentyp
        ? await updateLampentyp(selectedLampentyp.id, payload)
        : await createLampentyp(payload);

      setLampentypen((currentEntries) => {
        if (selectedLampentyp) {
          return currentEntries
            .map((entry) => (entry.id === savedLampentyp.id ? savedLampentyp : entry))
            .sort((left, right) => left.name.localeCompare(right.name, "de"));
        }

        return [...currentEntries, savedLampentyp].sort((left, right) => left.name.localeCompare(right.name, "de"));
      });
      resetForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Lampentyp konnte nicht gespeichert werden");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <article className="rounded-3xl border border-stone-800 bg-stone-950/70 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-amber-200">TASK-102</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Lampentypen verwalten</h2>
          </div>
          <button
            type="button"
            className="border-stone-700 bg-stone-950 text-stone-100 hover:bg-stone-900"
            onClick={resetForm}
          >
            Neuer Lampentyp
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">
          Vorhandene Lampentypen werden direkt aus der Admin-API geladen. Einträge können angelegt und bestehende
          Standardwerte angepasst werden.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {isLoading ? (
            <div className="rounded-2xl border border-stone-800 bg-stone-900/80 px-4 py-5 text-sm text-stone-400">
              Lampentypen werden geladen...
            </div>
          ) : lampentypen.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-700 bg-stone-900/60 px-4 py-5 text-sm text-stone-400">
              Noch keine Lampentypen vorhanden.
            </div>
          ) : (
            lampentypen.map((lampentyp) => {
              const isSelected = lampentyp.id === selectedId;

              return (
                <button
                  key={lampentyp.id}
                  type="button"
                  onClick={() => startEdit(lampentyp)}
                  className={[
                    "rounded-2xl border px-4 py-4 text-left transition",
                    isSelected
                      ? "border-amber-300/40 bg-amber-300/10"
                      : "border-stone-800 bg-stone-900/80 hover:border-stone-700 hover:bg-stone-900"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white">{lampentyp.name}</p>
                      <p className="mt-2 text-sm leading-6 text-stone-400">{lampentyp.beschreibung}</p>
                    </div>
                    <span className="rounded-full border border-stone-700 px-3 py-1 text-xs font-medium text-stone-200">
                      {lampentyp.standard_preis.toFixed(2)} EUR
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </article>

      <aside className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-stone-500">
          {selectedLampentyp ? "Bestehenden Eintrag bearbeiten" : "Neuen Eintrag anlegen"}
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          {selectedLampentyp ? selectedLampentyp.name : "Lampentyp-Formular"}
        </h2>
        <form className="mt-6 grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-2">
            <label htmlFor="lampentyp-name" className="text-sm font-medium text-stone-200">
              Name
            </label>
            <input
              id="lampentyp-name"
              value={formValues.name}
              onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
              className="h-10 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100"
              placeholder="z. B. Heckblitzer"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="lampentyp-beschreibung" className="text-sm font-medium text-stone-200">
              Beschreibung
            </label>
            <textarea
              id="lampentyp-beschreibung"
              value={formValues.beschreibung}
              onChange={(event) => setFormValues((current) => ({ ...current, beschreibung: event.target.value }))}
              className="min-h-32 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              placeholder="Einsatzbereich, Bauform und Besonderheiten"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="lampentyp-icon" className="text-sm font-medium text-stone-200">
              Icon-URL
            </label>
            <input
              id="lampentyp-icon"
              type="url"
              value={formValues.icon_url}
              onChange={(event) => setFormValues((current) => ({ ...current, icon_url: event.target.value }))}
              className="h-10 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100"
              placeholder="https://..."
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="lampentyp-preis" className="text-sm font-medium text-stone-200">
              Standard-Preis
            </label>
            <input
              id="lampentyp-preis"
              type="number"
              min="0"
              step="0.01"
              value={formValues.standard_preis}
              onChange={(event) => setFormValues((current) => ({ ...current, standard_preis: event.target.value }))}
              className="h-10 rounded-md border border-stone-700 bg-stone-950 px-3 py-2 text-sm text-stone-100"
              required
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-amber-300 px-4 py-2 text-sm font-medium text-stone-950 hover:bg-amber-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Speichert..." : selectedLampentyp ? "Aenderungen speichern" : "Lampentyp anlegen"}
            </button>
            {selectedLampentyp ? (
              <button
                type="button"
                className="inline-flex h-10 items-center justify-center rounded-md border border-stone-700 bg-transparent px-4 py-2 text-sm font-medium text-stone-100 hover:bg-stone-800"
                onClick={resetForm}
              >
                Bearbeitung abbrechen
              </button>
            ) : null}
          </div>
        </form>
      </aside>
    </section>
  );
}

function DefaultAdminSection({ activeSection }: { activeSection: AdminSection }) {
  const currentSection = ADMIN_SECTIONS[activeSection];

  return (
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
  );
}

export function AdminPage() {
  const role = getCurrentUserRole();
  const isAdmin = isAdminRole(role);
  const activeSection = getAdminSectionFromSearch(window.location.search);

  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname !== "/admin") {
      if (!isAdmin) {
        navigateTo("/admin", { replace: true });
        return;
      }

      navigateTo(`/admin${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }

    if (!isAdmin) {
      if (window.location.search) {
        navigateTo("/admin", { replace: true });
      }

      return;
    }

    const params = new URLSearchParams(window.location.search);

    if (params.get("section") === activeSection) {
      return;
    }

    navigateTo(getAdminSectionHref(activeSection), { replace: true });
  }, [activeSection, isAdmin]);

  if (!isAdmin) {
    return <AdminAccessDenied role={role} />;
  }

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
      {activeSection === "lampen" ? <LampentypenSection /> : <DefaultAdminSection activeSection={activeSection} />}
    </AdminLayout>
  );
}
