import { formatEuro, RAHMEN_PRICE_OPTIONS } from "@/lib/zubehoerPricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type RahmenSelectionState = {
  rahmen: boolean;
};

type ZubehoerRahmenSectionProps = {
  values: RahmenSelectionState;
  onValueChange: (checked: boolean) => void;
};

export function ZubehoerRahmenSection({ values, onValueChange }: ZubehoerRahmenSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Zubehör</h2>
      <p className="mt-1 text-sm text-slate-600">Kategorie: Rahmen</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-slate-200 p-3">
          <div className="flex items-center gap-2">
            <Input
              id="rahmen-rahmen"
              name="rahmen-rahmen"
              type="checkbox"
              checked={values.rahmen}
              onChange={(event) => onValueChange(event.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="rahmen-rahmen">Rahmen</Label>
          </div>
          <p className="mt-2 text-xs font-medium text-slate-500">{formatEuro(RAHMEN_PRICE_OPTIONS[0].price)}</p>
        </div>
      </div>
    </section>
  );
}
