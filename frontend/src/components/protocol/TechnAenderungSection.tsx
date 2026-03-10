import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type TechnAenderungSectionProps = {
  kabelFunklayoutGeaendert: boolean | null;
  technischeAenderungen: string;
  onKabelFunklayoutGeaendertChange: (value: boolean) => void;
  onTechnischeAenderungenChange: (value: string) => void;
};

export function TechnAenderungSection({
  kabelFunklayoutGeaendert,
  technischeAenderungen,
  onKabelFunklayoutGeaendertChange,
  onTechnischeAenderungenChange
}: TechnAenderungSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold">Technische Änderungen</h2>
          <p className="mt-1 text-sm text-slate-600">
            Hat sich das Kabel- oder Funklayout geändert?
          </p>
        </div>
        <div
          role="group"
          aria-label="Kabel/Funklayout geändert"
          className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-1"
        >
          <Button
            type="button"
            variant={kabelFunklayoutGeaendert === true ? "default" : "ghost"}
            className="min-w-20"
            aria-pressed={kabelFunklayoutGeaendert === true}
            onClick={() => onKabelFunklayoutGeaendertChange(true)}
          >
            Ja
          </Button>
          <Button
            type="button"
            variant={kabelFunklayoutGeaendert === false ? "default" : "ghost"}
            className="min-w-20"
            aria-pressed={kabelFunklayoutGeaendert === false}
            onClick={() => onKabelFunklayoutGeaendertChange(false)}
          >
            Nein
          </Button>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <Label htmlFor="technische-aenderungen">Technische Änderungen</Label>
        <textarea
          id="technische-aenderungen"
          name="technische-aenderungen"
          rows={5}
          value={technischeAenderungen}
          onChange={(event) => onTechnischeAenderungenChange(event.target.value)}
          className="flex min-h-32 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus-visible:border-slate-950 focus-visible:ring-2 focus-visible:ring-slate-950/15 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Technische Hinweise und Änderungen dokumentieren"
        />
      </div>
    </section>
  );
}
