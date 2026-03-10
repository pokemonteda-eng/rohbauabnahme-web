import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/App";

describe("App", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (url === "/api/v1/kunden") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        } as Response);
      }

      if (url === "/api/v1/master-data/aufbautypen") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["FB", "FZB", "Koffer"])
        } as Response);
      }

      if (url === "/api/v1/master-data/projektleiter") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(["Max Mustermann", "Erika Musterfrau"])
        } as Response);
      }

      if (url === "/api/v1/master-data/vertriebsgebiete") {
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
    expect(screen.getByLabelText("Projektleiter")).not.toBeNull();
    expect(screen.getByLabelText("Aufbautyp")).not.toBeNull();
    expect(screen.getByLabelText("Vertriebsgebiet")).not.toBeNull();
    expect(screen.getByLabelText("Auftrags-Nr.")).not.toBeNull();
    expect(screen.getByLabelText("Protokolldatum")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Lackierung" })).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Live-Preisanzeige Zubehör" })).not.toBeNull();
    expect(screen.getByLabelText("Klarlackschicht")).not.toBeNull();
    expect(screen.getByLabelText("Zinkstaub")).not.toBeNull();
    expect(screen.getByLabelText("E-Kolben")).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Technische Änderungen" })).not.toBeNull();
    expect(screen.getByRole("group", { name: "Kabel/Funklayout geändert" })).not.toBeNull();
    expect(screen.getByLabelText("Technische Änderungen")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ja" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Nein" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getAllByRole("heading", { name: "Zubehör" })).toHaveLength(5);
    expect(screen.getByText("Kategorie: Aufbau")).not.toBeNull();
    expect(screen.getByText("Kategorie: Rahmen")).not.toBeNull();
    expect(screen.getByText("Kategorie: Schüttblende")).not.toBeNull();
    expect(screen.getByText("Kategorie: Schrottkasten")).not.toBeNull();
    expect(screen.getByText("Kategorie: Schränke")).not.toBeNull();
    expect(screen.getByLabelText("UML")).not.toBeNull();
    expect(screen.getByLabelText("FHB")).not.toBeNull();
    expect(screen.getByLabelText("RUK")).not.toBeNull();
    expect(screen.getByLabelText("ASW")).not.toBeNull();
    expect(screen.getByLabelText("RFK")).not.toBeNull();
    expect(screen.getByLabelText("SPO")).not.toBeNull();
    expect(screen.getByLabelText("SB")).not.toBeNull();
    expect(screen.getByLabelText("Rahmen")).not.toBeNull();
    expect(screen.getByLabelText("Schrottkasten")).not.toBeNull();
    expect(screen.getByLabelText("Schüttblende Außen")).not.toBeNull();
    expect(screen.getByLabelText("Oben")).not.toBeNull();
    expect(screen.getByLabelText("Unten")).not.toBeNull();
    expect(screen.getByLabelText("Kleiderschrank")).not.toBeNull();
    expect(screen.getByLabelText("Schüttblende Innen")).not.toBeNull();
    expect(screen.getByRole("checkbox", { name: /^Innen$/ })).not.toBeNull();
    expect(screen.getByText("Noch kein Zubehör ausgewählt.")).not.toBeNull();
    expect(screen.getByTestId("accessory-total").textContent).toContain("0,00");
    expect(screen.queryByLabelText("Bemerkung Klarlackschicht")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung Zinkstaub")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung E-Kolben")).toBeNull();
    expect(screen.getByRole("heading", { name: "React Frontend Setup" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Primary Action" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Sekundär" })).not.toBeNull();
  });

  test("keeps protocol header fields controlled and updates values on change", async () => {
    const { container } = render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const customerInput = screen.getByLabelText<HTMLInputElement>("Kunde");
    const projektleiterSelect = screen.getByLabelText<HTMLSelectElement>("Projektleiter");
    const aufbautypSelect = screen.getByLabelText<HTMLSelectElement>("Aufbautyp");
    const vertriebsgebietSelect = screen.getByLabelText<HTMLSelectElement>("Vertriebsgebiet");
    const orderNumberInput = screen.getByLabelText<HTMLInputElement>("Auftrags-Nr.");
    const protocolDateInput = screen.getByLabelText<HTMLInputElement>("Protokolldatum");
    const klarlackschichtCheckbox = screen.getByLabelText<HTMLInputElement>("Klarlackschicht");
    const zinkstaubCheckbox = screen.getByLabelText<HTMLInputElement>("Zinkstaub");
    const eKolbenCheckbox = screen.getByLabelText<HTMLInputElement>("E-Kolben");
    const kabelFunklayoutJaButton = screen.getByRole<HTMLButtonElement>("button", { name: "Ja" });
    const kabelFunklayoutNeinButton = screen.getByRole<HTMLButtonElement>("button", { name: "Nein" });
    const technischeAenderungenTextarea =
      screen.getByLabelText<HTMLTextAreaElement>("Technische Änderungen");
    const umlCheckbox = screen.getByLabelText<HTMLInputElement>("UML");
    const fhbCheckbox = screen.getByLabelText<HTMLInputElement>("FHB");
    const sbCheckbox = screen.getByLabelText<HTMLInputElement>("SB");
    const rahmenCheckbox = screen.getByLabelText<HTMLInputElement>("Rahmen");
    const schrottkastenCheckbox = screen.getByLabelText<HTMLInputElement>("Schrottkasten");
    const aussenCheckbox = screen.getByLabelText<HTMLInputElement>("Schüttblende Außen");
    const obenCheckbox = container.querySelector<HTMLInputElement>("#schraenke-oben");
    const untenCheckbox = container.querySelector<HTMLInputElement>("#schraenke-unten");
    const kleiderschrankCheckbox = container.querySelector<HTMLInputElement>("#schraenke-kleiderschrank");
    const schuettblendeInnenCheckbox = screen.getByLabelText<HTMLInputElement>("Schüttblende Innen");
    const innenCheckbox = screen.getByRole<HTMLInputElement>("checkbox", { name: /^Innen$/ });
    if (!obenCheckbox || !untenCheckbox || !kleiderschrankCheckbox) {
      throw new Error("Expected zubehoer checkboxes to be rendered");
    }

    expect(customerInput.value).toBe("");
    expect(projektleiterSelect.value).toBe("");
    expect(projektleiterSelect.required).toBe(true);
    expect(aufbautypSelect.value).toBe("");
    expect(aufbautypSelect.required).toBe(true);
    expect(vertriebsgebietSelect.value).toBe("");
    expect(vertriebsgebietSelect.required).toBe(true);
    expect(orderNumberInput.required).toBe(true);
    expect(protocolDateInput.required).toBe(true);
    expect(projektleiterSelect.value).toBe("");
    expect(orderNumberInput.value).toBe("");
    expect(protocolDateInput.value).toBe("");
    expect(klarlackschichtCheckbox.checked).toBe(false);
    expect(zinkstaubCheckbox.checked).toBe(false);
    expect(eKolbenCheckbox.checked).toBe(false);
    expect(kabelFunklayoutJaButton.getAttribute("aria-pressed")).toBe("false");
    expect(kabelFunklayoutNeinButton.getAttribute("aria-pressed")).toBe("false");
    expect(technischeAenderungenTextarea.value).toBe("");
    expect(umlCheckbox.checked).toBe(false);
    expect(fhbCheckbox.checked).toBe(false);
    expect(sbCheckbox.checked).toBe(false);
    expect(rahmenCheckbox.checked).toBe(false);
    expect(schrottkastenCheckbox.checked).toBe(false);
    expect(aussenCheckbox.checked).toBe(false);
    expect(schuettblendeInnenCheckbox.checked).toBe(false);
    expect(obenCheckbox.checked).toBe(false);
    expect(untenCheckbox.checked).toBe(false);
    expect(kleiderschrankCheckbox.checked).toBe(false);
    expect(innenCheckbox.checked).toBe(false);
    expect(screen.getByTestId("accessory-total").textContent).toContain("0,00");
    expect(screen.queryByLabelText("Bemerkung Klarlackschicht")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung Zinkstaub")).toBeNull();
    expect(screen.queryByLabelText("Bemerkung E-Kolben")).toBeNull();

    fireEvent.change(projektleiterSelect, { target: { value: "Max Mustermann" } });
    fireEvent.change(customerInput, { target: { value: "Test AG" } });
    fireEvent.change(aufbautypSelect, { target: { value: "FZB" } });
    fireEvent.change(vertriebsgebietSelect, { target: { value: "Nord" } });
    fireEvent.change(orderNumberInput, { target: { value: "A-2026-015" } });
    fireEvent.change(protocolDateInput, { target: { value: "2026-03-08" } });
    fireEvent.click(klarlackschichtCheckbox);
    fireEvent.click(zinkstaubCheckbox);
    fireEvent.click(eKolbenCheckbox);
    fireEvent.click(kabelFunklayoutJaButton);
    fireEvent.change(technischeAenderungenTextarea, {
      target: { value: "Zusätzliche Verkabelung erforderlich\nAntenne neu positionieren" }
    });
    fireEvent.click(umlCheckbox);
    fireEvent.click(fhbCheckbox);
    fireEvent.click(sbCheckbox);
    fireEvent.click(rahmenCheckbox);
    fireEvent.click(schrottkastenCheckbox);
    fireEvent.click(aussenCheckbox);
    fireEvent.click(schuettblendeInnenCheckbox);
    fireEvent.click(obenCheckbox);
    fireEvent.click(untenCheckbox);
    fireEvent.click(kleiderschrankCheckbox);
    fireEvent.click(innenCheckbox);

    const klarlackschichtBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung Klarlackschicht");
    const zinkstaubBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung Zinkstaub");
    const eKolbenBemerkung = screen.getByLabelText<HTMLInputElement>("Bemerkung E-Kolben");

    fireEvent.change(klarlackschichtBemerkung, { target: { value: "Decklack nacharbeiten" } });
    fireEvent.change(zinkstaubBemerkung, { target: { value: "Schichtdicke pruefen" } });
    fireEvent.change(eKolbenBemerkung, { target: { value: "Anschluss kontrollieren" } });

    expect(projektleiterSelect.value).toBe("Max Mustermann");
    expect(customerInput.value).toBe("Test AG");
    expect(aufbautypSelect.value).toBe("FZB");
    expect(vertriebsgebietSelect.value).toBe("Nord");
    expect(orderNumberInput.value).toBe("A-2026-015");
    expect(protocolDateInput.value).toBe("2026-03-08");
    expect(klarlackschichtCheckbox.checked).toBe(true);
    expect(zinkstaubCheckbox.checked).toBe(true);
    expect(eKolbenCheckbox.checked).toBe(true);
    expect(kabelFunklayoutJaButton.getAttribute("aria-pressed")).toBe("true");
    expect(kabelFunklayoutNeinButton.getAttribute("aria-pressed")).toBe("false");
    expect(technischeAenderungenTextarea.value).toBe(
      "Zusätzliche Verkabelung erforderlich\nAntenne neu positionieren"
    );
    expect(umlCheckbox.checked).toBe(true);
    expect(fhbCheckbox.checked).toBe(true);
    expect(sbCheckbox.checked).toBe(true);
    expect(rahmenCheckbox.checked).toBe(true);
    expect(schrottkastenCheckbox.checked).toBe(true);
    expect(aussenCheckbox.checked).toBe(true);
    expect(schuettblendeInnenCheckbox.checked).toBe(true);
    expect(obenCheckbox.checked).toBe(true);
    expect(untenCheckbox.checked).toBe(true);
    expect(kleiderschrankCheckbox.checked).toBe(true);
    expect(innenCheckbox.checked).toBe(true);
    expect(klarlackschichtBemerkung.value).toBe("Decklack nacharbeiten");
    expect(zinkstaubBemerkung.value).toBe("Schichtdicke pruefen");
    expect(eKolbenBemerkung.value).toBe("Anschluss kontrollieren");
    expect(screen.getByTestId("accessory-count").textContent).toBe("11");
    expect(screen.getByTestId("accessory-total").textContent).toContain("14.850,00");
    expect(screen.queryByText("Noch kein Zubehör ausgewählt.")).toBeNull();
  });
});
