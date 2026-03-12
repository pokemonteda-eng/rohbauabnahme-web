```
import { useAuth } from "@/context/AuthContext";
import { isAdminRole, type UserRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: string;
}

export function ProtectedRoute({
  children,
  requiredRole = "admin",
  fallback = "/login"
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <svg className="h-8 w-8 animate-spin text-amber-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="mt-4 text-sm text-stone-400">Lade...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.history.pushState({}, "", fallback);
    window.dispatchEvent(new Event("app:navigate"));
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400">Weiterleitung...</p>
      </div>
    );
  }

  if (requiredRole === "admin" && !isAdminRole(role)) {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("app:navigate"));
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400">Weiterleitung...</p>
      </div>
    );
  }

  if (requiredRole !== "admin" && role !== requiredRole) {
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new Event("app:navigate"));
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-400">Weiterleitung...</p>
      </div>
    );
  }

  return <>{children}</>;
}
```
