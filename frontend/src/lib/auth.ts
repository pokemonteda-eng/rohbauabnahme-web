const AUTH_ROLE_STORAGE_KEY = "rbw-user-role";
const AUTH_TOKEN_STORAGE_KEY = "rbw-auth-token";

export type UserRole = "admin" | "projektleiter" | "bearbeiter" | "viewer" | "anonymous";

const VALID_ROLES = new Set<UserRole>(["admin", "projektleiter", "bearbeiter", "viewer", "anonymous"]);

export function getCurrentUserRole(): UserRole {
  const storedRole = window.localStorage.getItem(AUTH_ROLE_STORAGE_KEY);

  if (storedRole && VALID_ROLES.has(storedRole as UserRole)) {
    return storedRole as UserRole;
  }

  return "anonymous";
}

export function setCurrentUserRole(role: Exclude<UserRole, "anonymous">) {
  window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
}

export function clearCurrentUserRole() {
  window.localStorage.removeItem(AUTH_ROLE_STORAGE_KEY);
}

export function isAdminRole(role: UserRole) {
  return role === "admin";
}

export function getCurrentAuthToken(): string | null {
  const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
  return token ? token : null;
}

export function setCurrentAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearCurrentAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export function getAuthHeaders(): HeadersInit {
  const token = getCurrentAuthToken();
  const role = getCurrentUserRole();

  if (token == null) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    "X-User-Role": role
  };
}
