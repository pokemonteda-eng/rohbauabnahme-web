import {
  ensureFreshAuthSession,
  fetchWithAuth,
  getAccessToken,
  getCurrentUserRole,
  loginWithPassword,
  persistAuthSession,
  restoreAuthSession
} from "@/lib/auth";

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
    accessToken: "access-token-1",
    refreshToken: "refresh-token-1",
    tokenType: "bearer",
    accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  };
}

describe("auth session handling", () => {
  test("persists session data after login", async () => {
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        access_token: "login-access-token",
        refresh_token: "login-refresh-token",
        token_type: "bearer",
        expires_in: 900,
        refresh_expires_in: 604800,
        username: "admin",
        role: "admin"
      })
    );
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    const session = await loginWithPassword(" admin ", "admin");

    expect(session.username).toBe("admin");
    expect(session.role).toBe("admin");
    expect(getCurrentUserRole()).toBe("admin");
    expect(getAccessToken()).toBe("login-access-token");
    expect(window.localStorage.getItem("rbw-auth-session")).toContain("login-refresh-token");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/login",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  test("verifies persisted sessions during restore", async () => {
    persistAuthSession(createSession());
    const fetchMock = jest.fn().mockResolvedValue(
      jsonResponse({
        authenticated: true,
        username: "admin",
        role: "admin",
        token_type: "access",
        expires_at: "2030-01-01T00:15:00.000Z"
      })
    );
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    const result = await restoreAuthSession();

    expect(result.error).toBeNull();
    expect(result.session?.accessTokenExpiresAt).toBe("2030-01-01T00:15:00.000Z");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/verify",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer access-token-1"
        })
      })
    );
  });

  test("refreshes a nearly expired token only once for concurrent callers", async () => {
    persistAuthSession(
      createSession({
        accessTokenExpiresAt: new Date(Date.now() + 30 * 1000).toISOString()
      })
    );
    const fetchMock = jest.fn().mockResolvedValue(
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
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    const [first, second] = await Promise.all([ensureFreshAuthSession(), ensureFreshAuthSession()]);

    expect(first?.accessToken).toBe("refreshed-access-token");
    expect(second?.accessToken).toBe("refreshed-access-token");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  test("clears expired refresh sessions during restore", async () => {
    persistAuthSession(
      createSession({
        refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString()
      })
    );

    const result = await restoreAuthSession();

    expect(result.session).toBeNull();
    expect(result.error).toBe("Die Admin-Sitzung ist abgelaufen. Bitte erneut anmelden.");
    expect(window.localStorage.getItem("rbw-auth-session")).toBeNull();
    expect(getCurrentUserRole()).toBe("anonymous");
  });

  test("retries authenticated requests after a 401 with a refreshed token", async () => {
    persistAuthSession(createSession());
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "Token abgelaufen" }, 401))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "retry-access-token",
          refresh_token: "retry-refresh-token",
          token_type: "bearer",
          expires_in: 900,
          refresh_expires_in: 604800,
          username: "admin",
          role: "admin"
        })
      )
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]));
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    const response = await fetchWithAuth("/api/v1/lampen-typen", {
      method: "GET"
    });

    expect(response.ok).toBe(true);
    const retryCall = fetchMock.mock.calls[2];
    expect(retryCall[0]).toBe("/api/v1/lampen-typen");
    expect(new Headers((retryCall[1] as RequestInit).headers).get("Authorization")).toBe(
      "Bearer retry-access-token"
    );
  });
});
