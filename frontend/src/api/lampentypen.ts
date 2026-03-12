import { getAccessToken } from "@/lib/auth";

export type Lampentyp = {
  id: number;
  name: string;
  beschreibung: string;
  icon_url: string;
  standard_preis: number;
  version: number;
  angelegt_am: string;
  aktualisiert_am: string;
};

export type LampentypCreatePayload = {
  name: string;
  beschreibung: string;
  icon_url: string;
  standard_preis: number;
};

export type LampentypUpdatePayload = LampentypCreatePayload & {
  version: number;
};

export class LampentypenApiError extends Error {
  status: number | null;
  detail: string | null;

  constructor(message: string, status: number | null, detail: string | null = null) {
    super(message);
    this.name = "LampentypenApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new LampentypenApiError(
      "Admin-Sitzung fehlt. Bitte erneut anmelden, bevor du Lampentypen verwaltest.",
      401,
      "Authentifizierung erforderlich"
    );
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`
  };
}

async function parseApiError(response: Response, fallbackMessage: string) {
  let detail: string | null = null;

  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "detail" in data && typeof data.detail === "string") {
      detail = data.detail;
    }
  } catch {
    detail = null;
  }

  if (response.status === 401) {
    return new LampentypenApiError(
      "Admin-Sitzung ist abgelaufen oder ungueltig. Bitte erneut anmelden und dann neu laden.",
      response.status,
      detail
    );
  }

  if (response.status === 403) {
    return new LampentypenApiError(
      "Keine Berechtigung fuer Lampentypen. Der Bereich ist nur fuer Admins freigegeben.",
      response.status,
      detail
    );
  }

  if (response.status === 404) {
    return new LampentypenApiError(
      "Der ausgewaehlte Lampentyp existiert nicht mehr. Bitte die Liste neu laden.",
      response.status,
      detail
    );
  }

  if (response.status === 409) {
    if (detail === "Lampentyp wurde zwischenzeitlich geaendert") {
      return new LampentypenApiError(
        "Der Lampentyp wurde zwischenzeitlich geaendert. Bitte Liste neu laden und Aenderung erneut pruefen.",
        response.status,
        detail
      );
    }

    return new LampentypenApiError(
      detail ?? "Der Lampentyp konnte wegen eines Konflikts nicht gespeichert werden.",
      response.status,
      detail
    );
  }

  if (response.status >= 400 && response.status < 500) {
    return new LampentypenApiError(detail ?? fallbackMessage, response.status, detail);
  }

  return new LampentypenApiError(
    "Der Server konnte die Anfrage gerade nicht verarbeiten. Bitte erneut versuchen.",
    response.status,
    detail
  );
}

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit, fallbackMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    throw new LampentypenApiError(
      "Die Lampentypen-API ist momentan nicht erreichbar. Bitte Verbindung pruefen und erneut versuchen.",
      null,
      null
    );
  }

  if (!response.ok) {
    throw await parseApiError(response, fallbackMessage);
  }

  return (await response.json()) as T;
}

export async function listLampentypen(signal?: AbortSignal): Promise<Lampentyp[]> {
  return requestJson<Lampentyp[]>(
    "/api/v1/lampen-typen",
    {
      method: "GET",
      headers: getAuthHeaders(),
      signal
    },
    "Lampentypen konnten nicht geladen werden."
  );
}

export async function createLampentyp(payload: LampentypCreatePayload): Promise<Lampentyp> {
  return requestJson<Lampentyp>(
    "/api/v1/lampen-typen",
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Lampentyp konnte nicht angelegt werden."
  );
}

export async function updateLampentyp(lampentypId: number, payload: LampentypUpdatePayload): Promise<Lampentyp> {
  return requestJson<Lampentyp>(
    `/api/v1/lampen-typen/${lampentypId}`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Lampentyp konnte nicht aktualisiert werden."
  );
}

export async function deleteLampentyp(lampentypId: number, version: number): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`/api/v1/lampen-typen/${lampentypId}?version=${version}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
  } catch {
    throw new LampentypenApiError(
      "Die Lampentypen-API ist momentan nicht erreichbar. Bitte Verbindung pruefen und erneut versuchen.",
      null,
      null
    );
  }

  if (!response.ok) {
    throw await parseApiError(response, "Lampentyp konnte nicht geloescht werden.");
  }
}
