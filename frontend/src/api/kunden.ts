export type Kunde = {
  id: number;
  kunden_nr: string;
  name: string;
  adresse: string;
  angelegt_am: string;
};

export async function listKunden(signal?: AbortSignal): Promise<Kunde[]> {
  const response = await fetch("/api/v1/kunden", {
    method: "GET",
    headers: {
      Accept: "application/json"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Kunden konnten nicht geladen werden (${response.status}).`);
  }

  return (await response.json()) as Kunde[];
}
