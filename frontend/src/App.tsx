import { useEffect, useState } from "react";

import { AdminPage } from "@/pages/AdminPage";
import { HomePage } from "@/pages/HomePage";

type AppRoute = "/" | "/admin";

function normalizeRoute(pathname: string): AppRoute {
  if (pathname.startsWith("/admin")) {
    return "/admin";
  }

  return "/";
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(normalizeRoute(window.location.pathname));
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
