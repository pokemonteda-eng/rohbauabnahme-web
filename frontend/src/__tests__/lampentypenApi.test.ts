import { logout, persistAuthSession } from "@/lib/auth";
import { createLampentyp, LampentypenApiError } from "@/api/lampentypen";

describe("lampentypen api", () => {
  const originalFetch = global.fetch;

  const setMockFetch = (mock: typeof fetch) => {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: mock
    });
  };

  beforeEach(() => {
    window.localStorage.clear();
    persistAuthSession({
      username: "admin",
      role: "admin",
      accessToken: "test-admin-token",
      refreshToken: "test-refresh-token",
      tokenType: "bearer",
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  });

  afterEach(() => {
    logout();

    if (originalFetch == null) {
      delete (global as { fetch?: typeof fetch }).fetch;
    } else {
      setMockFetch(originalFetch);
    }
  });

  test("returns backend conflict details unchanged", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ detail: "Lampentyp mit diesem Namen existiert bereits" })
      } as Response) as unknown as typeof fetch
    );

    await expect(
      createLampentyp({
        name: "Heckblitzer",
        beschreibung: "Kompakter LED-Blitzer fuer das Heck.",
        icon_url: "https://cdn.example.com/icons/heckblitzer.png",
        standard_preis: 149.9
      })
    ).rejects.toMatchObject<LampentypenApiError>({
      message: "Lampentyp mit diesem Namen existiert bereits",
      status: 409,
      detail: "Lampentyp mit diesem Namen existiert bereits"
    });
  });

  test("formats structured validation details from FastAPI responses", async () => {
    setMockFetch(
      jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            detail: [
              {
                loc: ["body", "name"],
                msg: "String should have at most 255 characters"
              },
              {
                loc: ["body", "standard_preis"],
                msg: "Input should be greater than or equal to 0"
              }
            ]
          })
      } as Response) as unknown as typeof fetch
    );

    await expect(
      createLampentyp({
        name: "X".repeat(256),
        beschreibung: "Kompakter LED-Blitzer fuer das Heck.",
        icon_url: "https://cdn.example.com/icons/heckblitzer.png",
        standard_preis: -1
      })
    ).rejects.toMatchObject<LampentypenApiError>({
      message:
        "Name: String should have at most 255 characters Standard-Preis: Input should be greater than or equal to 0",
      status: 422,
      detail:
        "Name: String should have at most 255 characters Standard-Preis: Input should be greater than or equal to 0"
    });
  });

  test("fails early when the admin token is missing", async () => {
    logout();

    await expect(
      createLampentyp({
        name: "Frontblitzer",
        beschreibung: "Schmale Frontwarnleuchte.",
        icon_url: "https://cdn.example.com/icons/frontblitzer.png",
        standard_preis: 88.5
      })
    ).rejects.toMatchObject<LampentypenApiError>({
      message: "Admin-Sitzung fehlt. Bitte erneut anmelden, bevor du Lampentypen verwaltest.",
      status: 401,
      detail: "Authentifizierung erforderlich"
    });
  });
});
