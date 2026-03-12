```
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode
} from "react";

import {
  login as apiLogin,
  refresh as apiRefresh,
  verify as apiVerify,
  type LoginCredentials,
  type TokenResponse,
  AuthApiError
} from "@/api/auth";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getCurrentUserRole,
  setCurrentUserRole,
  clearCurrentUserRole,
  type UserRole
} from "@/lib/auth";

const AUTH_REFRESH_TOKEN_KEY = "rbw-refresh-token";
const AUTH_TOKEN_EXPIRES_KEY = "rbw-token-expires";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  role: UserRole;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getRefreshToken(): string | null {
  return window.localStorage.getItem(AUTH_REFRESH_TOKEN_KEY)?.trim() || null;
}

function setRefreshToken(token: string): void {
  window.localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, token);
}

function clearRefreshToken(): void {
  window.localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
}

function getTokenExpiry(): number | null {
  const expiry = window.localStorage.getItem(AUTH_TOKEN_EXPIRES_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

function setTokenExpiry(expiresIn: number): void {
  const expiryTime = Date.now() + expiresIn * 1000;
  window.localStorage.setItem(AUTH_TOKEN_EXPIRES_KEY, expiryTime.toString());
}

function clearTokenExpiry(): void {
  window.localStorage.removeItem(AUTH_TOKEN_EXPIRES_KEY);
}

function isTokenNearExpiry(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  // Refresh 5 minutes before expiry
  return Date.now() > expiry - 5 * 60 * 1000;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    username: null,
    role: "anonymous",
    isLoading: true,
    error: null
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    clearRefreshToken();
    clearTokenExpiry();
    clearCurrentUserRole();
    setState({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: false,
      error: null
    });
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      logout();
      return false;
    }

    try {
      const response: TokenResponse = await apiRefresh(refreshTokenValue);
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      setTokenExpiry(response.expires_in);
      setCurrentUserRole(response.role as UserRole);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        username: response.username,
        role: response.role as UserRole,
        error: null
      }));
      return true;
    } catch (error) {
      logout();
      return false;
    }
  }, [logout]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response: TokenResponse = await apiLogin(credentials);
        setAccessToken(response.access_token);
        setRefreshToken(response.refresh_token);
        setTokenExpiry(response.expires_in);
        setCurrentUserRole(response.role as UserRole);
        setState({
          isAuthenticated: true,
          username: response.username,
          role: response.role as UserRole,
          isLoading: false,
          error: null
        });
      } catch (error) {
        const message =
          error instanceof AuthApiError
            ? error.message
            : "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          error: message
        }));
        throw error;
      }
    },
    []
  );

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const accessToken = getAccessToken();
      const savedRole = getCurrentUserRole();

      if (!accessToken) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const response = await apiVerify(accessToken);
        if (response.authenticated) {
          setState({
            isAuthenticated: true,
            username: response.username,
            role: response.role as UserRole,
            isLoading: false,
            error: null
          });
        } else {
          // Try to refresh
          const refreshed = await refreshToken();
          if (!refreshed) {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        // Try to refresh on verify failure
        const refreshed = await refreshToken();
        if (!refreshed) {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    void verifyToken();
  }, [refreshToken]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const interval = setInterval(() => {
      if (isTokenNearExpiry()) {
        void refreshToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [state.isAuthenticated, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshToken,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```
