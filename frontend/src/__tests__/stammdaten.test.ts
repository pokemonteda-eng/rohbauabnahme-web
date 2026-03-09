import { listAufbautypen } from "@/api/stammdaten";

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
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(["FB", "FZB"])
      } as Response) as unknown as typeof fetch
    );

    await expect(listAufbautypen()).resolves.toEqual(["FB", "FZB"]);
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
