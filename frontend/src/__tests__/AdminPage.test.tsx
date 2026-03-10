import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";
import { clearCurrentUserRole, setCurrentUserRole } from "@/lib/auth";

describe("Admin routing and access control", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    clearCurrentUserRole();
  });

  afterEach(() => {
    clearCurrentUserRole();
    jest.restoreAllMocks();
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

  test("navigates to admin route from homepage CTA", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Admin-Bereich" }));

    expect(window.location.pathname).toBe("/admin");
    expect(screen.getByRole("heading", { name: "Admin-Rechte erforderlich" })).not.toBeNull();
  });
});
