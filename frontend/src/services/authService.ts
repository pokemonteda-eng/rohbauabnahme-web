const API_URL = '/api/auth';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: { username: string; is_admin: boolean };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) throw new Error('Login failed');
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data;
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');
    const response = await fetch(`${API_URL}/refresh`, {
      method: POST,
      headers: { Content-Type: application/json },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) throw new Error('Refresh failed');
    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data.access_token;
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },
};
