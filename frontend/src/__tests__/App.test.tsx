import { describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";

import App from "@/App";

describe("App", () => {
  test("renders homepage content", () => {
    render(<App />);

    expect(screen.queryByText("rohbauabnahme-web")).not.toBeNull();
    expect(screen.queryByLabelText("Auftrags-Nr.")).not.toBeNull();
    expect(screen.queryByLabelText("Protokolldatum")).not.toBeNull();
    expect(screen.queryByRole("heading", { name: "React Frontend Setup" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Primary Action" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Sekundär" })).not.toBeNull();
  });

  test("keeps protocol header fields controlled and updates values on change", () => {
    render(<App />);

    const orderNumberInput = screen.getByLabelText("Auftrags-Nr.") as HTMLInputElement;
    const protocolDateInput = screen.getByLabelText("Protokolldatum") as HTMLInputElement;

    expect(orderNumberInput.value).toBe("");
    expect(protocolDateInput.value).toBe("");

    fireEvent.change(orderNumberInput, { target: { value: "A-2026-015" } });
    fireEvent.change(protocolDateInput, { target: { value: "2026-03-08" } });

    expect(orderNumberInput.value).toBe("A-2026-015");
    expect(protocolDateInput.value).toBe("2026-03-08");
  });
});
