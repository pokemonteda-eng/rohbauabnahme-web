import { useEffect, useState } from 'react';

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

  const hasNoOptions = !isLoading && error == null && items.length === 0;

  const placeholderText = isLoading
    ? 'Lade Aufbautypen...'
    : error
      ? 'Fehler beim Laden'
      : hasNoOptions
        ? 'Keine Aufbautypen verfügbar'
        : 'Bitte Aufbautyp auswählen';

  return (
    <div className='space-y-2'>
      <Label htmlFor='aufbautyp'>Aufbautyp</Label>
      <Select
        id='aufbautyp'
        name='aufbautyp'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || error != null || hasNoOptions}
        required
      >
        <option value='' disabled={!isLoading && error == null}>
          {placeholderText}
        </option>
        {items.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </Select>
      {error != null && <p className='text-xs text-red-600'>{error}</p>}
      {hasNoOptions && (
        <p className='text-xs text-slate-500'>Für diesen Mandanten sind keine Aufbautypen hinterlegt.</p>
      )}
    </div>
  );
}
