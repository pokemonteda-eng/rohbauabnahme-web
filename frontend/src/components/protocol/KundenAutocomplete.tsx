import { useEffect, useMemo, useRef, useState } from "react";

import { listKunden, type Kunde } from "@/api/kunden";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type KundenAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  onSelectKunde?: (kunde: Kunde) => void;
};

const MAX_RESULTS = 8;

export function KundenAutocomplete({ value, onChange, onSelectKunde }: KundenAutocompleteProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [kunden, setKunden] = useState<Kunde[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchKunden = async () => {
      try {
        const data = await listKunden(abortController.signal);
        setKunden(data);
        setError(null);
      } catch {
        if (!abortController.signal.aborted) {
          setError("Kundenliste konnte nicht geladen werden.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchKunden();

    return () => {
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (rootRef.current != null && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const normalizedQuery = value.trim().toLowerCase();

  const filteredKunden = useMemo(() => {
    if (normalizedQuery.length === 0) {
      return kunden.slice(0, MAX_RESULTS);
    }

    return kunden
      .filter((kunde) => {
        const searchableText = `${kunde.kunden_nr} ${kunde.name} ${kunde.adresse}`.toLowerCase();
        return searchableText.includes(normalizedQuery);
      })
      .slice(0, MAX_RESULTS);
  }, [kunden, normalizedQuery]);

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label htmlFor="kunde-suche">Kunde</Label>
      <div className="relative">
        <Input
          id="kunde-suche"
          name="kundeSuche"
          type="text"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Kunde suchen (Name, Nr., Adresse)"
          autoComplete="off"
        />
        {isOpen && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
            {isLoading && <p className="px-3 py-2 text-sm text-slate-500">Lade Kunden...</p>}
            {!isLoading && error != null && <p className="px-3 py-2 text-sm text-red-600">{error}</p>}
            {!isLoading && error == null && (
              <ul className="max-h-64 overflow-auto py-1">
                {filteredKunden.map((kunde) => (
                  <li key={kunde.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
                      onClick={() => {
                        onChange(`${kunde.kunden_nr} - ${kunde.name}`);
                        onSelectKunde?.(kunde);
                        setIsOpen(false);
                      }}
                    >
                      <p className="text-sm font-medium text-slate-900">{kunde.name}</p>
                      <p className="text-xs text-slate-500">{kunde.kunden_nr}</p>
                    </button>
                  </li>
                ))}
                {filteredKunden.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Keine Kunden gefunden.</li>}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
