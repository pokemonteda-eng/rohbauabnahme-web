import { type FormEvent, useEffect, useState } from "react";

import { AdminLampentypenSection } from "@/components/admin/AdminLampentypenSection";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ensureFreshAuthSession,
  getCurrentUserRole,
  getStoredAuthSession,
  isAdminRole,
  loginWithPassword,
  logout,
  restoreAuthSession,
  subscribeToAuthSessionChange,
  type AuthSession,
  type UserRole
} from "@/lib/auth";
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

function AdminLoadingState() {
  return (
    <div className="min-h-screen bg-stone-950 px-4 py-12 text-stone-100 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-stone-800 bg-stone-900/95 p-8 shadow-2xl shadow-stone-950/50">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">Admin</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Sitzung wird geprueft</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">
          Vor dem Laden des geschuetzten Bereichs wird die gespeicherte Session verifiziert.
        </p>
      </div>
    </div>
  );
}

function AdminLoginPanel({
  onLogin,
  error,
  isSubmitting
}: {
  onLogin: (username: string, password: string) => Promise<void>;
  error: string | null;
  isSubmitting: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      setValidationError("Benutzername und Passwort sind erforderlich.");
      return;
    }

    setValidationError(null);
    await onLogin(username, password);
  };

  return (
    <div className="min-h-screen bg-stone-950 px-4 py-12 text-stone-100 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <section className="rounded-[2rem] border border-stone-800 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),_transparent_30%),linear-gradient(180deg,_rgba(28,25,23,0.96),_rgba(12,10,9,1))] p-8 shadow-2xl shadow-stone-950/40">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">Admin Login</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Steuerzentrale gesichert</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">
            Anmeldung, Session-Persistenz, Token-Refresh und Ablaufbehandlung laufen jetzt ueber den Backend-Auth-Flow
            aus `TASK-119`.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Access Token</p>
              <p className="mt-2 text-sm font-medium text-white">automatisch verifiziert</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Refresh</p>
              <p className="mt-2 text-sm font-medium text-white">vor Ablauf erneuert</p>
            </div>
            <div className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-500">Logout</p>
              <p className="mt-2 text-sm font-medium text-white">Storage sauber geloescht</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-800 bg-stone-900/95 p-8 shadow-2xl shadow-stone-950/50">
          <h2 className="text-2xl font-semibold text-white">Anmelden</h2>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Der Bereich ist nur mit gueltiger Admin-Session verfuegbar.
          </p>
          <form
            className="mt-8 grid gap-5"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="admin-username" className="text-stone-200">
                Benutzername
              </Label>
              <Input
                id="admin-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="border-stone-700 bg-stone-950 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-password" className="text-stone-200">
                Passwort
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-stone-700 bg-stone-950 text-white"
              />
            </div>
            {validationError ? (
              <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {validationError}
              </p>
            ) : null}
            {error ? (
              <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-11 rounded-full bg-amber-300 px-5 text-sm font-semibold text-stone-950 hover:bg-amber-200"
            >
              {isSubmitting ? "Anmeldung laeuft..." : "Anmelden"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

function AdminAccessDenied({ role, onLogout }: { role: UserRole; onLogout: () => void }) {
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
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300 hover:text-white"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [status, setStatus] = useState<"loading" | "anonymous" | "authenticated">("loading");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const role = session?.role ?? getCurrentUserRole();
  const isAdmin = isAdminRole(role);
  const activeSection = getAdminSectionFromSearch(window.location.search);

  useEffect(() => {
    let cancelled = false;

    const syncFromStorage = () => {
      const nextSession = getStoredAuthSession();
      setSession(nextSession);
      setStatus(nextSession === null ? "anonymous" : "authenticated");
    };

    void restoreAuthSession().then(({ session: restoredSession, error }) => {
      if (cancelled) {
        return;
      }

      setSession(restoredSession);
      setStatus(restoredSession === null ? "anonymous" : "authenticated");
      setAuthError(error);
    });

    const unsubscribe = subscribeToAuthSessionChange(() => {
      if (cancelled) {
        return;
      }

      syncFromStorage();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const pathname = window.location.pathname;

    if (pathname !== "/admin") {
      navigateTo(`/admin${window.location.search}${window.location.hash}`, { replace: true });
      return;
    }

    if (status === "loading" || status === "anonymous") {
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
  }, [activeSection, isAdmin, status]);

  useEffect(() => {
    if (session === null || !session.refreshToken) {
      return;
    }

    const accessExpiry = Date.parse(session.accessTokenExpiresAt);
    if (Number.isNaN(accessExpiry)) {
      return;
    }

    const timeoutMs = Math.max(accessExpiry - Date.now() - 30_000, 1_000);
    const timer = window.setTimeout(() => {
      void ensureFreshAuthSession({ forceRefresh: true }).catch((error) => {
        setAuthError(error instanceof Error ? error.message : "Admin-Sitzung konnte nicht aktualisiert werden.");
      });
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [session]);

  const handleLogin = async (username: string, password: string) => {
    setIsLoggingIn(true);
    setAuthError(null);

    try {
      const nextSession = await loginWithPassword(username, password);
      setSession(nextSession);
      setStatus("authenticated");
      setAuthError(null);
    } catch (error) {
      setSession(null);
      setStatus("anonymous");
      setAuthError(error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logout();
    setSession(null);
    setStatus("anonymous");
    setAuthError(null);
    navigateTo("/admin", { replace: true });
  };

  if (status === "loading") {
    return <AdminLoadingState />;
  }

  if (status === "anonymous") {
    return <AdminLoginPanel onLogin={handleLogin} error={authError} isSubmitting={isLoggingIn} />;
  }

  if (!isAdmin) {
    return <AdminAccessDenied role={role} onLogout={handleLogout} />;
  }

  const currentSection = ADMIN_SECTIONS[activeSection];
  const isLampenSection = activeSection === "lampen";

  return (
    <AdminLayout
      activeSection={activeSection}
      currentSection={{
        id: activeSection,
        label: currentSection.label,
        description: currentSection.description
      }}
      username={session?.username ?? "admin"}
      role={role}
      onLogout={handleLogout}
      navigationItems={Object.entries(ADMIN_SECTIONS).map(([id, section]) => ({
        id: id as AdminSection,
        label: section.label,
        description: section.description
      }))}
    >
      {isLampenSection ? (
        <AdminLampentypenSection />
      ) : (
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
      )}
    </AdminLayout>
  );
}
