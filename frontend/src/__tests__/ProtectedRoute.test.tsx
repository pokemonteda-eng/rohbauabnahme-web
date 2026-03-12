import { render, screen } from "@testing-library/react";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/context/AuthContext");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const ProtectedContent = () => <div data-testid="protected-content">Protected</div>;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows loading spinner when loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: true,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    );

    expect(screen.getByText("Lade...")).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  test("shows loading state when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should redirect, so no protected content
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  test("renders protected content when authenticated as admin", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      username: "admin",
      role: "admin",
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <ProtectedRoute>
        <ProtectedContent />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });

  test("redirects when authenticated but not admin", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      username: "viewer",
      role: "viewer",
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <ProtectedRoute requiredRole="admin">
        <ProtectedContent />
      </ProtectedRoute>
    );

    // Should redirect, so no protected content
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  test("renders content for projektleiter role when required", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      username: "manager",
      role: "projektleiter",
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: jest.fn()
    });

    render(
      <ProtectedRoute requiredRole="projektleiter">
        <ProtectedContent />
      </ProtectedRoute>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
  });
});