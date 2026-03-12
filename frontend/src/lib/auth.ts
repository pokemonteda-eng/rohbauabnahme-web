const AUTH_ROLE_STORAGE_KEY = "rbw-user-role";
const AUTH_ACCESS_TOKEN_STORAGE_KEY = "rbw-access-token";
const AUTH_SESSION_STORAGE_KEY = "rbw-auth-session";
const AUTH_SESSION_EVENT = "app:auth-session-changed";
const ACCESS_TOKEN_REFRESH_WINDOW_MS = 60 * 1000;

export type UserRole = "admin" | "projektleiter" | "bearbeiter" | "viewer" | "anonymous";

export type AuthSession = {
  username: string;
  role: Exclude<UserRole, "anonymous">;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  username: string;
  role: string;
};

type VerifyResponse = {
  authenticated: boolean;
  username: string;
  role: string;
  token_type: string;
  expires_at: string;
};

type AuthStorageSnapshot = {
  session: AuthSession | null;
  role: UserRole;
  accessToken: string | null;
};

const VALID_ROLES = new Set<UserRole>(["admin", "projektleiter", "bearbeiter", "viewer", "anonymous"]);
let refreshSessionPromise: Promise<AuthSession> | null = null;

export class AuthSessionError extends Error {
  status: number | null;
  detail: string | null;

  constructor(message: string, status: number | null = null, detail: string | null = null) {
    super(message);
    this.name = "AuthSessionError";
    this.status = status;
    this.detail = detail;
  }
}

function isWindowAvailable() {
  return typeof window !== "undefined";
}

function isStoredRole(value: string | null): value is UserRole {
  return value !== null && VALID_ROLES.has(value as UserRole);
}

function isAuthenticatedRole(value: string): value is Exclude<UserRole, "anonymous"> {
  return value !== "anonymous" && VALID_ROLES.has(value as UserRole);
}

function dispatchAuthSessionChange() {
  if (!isWindowAvailable()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EVENT));
}

function syncLegacyStorage(session: AuthSession | null) {
  if (!isWindowAvailable()) {
    return;
  }

  if (session === null) {
    window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
    window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, session.role);
  window.localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, session.accessToken);
}

function parseAuthSession(value: string | null): AuthSession | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const session = parsed as Partial<AuthSession>;
    if (
      typeof session.username !== "string" ||
      typeof session.role !== "string" ||
      !isAuthenticatedRole(session.role) ||
      typeof session.accessToken !== "string" ||
      typeof session.refreshToken !== "string" ||
      typeof session.tokenType !== "string" ||
      typeof session.accessTokenExpiresAt !== "string" ||
      typeof session.refreshTokenExpiresAt !== "string"
    ) {
      return null;
    }

    return {
      username: session.username,
      role: session.role,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      tokenType: session.tokenType,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt
    };
  } catch {
    return null;
  }
}

function toExpiryIso(expiresInSeconds: number) {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

function parseIsoDate(value: string) {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isRefreshTokenExpired(session: AuthSession, now = Date.now()) {
  const refreshExpiresAt = parseIsoDate(session.refreshTokenExpiresAt);
  return refreshExpiresAt === null || refreshExpiresAt <= now;
}

function shouldRefreshAccessToken(session: AuthSession, now = Date.now()) {
  const accessExpiresAt = parseIsoDate(session.accessTokenExpiresAt);
  return accessExpiresAt === null || accessExpiresAt - now <= ACCESS_TOKEN_REFRESH_WINDOW_MS;
}

function createSessionFromTokenResponse(payload: AuthTokenResponse): AuthSession {
  if (!isAuthenticatedRole(payload.role)) {
    throw new AuthSessionError("Die Anmeldung wurde mit einer ungueltigen Rolle beantwortet.", 500, null);
  }

  return {
    username: payload.username,
    role: payload.role,
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type,
    accessTokenExpiresAt: toExpiryIso(payload.expires_in),
    refreshTokenExpiresAt: toExpiryIso(payload.refresh_expires_in)
  };
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractErrorDetail(data: unknown) {
  if (data && typeof data === "object" && "detail" in data && typeof (data as { detail?: unknown }).detail === "string") {
    return (data as { detail: string }).detail;
  }

  return null;
}

async function requestAuthJson<T>(input: RequestInfo | URL, init: RequestInit, fallbackMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    throw new AuthSessionError(
      "Die Authentifizierungs-API ist momentan nicht erreichbar. Bitte Verbindung pruefen und erneut versuchen.",
      null,
      null
    );
  }

  if (!response.ok) {
    const data = await parseJsonResponse(response);
    const detail = extractErrorDetail(data);
    throw new AuthSessionError(detail ?? fallbackMessage, response.status, detail);
  }

  return (await response.json()) as T;
}

export function getStoredAuthSession(): AuthSession | null {
  if (!isWindowAvailable()) {
    return null;
  }

  const parsed = parseAuthSession(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY));
  if (parsed !== null) {
    return parsed;
  }

  const legacyRole = window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  const legacyAccessToken = window.localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)?.trim() || null;
  if (legacyAccessToken && legacyRole && isAuthenticatedRole(legacyRole)) {
    return {
      username: "admin",
      role: legacyRole,
      accessToken: legacyAccessToken,
      refreshToken: "",
      tokenType: "bearer",
      accessTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(0).toISOString()
    };
  }

  if (window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) !== null) {
    clearStoredAuthSession();
  }

  return null;
}

