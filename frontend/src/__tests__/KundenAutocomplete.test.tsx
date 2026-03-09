import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
    adresse: "Marktplatz 2, 80331 Muenchen",
    angelegt_am: "2026-03-07T11:00:00Z"
  }
];

describe("KundenAutocomplete", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("loads kunden from API and allows selecting a suggestion", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(kundenApiResponse)
    } as Response);

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
    fireEvent.click(screen.getByRole("button", { name: /Muster Bau GmbH/i }));

    expect(handleChange).toHaveBeenCalledWith("K-1000 - Muster Bau GmbH");
    expect(handleSelect).toHaveBeenCalledWith(kundenApiResponse[0]);
  });

  test("shows API error state when request fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500
    } as Response);

    render(<KundenAutocomplete value="" onChange={jest.fn()} />);
    fireEvent.focus(screen.getByLabelText("Kunde"));

    await waitFor(() => {
      expect(screen.getByText("Kundenliste konnte nicht geladen werden.")).not.toBeNull();
    });
  });
});
