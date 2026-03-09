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
    expect(screen.getByRole("heading", { name: "Lackierung" })).not.toBeNull();
    expect(screen.getByLabelText("Klarlackschicht")).not.toBeNull();
    expect(screen.getByLabelText("Zinkstaub")).not.toBeNull();
    expect(screen.getByLabelText("E-Kolben")).not.toBeNull();
    expect(screen.queryByLabelText("Bemerkung Klarlackschicht")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung Zinkstaub")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung E-Kolben")).toBeNull();
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
    const klarlackschichtCheckbox = screen.getByLabelText<HTMLInputElement>("Klarlackschicht");
    const zinkstaubCheckbox = screen.getByLabelText<HTMLInputElement>("Zinkstaub");
    const eKolbenCheckbox = screen.getByLabelText<HTMLInputElement>("E-Kolben");

    expect(customerInput.value).toBe("");
    expect(aufbautypSelect.value).toBe("");
    expect(aufbautypSelect.required).toBe(true);
    expect(vertriebsgebietSelect.value).toBe("");
    expect(vertriebsgebietSelect.required).toBe(true);
    expect(orderNumberInput.required).toBe(true);
    expect(protocolDateInput.required).toBe(true);
    expect(orderNumberInput.value).toBe("");
    expect(protocolDateInput.value).toBe("");
    expect(klarlackschichtCheckbox.checked).toBe(false);
    expect(zinkstaubCheckbox.checked).toBe(false);
    expect(eKolbenCheckbox.checked).toBe(false);
    expect(screen.queryByLabelText("Bemerkung Klarlackschicht")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung Zinkstaub")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung E-Kolben")).toBeNull();

    fireEvent.change(customerInput, { target: { value: "Test AG" } });
    fireEvent.change(aufbautypSelect, { target: { value: "FZB" } });
    fireEvent.change(vertriebsgebietSelect, { target: { value: "Nord" } });
    fireEvent.change(orderNumberInput, { target: { value: "A-2026-015" } });
    fireEvent.change(protocolDateInput, { target: { value: "2026-03-08" } });
    fireEvent.click(klarlackschichtCheckbox);
    fireEvent.click(zinkstaubCheckbox);
    fireEvent.click(eKolbenCheckbox);

    const klarlackschichtBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung Klarlackschicht");
    const zinkstaubBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung Zinkstaub");
    const eKolbenBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung E-Kolben");

    fireEvent.change(klarlackschichtBemerkung, { target: { value: "Decklack nacharbeiten" } });
    fireEvent.change(zinkstaubBemerkung, { target: { value: "Schichtdicke pruefen" } });
    fireEvent.change(eKolbenBemerkung, { target: { value: "Anschluss kontrollieren" } });

    expect(customerInput.value).toBe("Test AG");
    expect(aufbautypSelect.value).toBe("FZB");
    expect(vertriebsgebietSelect.value).toBe("Nord");
    expect(orderNumberInput.value).toBe("A-2026-015");
    expect(protocolDateInput.value).toBe("2026-03-08");
    expect(klarlackschichtCheckbox.checked).toBe(true);
    expect(zinkstaubCheckbox.checked).toBe(true);
    expect(eKolbenCheckbox.checked).toBe(true);
    expect(klarlackschichtBemerkung.value).toBe("Decklack nacharbeiten");
    expect(zinkstaubBemerkung.value).toBe("Schichtdicke pruefen");
    expect(eKolbenBemerkung.value).toBe("Anschluss kontrollieren");
  });
});
