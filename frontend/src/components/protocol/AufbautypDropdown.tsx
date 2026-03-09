import { useEffect, useMemo, useState } from 'react';

import { listAufbautypen } from '@/api/stammdaten';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

type AufbautypDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function AufbautypDropdown({ value, onChange }: AufbautypDropdownProps) {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const load = async () => {
      try {
        const data = await listAufbautypen(abortController.signal);
        setItems(data);
        setError(null);
      } catch {
        if (!abortController.signal.aborted) {
          setError('Aufbautypen konnten nicht geladen werden.');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => abortController.abort();
  }, []);

  const options = useMemo(() => items.filter((entry) => entry.trim().length > 0), [items]);

  return (
    <div className='space-y-2'>
      <Label htmlFor='aufbautyp'>Aufbautyp</Label>
      <Select
        id='aufbautyp'
        name='aufbautyp'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || error != null}
        required
      >
        <option value=''>
          {isLoading ? 'Lade Aufbautypen...' : error ? 'Fehler beim Laden' : 'Bitte ausw?hlen'}
        </option>
        {options.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </Select>
      {error != null && <p className='text-xs text-red-600'>{error}</p>}
    </div>
  );
}