export function persistAuthSession(session: AuthSession) {
  if (!isWindowAvailable()) {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  syncLegacyStorage(session);
  dispatchAuthSessionChange();
}

export function clearStoredAuthSession() {
  if (!isWindowAvailable()) {
    return;
  }

  refreshSessionPromise = null;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  syncLegacyStorage(null);
  dispatchAuthSessionChange();
}

function getSessionSnapshot(): AuthStorageSnapshot {
  const session = getStoredAuthSession();
  if (session !== null) {
    return {
      session,
      role: session.role,
      accessToken: session.accessToken
    };
  }

  if (!isWindowAvailable()) {
    return {
      session: null,
      role: "anonymous",
      accessToken: null
    };
  }

  const storedRole = window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY);
  return {
    session: null,
    role: isStoredRole(storedRole) ? storedRole : "anonymous",
    accessToken: window.localStorage.getItem(AUTH_ACCESS_TOKEN_STORAGE_KEY)?.trim() || null
  };
}

export function getCurrentUserRole(): UserRole {
  return getSessionSnapshot().role;
}

export function setCurrentUserRole(role: Exclude<UserRole, "anonymous">) {
  if (!isWindowAvailable()) {
    return;
  }

  window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
  dispatchAuthSessionChange();
}

export function clearCurrentUserRole() {
  if (!isWindowAvailable()) {
    return;
  }

  window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
  dispatchAuthSessionChange();
}

export function isAdminRole(role: UserRole) {
  return role === "admin";
}

export function getAccessToken() {
  return getSessionSnapshot().accessToken;
}

export function setAccessToken(token: string) {
  if (!isWindowAvailable()) {
    return;
  }

  window.localStorage.setItem(AUTH_ACCESS_TOKEN_STORAGE_KEY, token);
  dispatchAuthSessionChange();
}

export function clearAccessToken() {
  if (!isWindowAvailable()) {
    return;
  }

  window.localStorage.removeItem(AUTH_ACCESS_TOKEN_STORAGE_KEY);
  dispatchAuthSessionChange();
}

export function subscribeToAuthSessionChange(listener: EventListener) {
  if (!isWindowAvailable()) {
    return () => undefined;
  }

  window.addEventListener(AUTH_SESSION_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(AUTH_SESSION_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export async function loginWithPassword(username: string, password: string): Promise<AuthSession> {
  const payload = await requestAuthJson<AuthTokenResponse>(
    "/api/v1/auth/login",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username.trim(),
        password
      })
    },
    "Anmeldung fehlgeschlagen."
  );

  const session = createSessionFromTokenResponse(payload);
  persistAuthSession(session);
  return session;
}

