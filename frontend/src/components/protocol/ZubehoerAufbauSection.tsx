import {
  AUFBAU_PRICE_OPTIONS as AUFBAU_OPTIONS,
  formatEuro,
  type AufbauOptionKey
} from "@/lib/zubehoerPricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AufbauSelectionState = Record<AufbauOptionKey, boolean>;
export type { AufbauOptionKey };
export { AUFBAU_OPTIONS };

type ZubehoerAufbauSectionProps = {
  values: AufbauSelectionState;
  onValueChange: (key: AufbauOptionKey, checked: boolean) => void;
};

export function ZubehoerAufbauSection({ values, onValueChange }: ZubehoerAufbauSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Zubehör</h2>
      <p className="mt-1 text-sm text-slate-600">Kategorie: Aufbau</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AUFBAU_OPTIONS.map((option) => (
          <div key={option.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex items-center gap-2">
              <Input
                id={`aufbau-${option.id}`}
                name={`aufbau-${option.id}`}
                type="checkbox"
                checked={values[option.id]}
                onChange={(event) => onValueChange(option.id, event.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor={`aufbau-${option.id}`}>{option.label}</Label>
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">{formatEuro(option.price)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
