import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";
import { clearCurrentUserRole, setCurrentUserRole } from "@/lib/auth";

describe("Admin routing and access control", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.history.pushState({}, "", "/");
    clearCurrentUserRole();
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation((input: RequestInfo | URL) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;

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
  });

  test("renders admin layout and navigation for admin users", () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    setCurrentUserRole("admin");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Lampen" })).not.toBeNull();
    expect(screen.getByRole("navigation", { name: "Admin Navigation" })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Aufbauten/ })).not.toBeNull();
    expect(screen.getByRole("button", { name: /Lampen/ }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("nur `admin`")).not.toBeNull();
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

  test("navigates to admin route from homepage CTA", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Admin-Bereich" }));

    expect(window.location.pathname).toBe("/admin");
    expect(window.location.search).toBe("?section=aufbauten");
    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
  });
});
