import { useEffect, useState } from "react";

import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";

type AppRoute = "/" | "/admin";

function getLocationState() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function normalizeRoute(pathname: string): AppRoute {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "/admin";
  }

  return "/";
}

function App() {
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

  if (route === "/admin") {
    return <AdminPage />;
  }

  return <HomePage />;
}

export default App;
