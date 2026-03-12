import { login, refresh, verify, AuthApiError } from "@/api/auth";

describe("auth api", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  describe("login", () => {
    const validCredentials = {
      username: "admin",
      password: "secret"
    };

    const mockTokenResponse = {
      access_token: "access123",
      refresh_token: "refresh456",
      token_type: "bearer",
      expires_in: 3600,
      refresh_expires_in: 86400,
      username: "admin",
      role: "admin"
    };

    test("returns token response on successful login", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockTokenResponse)
        } as Response) as unknown as typeof fetch
      );

      const result = await login(validCredentials);

      expect(result).toEqual(mockTokenResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validCredentials)
        })
      );
    });

    test("throws AuthApiError on 401 Unauthorized", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: () => Promise.resolve({ detail: "Ungueltige Zugangsdaten" })
        } as Response) as unknown as typeof fetch
      );

      await expect(login(validCredentials)).rejects.toBeInstanceOf(AuthApiError);
      await expect(login(validCredentials)).rejects.toMatchObject({
        message: "Ungueltige Zugangsdaten",
        status: 401
      });
    });

    test("throws AuthApiError with status text when no detail provided", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({})
        } as Response) as unknown as typeof fetch
      );

      await expect(login(validCredentials)).rejects.toMatchObject({
        message: "HTTP 500: Internal Server Error",
        status: 500
      });
    });

    test("handles network errors", async () => {
      setMockFetch(
        jest.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch
      );

      await expect(login(validCredentials)).rejects.toThrow();
    });
  });

  describe("refresh", () => {
    const mockRefreshToken = "refresh456";
    const mockNewTokenResponse = {
      access_token: "new_access123",
      refresh_token: "new_refresh456",
      token_type: "bearer",
      expires_in: 3600,
      refresh_expires_in: 86400,
      username: "admin",
      role: "admin"
    };

    test("returns new token response on successful refresh", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockNewTokenResponse)
        } as Response) as unknown as typeof fetch
      );

      const result = await refresh(mockRefreshToken);

      expect(result).toEqual(mockNewTokenResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/refresh"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: mockRefreshToken })
        })
      );
    });

    test("throws AuthApiError on invalid refresh token", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: () => Promise.resolve({ detail: "Invalid refresh token" })
        } as Response) as unknown as typeof fetch
      );

      await expect(refresh(mockRefreshToken)).rejects.toMatchObject({
        message: "Invalid refresh token",
        status: 401
      });
    });
  });

  describe("verify", () => {
    const mockAccessToken = "access123";
    const mockVerifyResponse = {
      authenticated: true,
      username: "admin",
      role: "admin",
      token_type: "access",
      expires_at: "2024-01-01T12:00:00Z"
    };

    test("returns verify response on successful verification", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockVerifyResponse)
        } as Response) as unknown as typeof fetch
      );

      const result = await verify(mockAccessToken);

      expect(result).toEqual(mockVerifyResponse);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/verify"),
        expect.objectContaining({
          method: "GET",
          headers: { Authorization: `Bearer ${mockAccessToken}` }
        })
      );
    });

    test("throws AuthApiError on token expired", async () => {
      setMockFetch(
        jest.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          json: () => Promise.resolve({ detail: "Token expired" })
        } as Response) as unknown as typeof fetch
      );

      await expect(verify(mockAccessToken)).rejects.toMatchObject({
        message: "Token expired",
        status: 401
      });
    });
  });
});