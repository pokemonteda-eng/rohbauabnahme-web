import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import React from "react";

import App from "@/App";

describe("App with Authentication", () => {
  test("redirects to login when not authenticated", async () => {
    render(
      React.createElement(MemoryRouter, { initialEntries: ["/"] }, React.createElement(App))
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    // Login form should be visible
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  test("login page shows required elements", async () => {
    render(
      React.createElement(MemoryRouter, { initialEntries: ["/login"] }, React.createElement(App))
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });
});
