import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";
import { clearCurrentUserRole, setCurrentUserRole } from "@/lib/auth";

describe("Admin routing and access control", () => {
  const originalFetch = global.fetch;
  const lampentypenApiUrl = "/api/v1/lampen-typen";
  let lampentypen: Array<{
    id: number;
    name: string;
    beschreibung: string;
    icon_url: string;
    standard_preis: number;
    angelegt_am: string;
    aktualisiert_am: string;
  }>;

  beforeEach(() => {
    window.history.pushState({}, "", "/");
    clearCurrentUserRole();
    lampentypen = [
      {
        id: 1,
        name: "Frontblitzer",
        beschreibung: "Warnleuchte fuer den Frontbereich.",
        icon_url: "https://cdn.example.com/frontblitzer.png",
        standard_preis: 79.5,
        angelegt_am: "2026-03-11T10:00:00Z",
        aktualisiert_am: "2026-03-11T10:00:00Z"
      }
    ];
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = init?.method ?? "GET";

        if (
          url === "/api/v1/kunden" ||
          url === "/api/v1/master-data/aufbautypen" ||
          url === "/api/v1/master-data/projektleiter" ||
          url === "/api/v1/master-data/vertriebsgebiete"
        ) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
          } as Response);
        }

        if (url === lampentypenApiUrl && method === "GET") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([...lampentypen])
          } as Response);
        }

        if (url === lampentypenApiUrl && method === "POST") {
          const payload = JSON.parse(String(init?.body)) as {
            name: string;
            beschreibung: string;
            icon_url: string;
            standard_preis: number;
          };
          const nextLampentyp = {
            id: lampentypen.length + 1,
            ...payload,
            angelegt_am: "2026-03-11T11:00:00Z",
            aktualisiert_am: "2026-03-11T11:00:00Z"
          };
          lampentypen = [...lampentypen, nextLampentyp];

          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(nextLampentyp)
          } as Response);
        }

        if (url.startsWith(`${lampentypenApiUrl}/`) && method === "PATCH") {
          const lampentypId = Number(url.split("/").at(-1));
          const payload = JSON.parse(String(init?.body)) as {
            name: string;
            beschreibung: string;
            icon_url: string;
            standard_preis: number;
          };
          const updatedLampentyp = {
            ...lampentypen.find((entry) => entry.id === lampentypId),
            ...payload,
            id: lampentypId,
            aktualisiert_am: "2026-03-11T12:00:00Z"
          };
          lampentypen = lampentypen.map((entry) => (entry.id === lampentypId ? updatedLampentyp : entry));

          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(updatedLampentyp)
          } as Response);
        }

        return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
      })
    });
  });

  afterEach(() => {
    clearCurrentUserRole();
    jest.restoreAllMocks();
    if (originalFetch === undefined) {
      delete (global as { fetch?: typeof fetch }).fetch;
      return;
    }

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: originalFetch
    });
  });

  test("blocks /admin for non-admin users", () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
    expect(screen.getByText(/ausschließlich für Benutzer mit der Rolle/i)).not.toBeNull();
    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("");
  });

  test("strips protected admin section queries on the base admin route for non-admin users", () => {
    window.history.pushState({}, "", "/admin?section=lampen");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("");
  });

  test("renders admin layout and loads lampentypen for admin users", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Lampen" })).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Admin Navigation" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Aufbauten/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Lampen/ }).getAttribute("aria-current")).toBe("page");
    expect(await screen.findByText("Frontblitzer")).not.toBeNull();
    expect(screen.getByDisplayValue("0.00")).not.toBeNull();
  });

  test("switches admin sections via query-string navigation", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Stammdaten/ }));

    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("?section=stammdaten");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Stammdaten" })).not.toBeNull();
      expect(screen.getByRole("button", { name: /Stammdaten/ }).getAttribute("aria-current")).toBe("page");
    });
  });

  test("falls back to the default section for invalid admin section query parameters", () => {
    window.history.pushState({}, "", "/admin?section=toString");
    setCurrentUserRole("admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Aufbauten" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Aufbauten/ }).getAttribute("aria-current")).toBe("page");
    expect(window.location.search).toBe("?section=aufbauten");
  });

  test("canonicalizes nested admin paths to the base admin route", () => {
    window.history.pushState({}, "", "/admin/tools?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Lampen" })).not.toBeNull();
    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("?section=lampen");
  });

  test("canonicalizes nested admin paths for non-admin users without forcing a default section", () => {
    window.history.pushState({}, "", "/admin/tools");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("");
  });

  test("drops protected admin section queries for non-admin users on nested admin paths", () => {
    window.history.pushState({}, "", "/admin/tools?section=lampen");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("");
  });

  test("navigates to admin route from homepage CTA", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Admin-Bereich" }));

    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("");
    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
  });

  test("creates a new lampentyp from the admin form", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    await screen.findByText("Frontblitzer");

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Heckblitzer" } });
    fireEvent.change(screen.getByLabelText("Beschreibung"), {
      target: { value: "Warnleuchte fuer den Heckbereich." }
    });
    fireEvent.change(screen.getByLabelText("Icon-URL"), {
      target: { value: "https://cdn.example.com/heckblitzer.png" }
    });
    fireEvent.change(screen.getByLabelText("Standard-Preis"), {
      target: { value: "129.90" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Lampentyp anlegen" }));

    expect(await screen.findByText("Heckblitzer")).not.toBeNull();
    expect(screen.getByText("129.90 EUR")).not.toBeNull();
  });

  test("updates an existing lampentyp from the admin form", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    fireEvent.click(await screen.findByText("Frontblitzer"));

    expect(screen.getByDisplayValue("Frontblitzer")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Frontblitzer Plus" } });
    fireEvent.change(screen.getByLabelText("Standard-Preis"), {
      target: { value: "89.50" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Aenderungen speichern" }));

    await waitFor(() => {
      expect(screen.getByText("Frontblitzer Plus")).not.toBeNull();
      expect(screen.getByText("89.50 EUR")).not.toBeNull();
    });
  });
});
