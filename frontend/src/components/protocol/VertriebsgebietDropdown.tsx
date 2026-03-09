import { useEffect, useMemo, useState } from 'react';

import { listVertriebsgebiete } from '@/api/stammdaten';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

type VertriebsgebietDropdownProps = {
  value: string;
  onChange: (value: string) => void;
};

export function VertriebsgebietDropdown({ value, onChange }: VertriebsgebietDropdownProps) {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const load = async () => {
      try {
        const data = await listVertriebsgebiete(abortController.signal);
        setItems(data);
        setError(null);
      } catch {
        if (!abortController.signal.aborted) {
          setError('Vertriebsgebiete konnten nicht geladen werden.');
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

  const options = useMemo(() => items, [items]);
  const hasNoOptions = !isLoading && error == null && options.length === 0;

  const placeholderText = isLoading
    ? 'Lade Vertriebsgebiete...'
    : error
      ? 'Fehler beim Laden'
      : hasNoOptions
        ? 'Keine Vertriebsgebiete verfügbar'
        : 'Bitte Vertriebsgebiet auswählen';

  return (
    <div className='space-y-2'>
      <Label htmlFor='vertriebsgebiet'>Vertriebsgebiet</Label>
      <Select
        id='vertriebsgebiet'
        name='vertriebsgebiet'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isLoading || error != null || hasNoOptions}
        required
      >
        <option value='' disabled={!isLoading && error == null}>
          {placeholderText}
        </option>
        {options.map((entry) => (
          <option key={entry} value={entry}>
            {entry}
          </option>
        ))}
      </Select>
      {error != null && <p className='text-xs text-red-600'>{error}</p>}
      {hasNoOptions && (
        <p className='text-xs text-slate-500'>
          Für diesen Mandanten sind keine Vertriebsgebiete hinterlegt.
        </p>
      )}
    </div>
  );
}
