interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error("Login failed");
  }

  const data: unknown = await response.json();
  if (data && typeof data === "object" && "token" in data && "user" in data) {
    return data as LoginResponse;
  }
  throw new Error("Invalid response format");
};

export const logout = async (token: string): Promise<void> => {
  await fetch("/api/v1/auth/logout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
};

export const refreshToken = async (token: string): Promise<{ token: string }> => {
  const response = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data: unknown = await response.json();
  if (data && typeof data === "object" && "token" in data) {
    return data as { token: string };
  }
  throw new Error("Invalid response format");
};
