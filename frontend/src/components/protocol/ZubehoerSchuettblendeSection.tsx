import {
  formatEuro,
  SCHUETTBLENDE_PRICE_OPTIONS,
  type SchuettblendeOptionKey
} from "@/lib/zubehoerPricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SchuettblendeSelectionState = Record<SchuettblendeOptionKey, boolean>;

type ZubehoerSchuettblendeSectionProps = {
  values: SchuettblendeSelectionState;
  onValueChange: (key: SchuettblendeOptionKey, checked: boolean) => void;
};

export function ZubehoerSchuettblendeSection({
  values,
  onValueChange
}: ZubehoerSchuettblendeSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Zubehör</h2>
      <p className="mt-1 text-sm text-slate-600">Kategorie: Schüttblende</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SCHUETTBLENDE_PRICE_OPTIONS.map((option) => (
          <div key={option.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <Input
                id={`schuettblende-${option.id}`}
                name={`schuettblende-${option.id}`}
                type="checkbox"
                aria-label={`Schüttblende ${option.label}`}
                checked={values[option.id]}
                onChange={(event) => onValueChange(option.id, event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor={`schuettblende-${option.id}`}>{option.label}</Label>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{formatEuro(option.price)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
