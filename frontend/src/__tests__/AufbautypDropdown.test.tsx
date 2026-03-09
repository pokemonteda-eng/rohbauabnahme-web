import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AufbautypDropdown } from "@/components/protocol/AufbautypDropdown";

describe("AufbautypDropdown", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("loads options and propagates selection", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["FB", "FZB"])
      } as Response) as unknown as typeof fetch
    );

    const onChange = jest.fn();
    render(<AufbautypDropdown value="" onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "FB" })).not.toBeNull();
    });
    expect(screen.getByRole("option", { name: "Bitte Aufbautyp auswählen" })).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Aufbautyp"), { target: { value: "FZB" } });
    expect(onChange).toHaveBeenCalledWith("FZB");
  });

  test("shows an error and disables select when loading fails", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve([])
      } as Response) as unknown as typeof fetch
    );

    const onChange = jest.fn();
    render(<AufbautypDropdown value="" onChange={onChange} />);

    await waitFor(() => {
      expect(screen.getByText("Aufbautypen konnten nicht geladen werden.")).not.toBeNull();
    });

    const select = screen.getByLabelText<HTMLSelectElement>("Aufbautyp");
    expect(select.disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  test("disables select when payload is malformed", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ invalid: true })
      } as Response) as unknown as typeof fetch
    );

    const onChange = jest.fn();
    render(<AufbautypDropdown value="" onChange={onChange} />);

    const select = await screen.findByLabelText<HTMLSelectElement>("Aufbautyp");
    await waitFor(() => {
      expect(select.disabled).toBe(true);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  test("shows empty-state hint and disables select when no options are available", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      } as Response) as unknown as typeof fetch
    );

    const onChange = jest.fn();
    render(<AufbautypDropdown value="" onChange={onChange} />);

    const select = await screen.findByLabelText<HTMLSelectElement>("Aufbautyp");
    await waitFor(() => {
      expect(select.disabled).toBe(true);
      expect(screen.getByRole("option", { name: "Keine Aufbautypen verfügbar" })).not.toBeNull();
      expect(
        screen.getByText("Für diesen Mandanten sind keine Aufbautypen hinterlegt.")
      ).not.toBeNull();
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
