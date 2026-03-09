import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url === "/api/v1/kunden") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      }

      if (url === "/api/v1/stammdaten/aufbautypen") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["FB", "FZB", "Koffer"])
        } as Response);
      }

      if (url === "/api/v1/stammdaten/vertriebsgebiete") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["Nord", "Sued", "West"])
        } as Response);
      }

      return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders homepage content", async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.getByText("rohbauabnahme-web")).not.toBeNull();
    expect(screen.getByLabelText("Kunde")).not.toBeNull();
    expect(screen.getByLabelText("Aufbautyp")).not.toBeNull();
    expect(screen.getByLabelText("Vertriebsgebiet")).not.toBeNull();
    expect(screen.getByLabelText("Auftrags-Nr.")).not.toBeNull();
    expect(screen.getByLabelText("Protokolldatum")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "React Frontend Setup" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Primary Action" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Sekundär" })).not.toBeNull();
  });

  test("keeps protocol header fields controlled and updates values on change", async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const customerInput = screen.getByLabelText<HTMLInputElement>("Kunde");
    const aufbautypSelect = screen.getByLabelText<HTMLSelectElement>("Aufbautyp");
    const vertriebsgebietSelect = screen.getByLabelText<HTMLSelectElement>("Vertriebsgebiet");
    const orderNumberInput = screen.getByLabelText<HTMLInputElement>("Auftrags-Nr.");
    const protocolDateInput = screen.getByLabelText<HTMLInputElement>("Protokolldatum");

    expect(customerInput.value).toBe("");
    expect(aufbautypSelect.value).toBe("");
    expect(aufbautypSelect.required).toBe(true);
    expect(vertriebsgebietSelect.value).toBe("");
    expect(vertriebsgebietSelect.required).toBe(true);
    expect(orderNumberInput.required).toBe(true);
    expect(protocolDateInput.required).toBe(true);
    expect(orderNumberInput.value).toBe("");
    expect(protocolDateInput.value).toBe("");

    fireEvent.change(customerInput, { target: { value: "Test AG" } });
    fireEvent.change(aufbautypSelect, { target: { value: "FZB" } });
    fireEvent.change(vertriebsgebietSelect, { target: { value: "Nord" } });
    fireEvent.change(orderNumberInput, { target: { value: "A-2026-015" } });
    fireEvent.change(protocolDateInput, { target: { value: "2026-03-08" } });

    expect(customerInput.value).toBe("Test AG");
    expect(aufbautypSelect.value).toBe("FZB");
    expect(vertriebsgebietSelect.value).toBe("Nord");
    expect(orderNumberInput.value).toBe("A-2026-015");
    expect(protocolDateInput.value).toBe("2026-03-08");
  });
});
