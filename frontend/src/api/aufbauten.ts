export type Aufbau = {
  id: number;
  name: string;
  bild_pfad: string;
  bild_url: string;
  aktiv: boolean;
  angelegt_am: string;
  aktualisiert_am: string;
};

type AufbauPayload = {
  name: string;
  aktiv: boolean;
  bild?: File | null;
};

function isAufbau(value: unknown): value is Aufbau {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.bild_pfad === "string" &&
    typeof candidate.bild_url === "string" &&
    typeof candidate.aktiv === "boolean" &&
    typeof candidate.angelegt_am === "string" &&
    typeof candidate.aktualisiert_am === "string"
  );
}

function buildFormData(payload: AufbauPayload) {
  const formData = new FormData();
  formData.set("name", payload.name);
  formData.set("aktiv", String(payload.aktiv));

  if (payload.bild != null) {
    formData.set("bild", payload.bild);
  }

  return formData;
}

async function parseAufbauResponse(response: Response): Promise<Aufbau> {
  const data: unknown = await response.json();
  if (!isAufbau(data)) {
    throw new Error("Die Serverantwort fuer Aufbauten ist ungueltig.");
  }

  return data;
}

async function parseAufbautenResponse(response: Response): Promise<Aufbau[]> {
  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isAufbau)) {
    throw new Error("Die Serverantwort fuer Aufbauten ist ungueltig.");
  }

  return data;
}

function getErrorMessage(entity: string, status: number) {
  return `${entity} fehlgeschlagen (${status}).`;
}

async function getResponseError(response: Response, entity: string): Promise<Error> {
  try {
    const data: unknown = await response.json();
    if (
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
    ) {
      return new Error((data as { detail: string }).detail);
    }
  } catch {
    // Ignore invalid JSON and fall back to a generic message.
  }

  return new Error(getErrorMessage(entity, response.status));
}

export async function listAufbauten(signal?: AbortSignal): Promise<Aufbau[]> {
  const response = await fetch("/api/v1/aufbauten", {
    method: "GET",
    headers: { Accept: "application/json" },
    signal
  });

  if (!response.ok) {
    throw new Error(getErrorMessage("Aufbauten laden", response.status));
  }

  return parseAufbautenResponse(response);
}

export async function createAufbau(payload: AufbauPayload): Promise<Aufbau> {
  const response = await fetch("/api/v1/aufbauten", {
    method: "POST",
    body: buildFormData(payload)
  });

  if (!response.ok) {
    throw await getResponseError(response, "Aufbau anlegen");
  }

  return parseAufbauResponse(response);
}

export async function updateAufbau(id: number, payload: AufbauPayload): Promise<Aufbau> {
  const response = await fetch(`/api/v1/aufbauten/${id}`, {
    method: "PATCH",
    body: buildFormData(payload)
  });

  if (!response.ok) {
    throw await getResponseError(response, "Aufbau aktualisieren");
  }

  return parseAufbauResponse(response);
}

export async function deleteAufbau(id: number): Promise<void> {
  const response = await fetch(`/api/v1/aufbauten/${id}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    throw await getResponseError(response, "Aufbau loeschen");
  }
}
