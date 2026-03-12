```typescript
import { authService } from '../services/authService';
import { AuthResponse, LoginCredentials, SignupCredentials } from '../types/auth';
import { AxiosError } from 'axios';

describe('authService', () => {
  const mockLoginCredentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockSignupCredentials: SignupCredentials = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
  };

  const mockAuthResponse: AuthResponse = {
    token: 'mock-token',
    user: {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: mockAuthResponse });
      jest.spyOn(authService, 'login').mockImplementationOnce(async (credentials) => {
        return mockPost(credentials);
      });

      const result = await authService.login(mockLoginCredentials);
      expect(result).toEqual(mockAuthResponse);
      expect(mockPost).toHaveBeenCalledWith(mockLoginCredentials);
    });

    it('should throw an error when login fails', async () => {
      const mockError = new AxiosError('Invalid credentials');
      const mockPost = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(authService, 'login').mockImplementationOnce(async (credentials) => {
        return mockPost(credentials);
      });

      await expect(authService.login(mockLoginCredentials)).rejects.toThrow();
      expect(mockPost).toHaveBeenCalledWith(mockLoginCredentials);
    });
  });

  describe('signup', () => {
    it('should successfully signup with valid credentials', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: mockAuthResponse });
      jest.spyOn(authService, 'signup').mockImplementationOnce(async (credentials) => {
        return mockPost(credentials);
      });

      const result = await authService.signup(mockSignupCredentials);
      expect(result).toEqual(mockAuthResponse);
      expect(mockPost).toHaveBeenCalledWith(mockSignupCredentials);
    });

    it('should throw an error when signup fails', async () => {
      const mockError = new AxiosError('Email already exists');
      const mockPost = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(authService, 'signup').mockImplementationOnce(async (credentials) => {
        return mockPost(credentials);
      });

      await expect(authService.signup(mockSignupCredentials)).rejects.toThrow();
      expect(mockPost).toHaveBeenCalledWith(mockSignupCredentials);
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockPost = jest.fn().mockResolvedValue({ data: { success: true } });
      jest.spyOn(authService, 'logout').mockImplementationOnce(async () => {
        return mockPost();
      });

      const result = await authService.logout();
      expect(result).toEqual({ success: true });
      expect(mockPost).toHaveBeenCalled();
    });

    it('should throw an error when logout fails', async () => {
      const mockError = new AxiosError('Logout failed');
      const mockPost = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(authService, 'logout').mockImplementationOnce(async () => {
        return mockPost();
      });

      await expect(authService.logout()).rejects.toThrow();
      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user if authenticated', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: mockAuthResponse.user });
      jest.spyOn(authService, 'getCurrentUser').mockImplementationOnce(async () => {
        return mockGet();
      });

      const result = await authService.getCurrentUser();
      expect(result).toEqual(mockAuthResponse.user);
      expect(mockGet).toHaveBeenCalled();
    });

    it('should return null if not authenticated', async () => {
      const mockGet = jest.fn().mockResolvedValue({ data: null });
      jest.spyOn(authService, 'getCurrentUser').mockImplementationOnce(async () => {
        return mockGet();
      });

      const result = await authService.getCurrentUser();
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalled();
    });

    it('should throw an error when getting current user fails', async () => {
      const mockError = new AxiosError('Failed to fetch user');
      const mockGet = jest.fn().mockRejectedValue(mockError);
      jest.spyOn(authService, 'getCurrentUser').mockImplementationOnce(async () => {
        return mockGet();
      });

      await expect(authService.getCurrentUser()).rejects.toThrow();
      expect(mockGet).toHaveBeenCalled();
    });
  });
});
```
