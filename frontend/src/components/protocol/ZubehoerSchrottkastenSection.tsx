import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SchrottkastenSelectionState = {
  schrottkasten: boolean;
};

type ZubehoerSchrottkastenSectionProps = {
  values: SchrottkastenSelectionState;
  onValueChange: (checked: boolean) => void;
};

export function ZubehoerSchrottkastenSection({
  values,
  onValueChange
}: ZubehoerSchrottkastenSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Zubehör</h2>
      <p className="mt-1 text-sm text-slate-600">Kategorie: Schrottkasten</p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2 rounded-md border border-slate-200 p-3">
          <Input
            id="schrottkasten-schrottkasten"
            name="schrottkasten-schrottkasten"
            type="checkbox"
            checked={values.schrottkasten}
            onChange={(event) => onValueChange(event.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="schrottkasten-schrottkasten">Schrottkasten</Label>
        </div>
      </div>
    </section>
  );
}
