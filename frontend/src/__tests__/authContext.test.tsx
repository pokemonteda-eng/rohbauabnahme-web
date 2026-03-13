import React from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { mockLocalStorage } from '../../test-utils/mockLocalStorage';

describe('AuthContext', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent = () => {
    const { user, login, logout, loading } = useAuth();
    return (
      <div>
        <div data-testid="user">{user ? user.email : 'No user'}</div>
        <button onClick={() => login('test@example.com', 'password123')}>Login</button>
        <button onClick={() => logout()}>Logout</button>
        <div data-testid="loading">{loading ? 'Loading' : 'Not loading'}</div>
      </div>
    );
  };

  it('should initialize with no user and not loading', () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe('No user');
    expect(getByTestId('loading').textContent).toBe('Not loading');
  });

  it('should login successfully', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
      expect(getByTestId('loading').textContent).toBe('Not loading');
      expect(localStorage.getItem('user')).toBeTruthy();
    });
  });

  it('should logout successfully', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
    });

    act(() => {
      getByText('Logout').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('No user');
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  it('should persist user on refresh', () => {
    localStorage.setItem('user', JSON.stringify({ email: 'persisted@example.com' }));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId('user').textContent).toBe('persisted@example.com');
  });

  it('should handle login failure', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn(() =>
      Promise.reject(new Error('Login failed'))
    ) as jest.Mock;

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('No user');
      expect(getByTestId('loading').textContent).toBe('Not loading');
    });

    global.fetch = originalFetch;
  });

  it('should show loading state during login', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByText('Login').click();
    });

    expect(getByTestId('loading').textContent).toBe('Loading');

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('Not loading');
    });
  });

  it('should show loading state during logout', async () => {
    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    act(() => {
      getByText('Login').click();
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
    });

    act(() => {
      getByText('Logout').click();
    });

    expect(getByTestId('loading').textContent).toBe('Loading');

    await waitFor(() => {
      expect(getByTestId('loading').textContent).toBe('Not loading');
    });
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const TestComponentWithoutProvider = () => {
      const { user } = useAuth();
      return <div>{user?.email}</div>;
    };

    expect(() => render(<TestComponentWithoutProvider />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });

  it('should handle token expiration', async () => {
    const expiredUser = {
      email: 'expired@example.com',
      token: 'expired-token',
      expiresAt: Date.now() - 1000
    };

    localStorage.setItem('user', JSON.stringify(expiredUser));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('No user');
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
