import axios from axios;
import { authService } from ../services/authService;

const api = axios.create({
  baseURL: /api,
});

api.interceptors.request.use((config) => {
  const token = authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await authService.refreshAccessToken();
        return api.request(error.config);
      } catch {
        authService.logout();
        window.location.href = /login;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
