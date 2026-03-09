export async function listAufbautypen(signal?: AbortSignal): Promise<string[]> {
  const response = await fetch('/api/v1/stammdaten/aufbautypen', {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Aufbautypen konnten nicht geladen werden (${response.status}).`);
  }

  const data = (await response.json()) as string[];
  return Array.isArray(data) ? data : [];
}
