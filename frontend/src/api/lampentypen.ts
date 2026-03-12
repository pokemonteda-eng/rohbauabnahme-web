import { AuthSessionError, fetchWithAuth } from "@/lib/auth";

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

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  beschreibung: "Beschreibung",
  icon_url: "Icon-URL",
  standard_preis: "Standard-Preis",
  version: "Version"
};

type ValidationErrorDetail = {
  loc?: unknown;
  msg?: unknown;
};

function isFieldLabelKey(value: string): value is keyof typeof FIELD_LABELS {
  return value in FIELD_LABELS;
}

function isValidationErrorDetail(value: unknown): value is ValidationErrorDetail {
  return typeof value === "object" && value !== null;
}

async function parseApiError(response: Response, fallbackMessage: string) {
  let detail: string | null = null;

  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "detail" in data) {
      detail = formatApiDetail((data as { detail: unknown }).detail);
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

function formatApiDetail(detail: unknown): string | null {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((entry) => (isValidationErrorDetail(entry) ? formatValidationDetail(entry) : null))
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return null;
}

function formatValidationDetail(entry: ValidationErrorDetail): string | null {
  if (typeof entry?.msg !== "string") {
    return null;
  }

  let location: keyof typeof FIELD_LABELS | null = null;

  if (Array.isArray(entry.loc)) {
    for (const segment of entry.loc) {
      if (typeof segment === "string" && isFieldLabelKey(segment)) {
        location = segment;
      }
    }
  }

  if (!location) {
    return entry.msg;
  }

  return `${FIELD_LABELS[location]}: ${entry.msg}`;
}

async function requestJson<T>(input: RequestInfo | URL, init: RequestInit, fallbackMessage: string): Promise<T> {
  let response: Response;

  try {
    response = await fetchWithAuth(input, init);
  } catch (error) {
    if (error instanceof AuthSessionError) {
      throw new LampentypenApiError(error.message, error.status, error.detail);
    }

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
    response = await fetchWithAuth(`/api/v1/lampen-typen/${lampentypId}?version=${version}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof AuthSessionError) {
      throw new LampentypenApiError(error.message, error.status, error.detail);
    }

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
