import { useEffect } from "react";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { isAdminRole, getCurrentUserRole, type UserRole } from "@/lib/auth";
import {
  ADMIN_SECTIONS,
  getAdminSectionFromSearch,
  getAdminSectionHref,
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
