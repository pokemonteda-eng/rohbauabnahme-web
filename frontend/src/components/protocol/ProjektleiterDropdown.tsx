import { useEffect, useState } from "react";

import { listProjektleiter } from "@/api/stammdaten";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProjektleiterDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ProjektleiterDropdown({ value, onChange }: ProjektleiterDropdownProps) {
  const [projektleiter, setProjektleiter] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProjektleiter = async () => {
      try {
        const data = await listProjektleiter(abortController.signal);
        setProjektleiter(data);
        setError(null);
      } catch {
        if (!abortController.signal.aborted) {
          setError("Projektleiter konnten nicht geladen werden.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchProjektleiter();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="projektleiter">Projektleiter</Label>
      <Select
        id="projektleiter"
        name="projektleiter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || error != null}
        required
      >
        <option value="" disabled>
          {isLoading
            ? "Lade Projektleiter..."
            : error != null
              ? "Fehler beim Laden"
              : "Bitte auswählen"}
        </option>
        {projektleiter.map((eintrag) => (
          <option key={eintrag} value={eintrag}>
            {eintrag}
          </option>
        ))}
      </Select>
    </div>
  );
}
