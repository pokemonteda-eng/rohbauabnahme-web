import { listAufbautypen, listProjektleiter, listVertriebsgebiete } from "@/api/stammdaten";

describe("listAufbautypen", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  afterEach(() => {
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("returns array values for valid payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["FB", "FZB"])
      } as Response);
    setMockFetch(fetchMock as unknown as typeof fetch);

    await expect(listAufbautypen()).resolves.toEqual(["FB", "FZB"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/master-data/aufbautypen",
      expect.objectContaining({ method: "GET" })
    );
  });

  test("throws for non-ok responses", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({})
      } as Response) as unknown as typeof fetch
    );

    await expect(listAufbautypen()).rejects.toThrow(
      "Aufbautypen konnten nicht geladen werden (503)."
    );
  });

  test("returns empty array for malformed payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ foo: "bar" })
      } as Response) as unknown as typeof fetch
    );

    await expect(listAufbautypen()).resolves.toEqual([]);
  });

  test("filters non-string entries from valid array payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([" FB ", 12, null, "FZB", "FB", ""])
      } as Response) as unknown as typeof fetch
    );

    await expect(listAufbautypen()).resolves.toEqual(["FB", "FZB"]);
  });
});

describe("listVertriebsgebiete", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  afterEach(() => {
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("returns array values for valid payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["Nord", "Sued"])
      } as Response);
    setMockFetch(fetchMock as unknown as typeof fetch);

    await expect(listVertriebsgebiete()).resolves.toEqual(["Nord", "Sued"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/master-data/vertriebsgebiete",
      expect.objectContaining({ method: "GET" })
    );
  });

  test("throws for non-ok responses", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({})
      } as Response) as unknown as typeof fetch
    );

    await expect(listVertriebsgebiete()).rejects.toThrow(
      "Vertriebsgebiete konnten nicht geladen werden (503)."
    );
  });

  test("returns empty array for malformed payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ foo: "bar" })
      } as Response) as unknown as typeof fetch
    );

    await expect(listVertriebsgebiete()).resolves.toEqual([]);
  });

  test("filters non-string entries from valid array payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([" Nord ", 12, null, "Sued", "Nord", ""])
      } as Response) as unknown as typeof fetch
    );

    await expect(listVertriebsgebiete()).resolves.toEqual(["Nord", "Sued"]);
  });
});

describe("listProjektleiter", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  afterEach(() => {
    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("returns array values for valid payload", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["Max Mustermann", "Erika Musterfrau"])
      } as Response);
    setMockFetch(fetchMock as unknown as typeof fetch);

    await expect(listProjektleiter()).resolves.toEqual(["Max Mustermann", "Erika Musterfrau"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/master-data/projektleiter",
      expect.objectContaining({ method: "GET" })
    );
  });

  test("throws for non-ok responses", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: () => Promise.resolve({})
      } as Response) as unknown as typeof fetch
    );

    await expect(listProjektleiter()).rejects.toThrow(
      "Projektleiter konnten nicht geladen werden (503)."
    );
  });

  test("returns empty array for malformed payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ foo: "bar" })
      } as Response) as unknown as typeof fetch
    );

    await expect(listProjektleiter()).resolves.toEqual([]);
  });

  test("filters non-string entries from valid array payload", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([" Max Mustermann ", 12, null, "Erika Musterfrau", "Max Mustermann", ""])
      } as Response) as unknown as typeof fetch
    );

    await expect(listProjektleiter()).resolves.toEqual(["Max Mustermann", "Erika Musterfrau"]);
  });
});
