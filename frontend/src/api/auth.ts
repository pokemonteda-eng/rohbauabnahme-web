declare const __API_BASE_URL__: string | undefined;

const API_BASE_URL: string =
  (typeof __API_BASE_URL__ !== "undefined" && __API_BASE_URL__) || "";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  username: string;
  role: string;
}

export interface VerifyResponse {
  authenticated: boolean;
  username: string;
  role: string;
  token_type: string;
  expires_at: string;
}

export interface AuthError {
  message: string;
  status: number;
}

export class AuthApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data: { detail?: string } = await response.json().catch(() => ({}));
    const message: string = data.detail || `HTTP ${response.status}: ${response.statusText}`;
    throw new AuthApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const response: Response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(credentials)
  });
  return handleResponse<TokenResponse>(response);
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  const response: Response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  return handleResponse<TokenResponse>(response);
}

export async function verify(accessToken: string): Promise<VerifyResponse> {
  const response: Response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return handleResponse<VerifyResponse>(response);
}
