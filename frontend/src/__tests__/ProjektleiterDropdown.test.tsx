import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProjektleiterDropdown } from "@/components/protocol/ProjektleiterDropdown";

describe("ProjektleiterDropdown", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads options and propagates selection", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(["Max Mustermann", "Erika Musterfrau"])
    } as Response);
    global.fetch = fetchMock;

    const onChange = jest.fn();
    render(<ProjektleiterDropdown value="" onChange={onChange} />);

    const select = screen.getByLabelText<HTMLSelectElement>("Projektleiter");
    expect(select.disabled).toBe(true);
    expect(screen.getByRole("option", { name: "Lade Projektleiter..." })).not.toBeNull();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/v1/stammdaten/projektleiter",
        expect.objectContaining({ method: "GET" })
      );
    });

    await waitFor(() => {
      expect(select.disabled).toBe(false);
    });

    expect(screen.getByRole("option", { name: "Max Mustermann" })).not.toBeNull();
    fireEvent.change(select, { target: { value: "Erika Musterfrau" } });

    expect(onChange).toHaveBeenCalledWith("Erika Musterfrau");
  });

  test("shows error state when API call fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    render(<ProjektleiterDropdown value="" onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Fehler beim Laden" })).not.toBeNull();
    });

    expect(screen.getByLabelText<HTMLSelectElement>("Projektleiter").disabled).toBe(true);
  });

  test("shows empty state when API returns no entries", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    } as Response);

    render(<ProjektleiterDropdown value="" onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Keine Projektleiter verfügbar" })).not.toBeNull();
    });

    expect(screen.getByLabelText<HTMLSelectElement>("Projektleiter").disabled).toBe(true);
  });
});
