import { Button } from "@/components/ui/button";

type TechnAenderungSectionProps = {
  kabelFunklayoutGeaendert: boolean | null;
  onKabelFunklayoutGeaendertChange: (value: boolean) => void;
};

export function TechnAenderungSection({
  kabelFunklayoutGeaendert,
  onKabelFunklayoutGeaendertChange
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
    </section>
  );
}
