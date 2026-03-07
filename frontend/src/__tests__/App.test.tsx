import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";

import App from "@/App";

describe("App", () => {
  test("renders homepage content", () => {
    render(<App />);

    expect(screen.queryByText("rohbauabnahme-web")).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "React Frontend Setup" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Primary Action" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Sekundär" })).not.toBeNull();
  });
});
