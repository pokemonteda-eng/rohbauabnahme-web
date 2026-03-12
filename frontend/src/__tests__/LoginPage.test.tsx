import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LoginPage } from "@/pages/LoginPage";
import { useAuth } from "@/context/AuthContext";
import { navigateTo } from "@/lib/navigation";

// Mock dependencies
jest.mock("@/context/AuthContext");
jest.mock("@/lib/navigation");

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockNavigateTo = navigateTo as jest.MockedFunction<typeof navigateTo>;

describe("LoginPage", () => {
  const mockLogin = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: false,
      error: null,
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: mockClearError
    });
  });

  test("renders login form", () => {
    render(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Anmelden" })).toBeInTheDocument();
    expect(screen.getByLabelText("Benutzername")).toBeInTheDocument();
    expect(screen.getByLabelText("Passwort")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anmelden" })).toBeInTheDocument();
  });

  test("updates username input on change", async () => {
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Benutzername");
    await userEvent.type(usernameInput, "admin");

    expect(usernameInput).toHaveValue("admin");
  });

  test("updates password input on change", async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Passwort");
    await userEvent.type(passwordInput, "secret");

    expect(passwordInput).toHaveValue("secret");
  });

  test("toggles password visibility", async () => {
    render(<LoginPage />);

    const passwordInput = screen.getByLabelText("Passwort");
    const toggleButton = screen.getByRole("button", { name: /Passwort/ });

    expect(passwordInput).toHaveAttribute("type", "password");

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    await userEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("calls login on form submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Benutzername"), "admin");
    await userEvent.type(screen.getByLabelText("Passwort"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: "admin", password: "secret" });
    });
  });

  test("navigates to admin on successful login", async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Benutzername"), "admin");
    await userEvent.type(screen.getByLabelText("Passwort"), "secret");
    await userEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() => {
      expect(mockNavigateTo).toHaveBeenCalledWith("/admin");
    });
  });

  test("displays error message", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: false,
      error: "Ungueltige Zugangsdaten",
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: mockClearError
    });

    render(<LoginPage />);

    expect(screen.getByText("Ungueltige Zugangsdaten")).toBeInTheDocument();
  });

  test("clears error on input change", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: false,
      error: "Login failed",
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: mockClearError
    });

    render(<LoginPage />);

    const usernameInput = screen.getByLabelText("Benutzername");
    await userEvent.type(usernameInput, "a");

    expect(mockClearError).toHaveBeenCalled();
  });

  test("disables submit button when loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      username: null,
      role: "anonymous",
      isLoading: true,
      error: null,
      login: mockLogin,
      logout: jest.fn(),
      refreshToken: jest.fn(),
      clearError: mockClearError
    });

    render(<LoginPage />);

    const submitButton = screen.getByRole("button");
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Wird angemeldet...");
  });

  test("disables submit button when fields are empty", () => {
    render(<LoginPage />);

    const submitButton = screen.getByRole("button", { name: "Anmelden" });
    expect(submitButton).toBeDisabled();
  });
});