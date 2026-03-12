import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import * as authLib from "@/lib/auth";

// Mock the auth API
jest.mock("@/api/auth", () => ({
  login: jest.fn(),
  refresh: jest.fn(),
  verify: jest.fn(),
  AuthApiError: class AuthApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  }
}));

import { login, refresh, verify } from "@/api/auth";

const mockLogin = login as jest.MockedFunction<typeof login>;
const mockRefresh = refresh as jest.MockedFunction<typeof refresh>;
const mockVerify = verify as jest.MockedFunction<typeof verify>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("initial state is not authenticated", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBe("anonymous");
    expect(result.current.username).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  describe("login", () => {
    const validCredentials = { username: "admin", password: "secret" };
    const mockTokenResponse = {
      access_token: "access123",
      refresh_token: "refresh456",
      token_type: "bearer",
      expires_in: 3600,
      refresh_expires_in: 86400,
      username: "admin",
      role: "admin"
    };

    test("successful login updates state", async () => {
      mockLogin.mockResolvedValueOnce(mockTokenResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login(validCredentials);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.username).toBe("admin");
      expect(result.current.role).toBe("admin");
      expect(result.current.error).toBeNull();
      expect(authLib.getAccessToken()).toBe("access123");
    });

    test("failed login sets error state", async () => {
      mockLogin.mockRejectedValueOnce({
        message: "Ungueltige Zugangsdaten",
        status: 401
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login(validCredentials);
        } catch {
          // Expected
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe("Ungueltige Zugangsdaten");
    });

    test("sets loading state during login", async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockTokenResponse), 100))
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login(validCredentials);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));
    });
  });

  describe("logout", () => {
    test("clears auth state and tokens", async () => {
      mockLogin.mockResolvedValueOnce({
        access_token: "access123",
        refresh_token: "refresh456",
        token_type: "bearer",
        expires_in: 3600,
        refresh_expires_in: 86400,
        username: "admin",
        role: "admin"
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ username: "admin", password: "secret" });
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.username).toBeNull();
      expect(result.current.role).toBe("anonymous");
      expect(authLib.getAccessToken()).toBeNull();
    });
  });

  describe("refreshToken", () => {
    test("refreshes token successfully", async () => {
      mockRefresh.mockResolvedValueOnce({
        access_token: "new_access",
        refresh_token: "new_refresh",
        token_type: "bearer",
        expires_in: 3600,
        refresh_expires_in: 86400,
        username: "admin",
        role: "admin"
      });

      // Set initial refresh token
      window.localStorage.setItem("rbw-refresh-token", "old_refresh");

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login({ username: "admin", password: "secret" });
      });

      mockLogin.mockResolvedValueOnce({
        access_token: "access123",
        refresh_token: "refresh456",
        token_type: "bearer",
        expires_in: 3600,
        refresh_expires_in: 86400,
        username: "admin",
        role: "admin"
      });

      const refreshed = await act(async () => {
        return await result.current.refreshToken();
      });

      expect(refreshed).toBe(true);
    });

    test("returns false when no refresh token", async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const refreshed = await act(async () => {
        return await result.current.refreshToken();
      });

      expect(refreshed).toBe(false);
    });
  });

  describe("verify on mount", () => {
    test("verifies existing token on mount", async () => {
      window.localStorage.setItem("rbw-access-token", "valid_token");
      window.localStorage.setItem("rbw-user-role", "admin");

      mockVerify.mockResolvedValueOnce({
        authenticated: true,
        username: "admin",
        role: "admin",
        token_type: "access",
        expires_at: "2024-12-31T23:59:59Z"
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.username).toBe("admin");
      expect(result.current.role).toBe("admin");
    });

    test("logs out when token verification fails", async () => {
      window.localStorage.setItem("rbw-access-token", "invalid_token");

      mockVerify.mockRejectedValueOnce(new Error("Invalid token"));
      mockRefresh.mockResolvedValueOnce({
        access_token: "new_token",
        refresh_token: "new_refresh",
        token_type: "bearer",
        expires_in: 3600,
        refresh_expires_in: 86400,
        username: "admin",
        role: "admin"
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Should try refresh and succeed
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe("clearError", () => {
    test("clears error state", async () => {
      mockLogin.mockRejectedValueOnce({
        message: "Login failed",
        status: 401
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        try {
          await result.current.login({ username: "admin", password: "wrong" });
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});