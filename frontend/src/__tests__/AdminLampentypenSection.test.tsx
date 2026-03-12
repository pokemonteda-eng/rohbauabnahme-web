import { fireEvent, render, screen, waitFor } from "@testing-library/react";

var mockListLampentypen = jest.fn();
var mockCreateLampentyp = jest.fn();
var mockUpdateLampentyp = jest.fn();
var mockDeleteLampentyp = jest.fn();

jest.mock("@/api/lampentypen", () => {
  class MockLampentypenApiError extends Error {
    status: number | null;
    detail: string | null;

    constructor(message: string, status: number | null, detail: string | null = null) {
      super(message);
      this.name = "LampentypenApiError";
      this.status = status;
      this.detail = detail;
    }
  }

  return {
    LampentypenApiError: MockLampentypenApiError,
    listLampentypen: mockListLampentypen,
    createLampentyp: mockCreateLampentyp,
    updateLampentyp: mockUpdateLampentyp,
    deleteLampentyp: mockDeleteLampentyp
  };
});

const { LampentypenApiError } = jest.requireMock("@/api/lampentypen") as {
  LampentypenApiError: new (message: string, status: number | null, detail?: string | null) => Error;
};

const { AdminLampentypenSection } = require("@/components/admin/AdminLampentypenSection") as {
  AdminLampentypenSection: typeof import("@/components/admin/AdminLampentypenSection").AdminLampentypenSection;
};

type LampentypApiEntry = {
  id: number;
  name: string;
  beschreibung: string;
  icon_url: string;
  standard_preis: number;
  version: number;
  angelegt_am: string;
  aktualisiert_am: string;
};

const TIMESTAMP = "2026-03-12T10:00:00Z";

function lampentyp(overrides: Partial<LampentypApiEntry> = {}): LampentypApiEntry {
  return {
    id: 1,
    name: "Heckblitzer",
    beschreibung: "Kompakter LED-Blitzer fuer das Heck.",
    icon_url: "https://cdn.example.com/icons/heckblitzer.png",
    standard_preis: 149.9,
    version: 1,
    angelegt_am: TIMESTAMP,
    aktualisiert_am: TIMESTAMP,
    ...overrides
  };
}

