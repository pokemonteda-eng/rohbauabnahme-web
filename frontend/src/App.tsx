import { useEffect, useState } from "react";

import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

type AppRoute = "/" | "/login" | "/admin";

function getLocationState() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === "/login") {
    return "/login";
  }
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "/admin";
  }

  return "/";
}

function AppContent() {
  const [locationState, setLocationState] = useState(() => getLocationState());
  const route = normalizeRoute(new URL(locationState, window.location.origin).pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setLocationState(getLocationState());
    };

    window.addEventListener("popstate", handleLocationChange);
    window.addEventListener("app:navigate", handleLocationChange as EventListener);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
      window.removeEventListener("app:navigate", handleLocationChange as EventListener);
    };
  }, []);

  if (route === "/login") {
    return <LoginPage />;
  }

  if (route === "/admin") {
    return (
      <ProtectedRoute requiredRole="admin">
        <AdminPage />
      </ProtectedRoute>
    );
  }

  return <HomePage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;