export async function verifyStoredSession(session: AuthSession): Promise<AuthSession> {
  if (!session.accessToken) {
    throw new AuthSessionError("Admin-Sitzung fehlt. Bitte erneut anmelden.", 401, "Authentifizierung erforderlich");
  }

  const payload = await requestAuthJson<VerifyResponse>(
    "/api/v1/auth/verify",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`
      }
    },
    "Admin-Sitzung ist abgelaufen oder ungueltig. Bitte erneut anmelden."
  );

  if (!payload.authenticated || !isAuthenticatedRole(payload.role)) {
    throw new AuthSessionError(
      "Admin-Sitzung ist abgelaufen oder ungueltig. Bitte erneut anmelden.",
      401,
      "Authentifizierung erforderlich"
    );
  }

  const verifiedSession: AuthSession = {
    ...session,
    username: payload.username,
    role: payload.role,
    tokenType: session.tokenType || payload.token_type,
    accessTokenExpiresAt: payload.expires_at
  };
  persistAuthSession(verifiedSession);
  return verifiedSession;
}

async function refreshSession(session: AuthSession): Promise<AuthSession> {
  if (!session.refreshToken || isRefreshTokenExpired(session)) {
    clearStoredAuthSession();
    throw new AuthSessionError(
      "Die Admin-Sitzung ist abgelaufen. Bitte erneut anmelden.",
      401,
      "Token abgelaufen"
    );
  }

  const payload = await requestAuthJson<AuthTokenResponse>(
    "/api/v1/auth/refresh",
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        refresh_token: session.refreshToken
      })
    },
    "Admin-Sitzung konnte nicht aktualisiert werden."
  );

  const refreshedSession = createSessionFromTokenResponse(payload);
  persistAuthSession(refreshedSession);
  return refreshedSession;
}

export async function ensureFreshAuthSession(options?: { forceRefresh?: boolean; verify?: boolean }) {
  const session = getStoredAuthSession();
  if (session === null) {
    return null;
  }

  if (!session.refreshToken) {
    if (options?.verify) {
      try {
        return await verifyStoredSession(session);
      } catch {
        clearStoredAuthSession();
        return null;
      }
    }

    return session;
  }

  if (!options?.forceRefresh && !shouldRefreshAccessToken(session)) {
    if (options?.verify) {
      try {
        return await verifyStoredSession(session);
      } catch {
        return await ensureFreshAuthSession({ forceRefresh: true });
      }
    }

    return session;
  }

  if (refreshSessionPromise !== null) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = refreshSession(session)
    .catch((error) => {
      clearStoredAuthSession();
      throw error;
    })
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

export async function restoreAuthSession(): Promise<{ session: AuthSession | null; error: string | null }> {
  const session = getStoredAuthSession();
  if (session === null) {
    return { session: null, error: null };
  }

  if (!session.refreshToken) {
    return { session, error: null };
  }

  try {
    const restoredSession = await ensureFreshAuthSession({ verify: true });
    return {
      session: restoredSession,
      error: null
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin-Sitzung ist abgelaufen oder ungueltig. Bitte erneut anmelden.";
    clearStoredAuthSession();
    return { session: null, error: message };
  }
}

export function logout() {
  clearStoredAuthSession();
}

export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const session = await ensureFreshAuthSession();
  if (!session?.accessToken) {
    throw new AuthSessionError(
      "Admin-Sitzung fehlt. Bitte erneut anmelden, bevor du Lampentypen verwaltest.",
      401,
      "Authentifizierung erforderlich"
    );
  }

  const headers = new Headers(init?.headers ?? undefined);
  headers.set("Accept", headers.get("Accept") ?? "application/json");
  headers.set("Authorization", `Bearer ${session.accessToken}`);

  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers
    });
  } catch {
    throw new AuthSessionError(
      "Die Authentifizierungs-API ist momentan nicht erreichbar. Bitte Verbindung pruefen und erneut versuchen.",
      null,
      null
    );
  }

  if (response.status !== 401 || !session.refreshToken) {
    return response;
  }

  const refreshedSession = await ensureFreshAuthSession({ forceRefresh: true });
  if (!refreshedSession?.accessToken) {
    return response;
  }

  const retryHeaders = new Headers(init?.headers ?? undefined);
  retryHeaders.set("Accept", retryHeaders.get("Accept") ?? "application/json");
  retryHeaders.set("Authorization", `Bearer ${refreshedSession.accessToken}`);

  return fetch(input, {
    ...init,
    headers: retryHeaders
  });
}
