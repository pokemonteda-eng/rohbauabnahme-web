```typescript
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  iat: number;
  sub: string;
  [key: string]: unknown;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionData {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const SESSION_STORAGE_KEY = 'auth_session';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiration

class AuthService {
  private static instance: AuthService;
  private session: SessionData | null = null;
  private refreshPromise: Promise<string> | null = null;

  private constructor() {
    this.loadSession();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadSession(): void {
    try {
      const sessionData = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionData) {
        this.session = JSON.parse(sessionData);
        // Validate the loaded session
        if (!this.isSessionValid()) {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  private isSessionValid(): boolean {
    if (!this.session) return false;

    try {
      const decoded = jwtDecode<JwtPayload>(this.session.accessToken);
      return decoded.exp * 1000 > Date.now();
    } catch (error) {
      return false;
    }
  }

  private saveSession(): void {
    if (this.session) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
    }
  }

  private clearSession(): void {
    this.session = null;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  public isAuthenticated(): boolean {
    return this.isSessionValid();
  }

  public getAccessToken(): string | null {
    if (!this.session) return null;

    try {
      const decoded = jwtDecode<JwtPayload>(this.session.accessToken);
      if (decoded.exp * 1000 > Date.now()) {
        return this.session.accessToken;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  public getUserId(): string | null {
    return this.session?.userId || null;
  }

  public async login(accessToken: string, refreshToken: string): Promise<void> {
    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      this.session = {
        userId: decoded.sub,
        accessToken,
        refreshToken,
        expiresAt: decoded.exp * 1000,
      };
      this.saveSession();
    } catch (error) {
      this.clearSession();
      throw new Error('Invalid token');
    }
  }

  public logout(): void {
    this.clearSession();
  }

  private async performTokenRefresh(): Promise<string> {
    if (!this.session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.session.refreshToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { accessToken, refreshToken } = await response.json() as AuthTokens;
      await this.login(accessToken, refreshToken);
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.logout();
      throw error;
    }
  }

  public async refreshToken(): Promise<string> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performTokenRefresh()
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  public async getValidAccessToken(): Promise<string> {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const expiresAt = decoded.exp * 1000;
        const now = Date.now();

        // Refresh if token is about to expire
        if (expiresAt - now < TOKEN_REFRESH_THRESHOLD) {
          return this.refreshToken();
        }
        return token;
      } catch (error) {
        return this.refreshToken();
      }
    }

    return this.refreshToken();
  }
}

export const authService = AuthService.getInstance();
```
