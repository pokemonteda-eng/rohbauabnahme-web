import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";
import { persistAuthSession } from "@/lib/auth";

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body)
  } as Response;
}

function createSession(overrides?: Partial<Parameters<typeof persistAuthSession>[0]>) {
  return {
    username: "admin",
    role: "admin" as const,
    accessToken: "stored-access-token",
    refreshToken: "stored-refresh-token",
    tokenType: "bearer",
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  };
}

describe("Admin routing and auth session handling", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
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

  test("shows the login form for anonymous users on /admin", () => {
    window.history.pushState({}, "", "/admin");

    render(<App />);

    return waitFor(() => {
      expect(screen.getByRole("heading", { name: "Anmelden" })).not.toBeNull();
      expect(screen.getByLabelText("Benutzername")).not.toBeNull();
      expect(screen.getByLabelText("Passwort")).not.toBeNull();
    });
  });

  test("logs in and loads the protected admin module", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    const fetchMock = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (url === "/api/v1/auth/login") {
        return Promise.resolve(
          jsonResponse({
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
            token_type: "bearer",
            expires_in: 900,
            refresh_expires_in: 604800,
            username: "admin",
            role: "admin"
          })
        );
      }

      if (url === "/api/v1/lampen-typen") {
        return Promise.resolve(jsonResponse([]));
      }

      return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("Benutzername")).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Benutzername"), { target: { value: "admin" } });
    fireEvent.change(screen.getByLabelText("Passwort"), { target: { value: "admin" } });
    fireEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() => {
      expect(screen.getByText("Lampentypen verwalten")).not.toBeNull();
      expect(screen.getByText("Es sind noch keine Lampentypen vorhanden.")).not.toBeNull();
    });

    expect(window.localStorage.getItem("rbw-auth-session")).toContain("new-refresh-token");
  });

  test("restores a persisted session and verifies it before rendering admin content", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    persistAuthSession(createSession());
    const fetchMock = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (url === "/api/v1/auth/verify") {
        return Promise.resolve(
          jsonResponse({
            authenticated: true,
            username: "admin",
            role: "admin",
            token_type: "access",
            expires_at: "2030-01-01T00:15:00.000Z"
          })
        );
      }

      if (url === "/api/v1/lampen-typen") {
        return Promise.resolve(jsonResponse([]));
      }

      return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Lampentypen verwalten")).not.toBeNull();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/verify",
      expect.objectContaining({
        method: "GET"
      })
    );
  });

  test("refreshes an expiring session before requesting admin data", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    persistAuthSession(
      createSession({
        accessTokenExpiresAt: new Date(Date.now() + 10 * 1000).toISOString()
      })
    );
    const fetchMock = jest.fn().mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (url === "/api/v1/auth/refresh") {
        return Promise.resolve(
          jsonResponse({
            access_token: "refreshed-access-token",
            refresh_token: "refreshed-refresh-token",
            token_type: "bearer",
            expires_in: 900,
            refresh_expires_in: 604800,
            username: "admin",
            role: "admin"
          })
        );
      }

      if (url === "/api/v1/lampen-typen") {
        const authorizationHeader =
          init?.headers instanceof Headers
            ? init.headers.get("Authorization")
            : new Headers(init?.headers).get("Authorization");

        expect(authorizationHeader).toBe("Bearer refreshed-access-token");
        return Promise.resolve(jsonResponse([]));
      }

      return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Lampentypen verwalten")).not.toBeNull();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  test("logs out from the admin layout and returns to the login screen", async () => {
    window.history.pushState({}, "", "/admin?section=lampen");
    persistAuthSession(createSession());
    const fetchMock = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

      if (url === "/api/v1/auth/verify") {
        return Promise.resolve(
          jsonResponse({
            authenticated: true,
            username: "admin",
            role: "admin",
            token_type: "access",
            expires_at: "2030-01-01T00:15:00.000Z"
          })
        );
      }

      if (url === "/api/v1/lampen-typen") {
        return Promise.resolve(jsonResponse([]));
      }

      return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
    });
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Lampentypen verwalten")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Anmelden" })).not.toBeNull();
    });
    expect(window.localStorage.getItem("rbw-auth-session")).toBeNull();
  });

  test("falls back to the login screen when the persisted session has expired", async () => {
    window.history.pushState({}, "", "/admin");
    persistAuthSession(
      createSession({
        accessTokenExpiresAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        refreshTokenExpiresAt: new Date(Date.now() - 60 * 1000).toISOString()
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Anmelden" })).not.toBeNull();
      expect(screen.getByText("Die Admin-Sitzung ist abgelaufen. Bitte erneut anmelden.")).not.toBeNull();
    });
    expect(window.localStorage.getItem("rbw-auth-session")).toBeNull();
  });
});
