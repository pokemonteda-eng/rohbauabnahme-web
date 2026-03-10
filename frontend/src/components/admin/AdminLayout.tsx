import type { ReactNode } from "react";

import { type AdminSection, getAdminSectionHref } from "@/lib/admin";
import { navigateTo } from "@/lib/navigation";

type AdminNavigationItem = {
  id: AdminSection;
  label: string;
  description: string;
};

type AdminLayoutProps = {
  activeSection: AdminSection;
  currentSection: AdminNavigationItem;
  navigationItems: AdminNavigationItem[];
  children: ReactNode;
};

export function AdminLayout({
  activeSection,
  currentSection,
  navigationItems,
  children
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-stone-800 bg-stone-900/95 lg:w-80 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-6 p-6">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-amber-400/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                Admin
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-white">Steuerzentrale</p>
                <p className="mt-2 text-sm leading-6 text-stone-400">
                  Geschützter Bereich für Stammdaten und spätere Verwaltungs-Module.
                </p>
              </div>
            </div>
            <nav aria-label="Admin Navigation">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {navigationItems.map((item) => {
                  const isActive = item.id === activeSection;

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => navigateTo(getAdminSectionHref(item.id))}
                        className={[
                          "flex w-full flex-col rounded-2xl border px-4 py-4 text-left transition",
                          isActive
                            ? "border-amber-300/40 bg-amber-300/10 text-white shadow-[0_0_0_1px_rgba(251,191,36,0.1)]"
                            : "border-stone-800 bg-stone-950/80 text-stone-300 hover:border-stone-700 hover:bg-stone-900"
                        ].join(" ")}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="mt-1 text-sm text-stone-400">{item.description}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="rounded-[2rem] border border-stone-800 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.16),_transparent_30%),linear-gradient(180deg,_rgba(28,25,23,0.96),_rgba(12,10,9,1))] p-6 shadow-2xl shadow-stone-950/40 sm:p-8">
            <div className="flex flex-col gap-3 border-b border-stone-800 pb-6">
              <p className="text-sm uppercase tracking-[0.26em] text-stone-500">Bereich</p>
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white">{currentSection.label}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-400">
                    {currentSection.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo("/")}
                  className="inline-flex items-center justify-center rounded-full border border-stone-700 px-4 py-2 text-sm font-medium text-stone-200 transition hover:border-stone-500 hover:text-white"
                >
                  Zur Protokollansicht
                </button>
              </div>
            </div>
            <div className="pt-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
