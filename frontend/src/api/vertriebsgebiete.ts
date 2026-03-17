import { getAccessToken } from "@/lib/auth";

export type Vertriebsgebiet = {
  id: number;
  name: string;
  version: number;
  angelegt_am: string;
  aktualisiert_am: string;
};

export type VertriebsgebietCreatePayload = {
  name: string;
};

export type VertriebsgebietUpdatePayload = VertriebsgebietCreatePayload & {
  version: number;
};

export class VertriebsgebieteApiError extends Error {
  status: number | null;
  detail: string | null;

  constructor(message: string, status: number | null, detail: string | null = null) {
    super(message);
    this.name = "VertriebsgebieteApiError";
    this.status = status;
    this.detail = detail;
  }
}

const FIELD_LABELS: Record<string, string> = {
  name: "Name",
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

function getAuthHeaders() {
  const token = getAccessToken();
  if (!token) {
    throw new VertriebsgebieteApiError(
      "Admin-Sitzung fehlt. Bitte erneut anmelden.",
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
    if (data && typeof data === "object" && "detail" in data) {
      detail = formatApiDetail((data as { detail: unknown }).detail);
    }
  } catch {
    detail = null;
  }

  if (response.status === 401) {
    return new VertriebsgebieteApiError(
      "Admin-Sitzung ist abgelaufen oder ungueltig. Bitte erneut anmelden.",
      response.status,
      detail
    );
  }
  if (response.status === 403) {
    return new VertriebsgebieteApiError(
      "Keine Berechtigung. Der Bereich ist nur fuer Admins freigegeben.",
      response.status,
      detail
    );
  }
  if (response.status === 404) {
    return new VertriebsgebieteApiError(
      "Das Vertriebsgebiet existiert nicht mehr. Bitte die Liste neu laden.",
      response.status,
      detail
    );
  }
  if (response.status === 409) {
    if (detail === "Vertriebsgebiet wurde zwischenzeitlich geaendert") {
      return new VertriebsgebieteApiError(
        "Das Vertriebsgebiet wurde zwischenzeitlich geaendert. Bitte Liste neu laden.",
        response.status,
        detail
      );
    }
    return new VertriebsgebieteApiError(
      detail ?? "Konflikt beim Speichern.",
      response.status,
      detail
    );
  }
  if (response.status >= 400 && response.status < 500) {
    return new VertriebsgebieteApiError(detail ?? fallbackMessage, response.status, detail);
  }
  return new VertriebsgebieteApiError(
    "Der Server konnte die Anfrage nicht verarbeiten. Bitte erneut versuchen.",
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
    response = await fetch(input, init);
  } catch {
    throw new VertriebsgebieteApiError(
      "Die API ist momentan nicht erreichbar. Bitte Verbindung pruefen.",
      null,
      null
    );
  }
  if (!response.ok) {
    throw await parseApiError(response, fallbackMessage);
  }
  return (await response.json()) as T;
}

export async function listVertriebsgebiete(signal?: AbortSignal): Promise<Vertriebsgebiet[]> {
  return requestJson<Vertriebsgebiet[]>(
    "/api/v1/vertriebsgebiete",
    {
      method: "GET",
      headers: getAuthHeaders(),
      signal
    },
    "Vertriebsgebiete konnten nicht geladen werden."
  );
}

export async function createVertriebsgebiet(payload: VertriebsgebietCreatePayload): Promise<Vertriebsgebiet> {
  return requestJson<Vertriebsgebiet>(
    "/api/v1/vertriebsgebiete",
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Vertriebsgebiet konnte nicht angelegt werden."
  );
}

export async function updateVertriebsgebiet(gebietId: number, payload: VertriebsgebietUpdatePayload): Promise<Vertriebsgebiet> {
  return requestJson<Vertriebsgebiet>(
    `/api/v1/vertriebsgebiete/${gebietId}`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    },
    "Vertriebsgebiet konnte nicht aktualisiert werden."
  );
}

export async function deleteVertriebsgebiet(gebietId: number, version: number): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`/api/v1/vertriebsgebiete/${gebietId}?version=${version}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
  } catch {
    throw new VertriebsgebieteApiError(
      "Die API ist momentan nicht erreichbar. Bitte Verbindung pruefen.",
      null,
      null
    );
  }
  if (!response.ok) {
    throw await parseApiError(response, "Vertriebsgebiet konnte nicht geloescht werden.");
  }
}