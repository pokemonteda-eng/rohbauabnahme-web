import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AufbautenAdminSection } from "@/components/admin/AufbautenAdminSection";

describe("AufbautenAdminSection", () => {
  const originalFetch = global.fetch;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:preview");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      Object.defineProperty(global, "fetch", {
        configurable: true,
        writable: true,
        value: originalFetch
      });
    }

    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    jest.restoreAllMocks();
  });

  test("loads existing aufbauten and creates a new item with png upload", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              name: "Container",
              bild_pfad: "aufbauten/container.png",
              bild_url: "/uploads/aufbauten/container.png",
              aktiv: true,
              angelegt_am: "2026-03-11T00:00:00Z",
              aktualisiert_am: "2026-03-11T00:00:00Z"
            }
          ])
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 2,
            name: "FB 500",
            bild_pfad: "aufbauten/fb-500.png",
            bild_url: "/uploads/aufbauten/fb-500.png",
            aktiv: true,
            angelegt_am: "2026-03-11T00:00:00Z",
            aktualisiert_am: "2026-03-11T00:00:00Z"
          })
      } as Response);

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<AufbautenAdminSection />);

    await waitFor(() => {
      expect(screen.getByText("Container")).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "FB 500" }
    });

    const file = new File([new Uint8Array([137, 80, 78, 71])], "fb-500.png", {
      type: "image/png"
    });
    fireEvent.change(screen.getByLabelText("PNG-Datei"), {
      target: { files: [file] }
    });

    fireEvent.click(screen.getByRole("button", { name: "Aufbau anlegen" }));

    await waitFor(() => {
      expect(screen.getByText("FB 500")).not.toBeNull();
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/aufbauten",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/aufbauten",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData)
      })
    );
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  test("shows backend validation details instead of a generic status message", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([])
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: "Aufbau mit diesem Namen existiert bereits" })
      } as Response);

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<AufbautenAdminSection />);

    await waitFor(() => {
      expect(screen.getByText(/noch keine aufbauten vorhanden/i)).not.toBeNull();
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Container" }
    });

    const file = new File([new Uint8Array([137, 80, 78, 71])], "container.png", {
      type: "image/png"
    });
    fireEvent.change(screen.getByLabelText("PNG-Datei"), {
      target: { files: [file] }
    });

    fireEvent.click(screen.getByRole("button", { name: "Aufbau anlegen" }));

    await waitFor(() => {
      expect(screen.getByText("Aufbau mit diesem Namen existiert bereits")).not.toBeNull();
    });
  });

  test("rejects non-png selections before submit and keeps the existing preview in edit mode", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 1,
            name: "Container",
            bild_pfad: "aufbauten/container.png",
            bild_url: "/uploads/aufbauten/container.png",
            aktiv: true,
            angelegt_am: "2026-03-11T00:00:00Z",
            aktualisiert_am: "2026-03-11T00:00:00Z"
          }
        ])
    } as Response);

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<AufbautenAdminSection />);

    await waitFor(() => {
      expect(screen.getByText("Container")).not.toBeNull();
    });

    fireEvent.click(screen.getByRole("button", { name: "Bearbeiten" }));

    const previewBefore = screen.getByAltText("PNG-Vorschau");
    expect(previewBefore.getAttribute("src")).toBe("/uploads/aufbauten/container.png");

    const invalidFile = new File(["not-a-png"], "container.jpg", {
      type: "image/jpeg"
    });

    fireEvent.change(screen.getByLabelText("PNG-Datei"), {
      target: { files: [invalidFile] }
    });

    expect(screen.getByText("Bitte eine PNG-Datei auswaehlen.")).not.toBeNull();
    expect(screen.getByAltText("PNG-Vorschau").getAttribute("src")).toBe("/uploads/aufbauten/container.png");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("shows a load error when the aufbauten list response is malformed", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: "Container" }])
    } as Response);

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<AufbautenAdminSection />);

    await waitFor(() => {
      expect(screen.getByText("Die Serverantwort fuer Aufbauten ist ungueltig.")).not.toBeNull();
    });
  });

  test("disables every delete action while one delete request is in flight", async () => {
    let resolveDelete: (() => void) | null = null;
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              name: "Container",
              bild_pfad: "aufbauten/container.png",
              bild_url: "/uploads/aufbauten/container.png",
              aktiv: true,
              angelegt_am: "2026-03-11T00:00:00Z",
              aktualisiert_am: "2026-03-11T00:00:00Z"
            },
            {
              id: 2,
              name: "Pritsche",
              bild_pfad: "aufbauten/pritsche.png",
              bild_url: "/uploads/aufbauten/pritsche.png",
              aktiv: true,
              angelegt_am: "2026-03-11T00:00:00Z",
              aktualisiert_am: "2026-03-11T00:00:00Z"
            }
          ])
      } as Response)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveDelete = () => resolve({ ok: true, json: () => Promise.resolve(null) } as Response);
          })
      );

    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: fetchMock
    });

    render(<AufbautenAdminSection />);

    await waitFor(() => {
      expect(screen.getByText("Container")).not.toBeNull();
      expect(screen.getByText("Pritsche")).not.toBeNull();
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Loeschen" });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Loesche..." }).hasAttribute("disabled")).toBe(true);
    });

    for (const button of screen.getAllByRole("button", { name: /Loesch/ })) {
      expect(button.hasAttribute("disabled")).toBe(true);
    }

    resolveDelete?.();

    await waitFor(() => {
      expect(screen.queryByText("Container")).toBeNull();
    });
  });
});
