import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  exp?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (token) {
          const decoded = jwtDecode<User>(token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp < currentTime) {
            localStorage.removeItem('authToken');
            setAuthState(prev => ({ ...prev, isAuthenticated: false, user: null, token: null, loading: false }));
            return;
          }

          setAuthState({
            isAuthenticated: true,
            user: decoded,
            token,
            loading: false,
            error: null,
          });
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        localStorage.removeItem('authToken');
        setAuthState(prev => ({ ...prev, isAuthenticated: false, user: null, token: null, loading: false, error: 'Invalid token' }));
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const decoded = jwtDecode<User>(data.token);

      localStorage.setItem('authToken', data.token);
      setAuthState({
        isAuthenticated: true,
        user: decoded,
        token: data.token,
        loading: false,
        error: null,
      });

      navigate('/dashboard');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      const decoded = jwtDecode<User>(data.token);

      localStorage.setItem('authToken', data.token);
      setAuthState({
        isAuthenticated: true,
        user: decoded,
        token: data.token,
        loading: false,
        error: null,
      });

      navigate('/dashboard');
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    navigate('/login');
  };

  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const decoded = jwtDecode<User>(data.token);

      localStorage.setItem('authToken', data.token);
      setAuthState(prev => ({
        ...prev,
        user: decoded,
        token: data.token,
      }));

      return data.token;
    } catch (error) {
      logout();
      throw error;
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    refreshToken,
  };
};

export default useAuth;