describe("AdminLampentypenSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListLampentypen.mockResolvedValue([]);
    mockCreateLampentyp.mockResolvedValue(lampentyp());
    mockUpdateLampentyp.mockResolvedValue(lampentyp({ version: 2 }));
    mockDeleteLampentyp.mockResolvedValue(undefined);
  });

  test("loads and renders lampentypen", async () => {
    mockListLampentypen.mockResolvedValue([
      lampentyp({ id: 2, name: "Arbeitsscheinwerfer", standard_preis: 99 }),
      lampentyp()
    ]);

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Arbeitsscheinwerfer")).not.toBeNull();
      expect(screen.getByText("Heckblitzer")).not.toBeNull();
    });

    expect(mockListLampentypen).toHaveBeenCalledTimes(1);
  });

  test("shows a clear load error when listing fails", async () => {
    mockListLampentypen.mockRejectedValue(new Error("Admin-Sitzung fehlt. Bitte erneut anmelden."));

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Lampentypen konnten nicht geladen werden.")).not.toBeNull();
      expect(screen.getByText(/Admin-Sitzung fehlt/i)).not.toBeNull();
    });
  });

  test("validates required fields, URL and price before submit", async () => {
    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Es sind noch keine Lampentypen vorhanden.")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Lampentyp anlegen" }));

    await waitFor(() => {
      expect(screen.getByText("Name ist erforderlich.")).not.toBeNull();
      expect(screen.getByText("Beschreibung ist erforderlich.")).not.toBeNull();
      expect(screen.getByText("Icon-URL ist erforderlich.")).not.toBeNull();
      expect(screen.getByText("Standard-Preis ist erforderlich.")).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  " } });
    fireEvent.change(screen.getByLabelText("Beschreibung"), { target: { value: "Test" } });
    fireEvent.change(screen.getByLabelText("Icon-URL"), { target: { value: "icon.png" } });
    fireEvent.change(screen.getByLabelText("Standard-Preis in EUR"), { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Lampentyp anlegen" }));

    await waitFor(() => {
      expect(screen.getByText("Name ist erforderlich.")).not.toBeNull();
      expect(screen.getByText("Icon-URL muss eine gueltige absolute URL sein.")).not.toBeNull();
      expect(screen.getByText("Standard-Preis darf nicht negativ sein.")).not.toBeNull();
    });

    expect(mockCreateLampentyp).not.toHaveBeenCalled();
  });

  test("creates a lampentyp and resets the form after success", async () => {
    mockCreateLampentyp.mockResolvedValue(lampentyp({ id: 7, name: "Frontblitzer", standard_preis: 88.5 }));

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Es sind noch keine Lampentypen vorhanden.")).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  Frontblitzer  " } });
    fireEvent.change(screen.getByLabelText("Beschreibung"), { target: { value: "Schmale Frontwarnleuchte." } });
    fireEvent.change(screen.getByLabelText("Icon-URL"), {
      target: { value: "https://cdn.example.com/icons/frontblitzer.png" }
    });
    fireEvent.change(screen.getByLabelText("Standard-Preis in EUR"), { target: { value: "88,5" } });
    fireEvent.click(screen.getByRole("button", { name: "Lampentyp anlegen" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain('Lampentyp "Frontblitzer" wurde angelegt.');
      expect(screen.getByText("Frontblitzer")).not.toBeNull();
    });

    expect(mockCreateLampentyp).toHaveBeenCalledWith({
      name: "Frontblitzer",
      beschreibung: "Schmale Frontwarnleuchte.",
      icon_url: "https://cdn.example.com/icons/frontblitzer.png",
      standard_preis: 88.5
    });
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Standard-Preis in EUR") as HTMLInputElement).value).toBe("");
  });

  test("reloads server state after a stale update conflict", async () => {
    const initialEntry = lampentyp();
    const refreshedEntry = lampentyp({
      name: "Heckblitzer Plus",
      beschreibung: "Bereits auf dem Server aktualisiert.",
      version: 2,
      standard_preis: 189.4
    });

    mockListLampentypen.mockResolvedValueOnce([initialEntry]).mockResolvedValueOnce([refreshedEntry]);
    mockUpdateLampentyp.mockRejectedValue(
      new LampentypenApiError(
        "Der Lampentyp wurde zwischenzeitlich geaendert. Bitte Liste neu laden und Aenderung erneut pruefen.",
        409,
        "Lampentyp wurde zwischenzeitlich geaendert"
      )
    );

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Heckblitzer")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Heckblitzer X" } });
    fireEvent.click(screen.getByRole("button", { name: "Lampentyp speichern" }));

    await waitFor(() => {
      expect(screen.getByText(/zwischenzeitlich geaendert/i)).not.toBeNull();
      expect(screen.getAllByText("Heckblitzer Plus").length).toBeGreaterThan(0);
      expect(screen.getByText("Version 2")).not.toBeNull();
    });

    expect(mockUpdateLampentyp).toHaveBeenCalledWith(1, {
      version: 1,
      name: "Heckblitzer X",
      beschreibung: "Kompakter LED-Blitzer fuer das Heck.",
      icon_url: "https://cdn.example.com/icons/heckblitzer.png",
      standard_preis: 149.9
    });
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("Heckblitzer Plus");
  });

  test("recovers from a delete conflict by reloading the list", async () => {
    mockListLampentypen.mockResolvedValueOnce([lampentyp()]).mockResolvedValueOnce([]);
    mockDeleteLampentyp.mockRejectedValue(
      new LampentypenApiError("Der Lampentyp wurde zwischenzeitlich geaendert.", 409, "Lampentyp wurde zwischenzeitlich geaendert")
    );

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Heckblitzer")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Loeschen" }));

    await waitFor(() => {
      expect(screen.getByText(/zwischenzeitlich geaendert/i)).not.toBeNull();
      expect(screen.getByText("Es sind noch keine Lampentypen vorhanden.")).not.toBeNull();
    });

    expect(mockDeleteLampentyp).toHaveBeenCalledWith(1, 1);
  });

  test("removes a lampentyp after a successful delete", async () => {
    mockListLampentypen.mockResolvedValue([lampentyp()]);

    render(<AdminLampentypenSection />);

    await waitFor(() => {
      expect(screen.getByText("Heckblitzer")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Loeschen" }));

    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toContain('Lampentyp "Heckblitzer" wurde geloescht.');
      expect(screen.getByText("Es sind noch keine Lampentypen vorhanden.")).not.toBeNull();
    });

    expect(mockDeleteLampentyp).toHaveBeenCalledWith(1, 1);
  });
});
