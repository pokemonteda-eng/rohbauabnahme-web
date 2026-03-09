import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { KundenAutocomplete } from "@/components/protocol/KundenAutocomplete";

const kundenApiResponse = [
  {
    id: 1,
    kunden_nr: "K-1000",
    name: "Muster Bau GmbH",
    adresse: "Hauptstr. 1, 10115 Berlin",
    angelegt_am: "2026-03-07T10:00:00Z"
  },
  {
    id: 2,
    kunden_nr: "K-2000",
    name: "Rohbau AG",
    adresse: "Marktplatz 2, 80331 München",
    angelegt_am: "2026-03-07T11:00:00Z"
  }
];

describe("KundenAutocomplete", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  const mockFetchSuccess = () =>
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(kundenApiResponse)
      } as Response) as unknown as typeof fetch
    );

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
      return;
    }
    setMockFetch(originalFetch);
  });

  test("loads kunden from API and allows selecting a suggestion", async () => {
    mockFetchSuccess();

    const handleChange = jest.fn();
    const handleSelect = jest.fn();

    render(<KundenAutocomplete value="Muster" onChange={handleChange} onSelectKunde={handleSelect} />);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/v1/kunden",
      expect.objectContaining({
        method: "GET",
        headers: { Accept: "application/json" }
      })
    );

    fireEvent.focus(screen.getByLabelText("Kunde"));

    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();
    fireEvent.click(screen.getByRole("option", { name: /Muster Bau GmbH/i }));

    expect(handleChange).toHaveBeenCalledWith("K-1000 - Muster Bau GmbH");
    expect(handleSelect).toHaveBeenCalledWith(kundenApiResponse[0]);
  });

  test("shows API error state when request fails", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 500
      } as Response) as unknown as typeof fetch
    );

    render(<KundenAutocomplete value="" onChange={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));

    await waitFor(() => {
      expect(screen.getByText("Kundenliste konnte nicht geladen werden.")).not.toBeNull();
    });
  });

  test("closes dropdown on outside click and keeps it open on inside click", async () => {
    mockFetchSuccess();

    render(<KundenAutocomplete value="Muster" onChange={jest.fn()} />);

    fireEvent.focus(screen.getByLabelText("Kunde"));
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.mouseDown(screen.getByRole("option", { name: /Muster Bau GmbH/i }));
    expect(screen.getByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByText("Muster Bau GmbH")).toBeNull();
    });
  });

  test("shows empty-state when no customer matches", async () => {
    mockFetchSuccess();

    render(<KundenAutocomplete value="Unbekannt" onChange={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));

    expect(await screen.findByText("Keine Kunden gefunden.")).not.toBeNull();
  });

  test("matches umlauts and diacritics in query and customer fields", async () => {
    mockFetchSuccess();

    render(<KundenAutocomplete value="Munchen" onChange={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));

    expect(await screen.findByRole("option", { name: /Rohbau AG/i })).not.toBeNull();
  });

  test("shows loading state while API is pending", async () => {
    let resolveFetch: ((value: Response) => void) | null = null;
    setMockFetch(
      jest.fn().mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            resolveFetch = resolve;
          })
      ) as unknown as typeof fetch
    );

    render(<KundenAutocomplete value="" onChange={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));
    expect(screen.getByText("Lade Kunden...")).not.toBeNull();

    resolveFetch?.({
      ok: true,
      json: () => Promise.resolve(kundenApiResponse)
    } as Response);

    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();
  });

  test("supports selecting a customer without onSelect callback", async () => {
    mockFetchSuccess();

    const handleChange = jest.fn();

    render(<KundenAutocomplete value="Muster" onChange={handleChange} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.click(screen.getByRole("option", { name: /Muster Bau GmbH/i }));

    expect(handleChange).toHaveBeenCalledWith("K-1000 - Muster Bau GmbH");
    await waitFor(() => {
      expect(screen.queryByText("Muster Bau GmbH")).toBeNull();
    });
  });

  test("keeps selected customer discoverable after refocus without editing", async () => {
    mockFetchSuccess();

    const Wrapper = () => {
      const [value, setValue] = React.useState("");
      return (
        <div>
          <KundenAutocomplete value={value} onChange={setValue} />
          <button type="button">Outside</button>
        </div>
      );
    };

    render(<Wrapper />);

    const input = screen.getByLabelText("Kunde");
    fireEvent.focus(input);
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.click(screen.getByRole("option", { name: /Muster Bau GmbH/i }));
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("K-1000 - Muster Bau GmbH");
      expect(input.getAttribute("aria-expanded")).toBe("false");
    });

    const outsideButton = screen.getByRole("button", { name: "Outside" });
    fireEvent.focus(outsideButton);
    fireEvent.focus(input);

    expect(await screen.findByRole("option", { name: /Muster Bau GmbH/i })).not.toBeNull();
  });

  test("supports keyboard navigation and enter selection", async () => {
    mockFetchSuccess();

    const handleChange = jest.fn();
    render(<KundenAutocomplete value="" onChange={handleChange} />);

    const input = screen.getByLabelText("Kunde");
    fireEvent.focus(input);
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith("K-2000 - Rohbau AG");
  });

  test("closes dropdown on escape", async () => {
    mockFetchSuccess();

    render(<KundenAutocomplete value="" onChange={jest.fn()} />);

    const input = screen.getByLabelText("Kunde");
    fireEvent.focus(input);
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByText("Muster Bau GmbH")).toBeNull();
    });
  });

  test("opens on arrow keys when closed and updates active option via hover/up navigation", async () => {
    mockFetchSuccess();

    render(<KundenAutocomplete value="" onChange={jest.fn()} />);

    const input = screen.getByLabelText("Kunde");
    fireEvent.focus(input);
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Muster Bau GmbH")).toBeNull();
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();

    const firstOption = screen.getByRole("option", { name: /Muster Bau GmbH/i });
    const secondOption = screen.getByRole("option", { name: /Rohbau AG/i });

    fireEvent.mouseEnter(secondOption);
    expect(secondOption.getAttribute("aria-selected")).toBe("true");
    expect(firstOption.getAttribute("aria-selected")).toBe("false");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(firstOption.getAttribute("aria-selected")).toBe("true");
    expect(secondOption.getAttribute("aria-selected")).toBe("false");
  });

  test("closes dropdown when tabbing focus outside the autocomplete", async () => {
    mockFetchSuccess();

    render(
      <div>
        <KundenAutocomplete value="" onChange={jest.fn()} />
        <button type="button">Outside</button>
      </div>
    );

    const input = screen.getByLabelText("Kunde");
    fireEvent.focus(input);
    expect(await screen.findByText("Muster Bau GmbH")).not.toBeNull();
    expect(input.getAttribute("aria-expanded")).toBe("true");

    const outsideButton = screen.getByRole("button", { name: "Outside" });
    fireEvent.blur(input, { relatedTarget: outsideButton });
    fireEvent.focus(outsideButton);

    await waitFor(() => {
      expect(input.getAttribute("aria-expanded")).toBe("false");
      expect(screen.queryByText("Muster Bau GmbH")).toBeNull();
    });
  });
});
