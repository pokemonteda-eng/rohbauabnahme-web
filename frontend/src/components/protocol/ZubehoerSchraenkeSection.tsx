import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SCHRAENKE_OPTIONS = [
  { id: "oben", label: "Oben" },
  { id: "unten", label: "Unten" },
  { id: "innen", label: "Innen" }
] as const;

export type SchraenkeOptionKey = (typeof SCHRAENKE_OPTIONS)[number]["id"];
export type SchraenkeSelectionState = Record<SchraenkeOptionKey, boolean>;

type ZubehoerSchraenkeSectionProps = {
  values: SchraenkeSelectionState;
  onValueChange: (key: SchraenkeOptionKey, checked: boolean) => void;
};

export function ZubehoerSchraenkeSection({
  values,
  onValueChange
}: ZubehoerSchraenkeSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Zubehör</h2>
      <p className="mt-1 text-sm text-slate-600">Kategorie: Schränke</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SCHRAENKE_OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center gap-2 rounded-md border border-slate-200 p-3">
            <Input
              id={`schraenke-${option.id}`}
              name={`schraenke-${option.id}`}
              type="checkbox"
              checked={values[option.id]}
              onChange={(event) => onValueChange(option.id, event.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor={`schraenke-${option.id}`}>{option.label}</Label>
          </div>
        ))}
      </div>
    </section>
  );
}
