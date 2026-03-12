```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  private token: string | null = null;
  private refreshTokenPromise: Promise<string> | null = null;
  private refreshTokenUrl: string;

  constructor(baseURL: string, refreshTokenUrl: string = '/auth/refresh') {
    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    this.refreshTokenUrl = refreshTokenUrl;

    this.initializeInterceptors();
  }

  private initializeInterceptors(): void {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (error.response.data?.message === 'Token expired') {
            originalRequest._retry = true;

            try {
              const newToken = await this.refreshToken();
              this.setToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.instance(originalRequest);
            } catch (refreshError) {
              this.clearToken();
              return Promise.reject(refreshError);
            }
          }
        }

        if (error.response?.status === 401) {
          this.clearToken();
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<string> {
    if (!this.refreshTokenPromise) {
      this.refreshTokenPromise = this.instance.post<{ token: string }>(this.refreshTokenUrl)
        .then(response => {
          this.refreshTokenPromise = null;
          return response.data.token;
        })
        .catch(error => {
          this.refreshTokenPromise = null;
          throw error;
        });
    }

    return this.refreshTokenPromise;
  }

  public setToken(token: string): void {
    this.token = token;
  }

  public getToken(): string | null {
    return this.token;
  }

  public clearToken(): void {
    this.token = null;
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
}

export const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || '/api');
export default ApiClient;
```
