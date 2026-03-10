const AUTH_ROLE_STORAGE_KEY = "rbw-user-role";

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
