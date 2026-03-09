import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LackierungOptionProps = {
  id: string;
  label: string;
  checked: boolean;
  bemerkung: string;
  onCheckedChange: (checked: boolean) => void;
  onBemerkungChange: (bemerkung: string) => void;
};

type LackierungSectionProps = {
  klarlackschicht: boolean;
  klarlackschichtBemerkung: string;
  zinkstaub: boolean;
  zinkstaubBemerkung: string;
  eKolben: boolean;
  eKolbenBemerkung: string;
  onKlarlackschichtChange: (checked: boolean) => void;
  onKlarlackschichtBemerkungChange: (bemerkung: string) => void;
  onZinkstaubChange: (checked: boolean) => void;
  onZinkstaubBemerkungChange: (bemerkung: string) => void;
  onEKolbenChange: (checked: boolean) => void;
  onEKolbenBemerkungChange: (bemerkung: string) => void;
};

function LackierungOption({
  id,
  label,
  checked,
  bemerkung,
  onCheckedChange,
  onBemerkungChange
}: LackierungOptionProps) {
  const bemerkungInputId = `${id}-bemerkung`;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-3">
        <Input
          id={id}
          name={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      {checked ? (
        <div className="space-y-1.5">
          <Label htmlFor={bemerkungInputId}>Bemerkung {label}</Label>
          <Input
            id={bemerkungInputId}
            name={bemerkungInputId}
            type="text"
            placeholder="Bemerkung erfassen"
            value={bemerkung}
            onChange={(event) => onBemerkungChange(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}

export function LackierungSection({
  klarlackschicht,
  klarlackschichtBemerkung,
  zinkstaub,
  zinkstaubBemerkung,
  eKolben,
  eKolbenBemerkung,
  onKlarlackschichtChange,
  onKlarlackschichtBemerkungChange,
  onZinkstaubChange,
  onZinkstaubBemerkungChange,
  onEKolbenChange,
  onEKolbenBemerkungChange
}: LackierungSectionProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">Lackierung</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LackierungOption
          id="klarlackschicht"
          label="Klarlackschicht"
          checked={klarlackschicht}
          bemerkung={klarlackschichtBemerkung}
          onCheckedChange={onKlarlackschichtChange}
          onBemerkungChange={onKlarlackschichtBemerkungChange}
        />
        <LackierungOption
          id="zinkstaub"
          label="Zinkstaub"
          checked={zinkstaub}
          bemerkung={zinkstaubBemerkung}
          onCheckedChange={onZinkstaubChange}
          onBemerkungChange={onZinkstaubBemerkungChange}
        />
        <LackierungOption
          id="e-kolben"
          label="E-Kolben"
          checked={eKolben}
          bemerkung={eKolbenBemerkung}
          onCheckedChange={onEKolbenChange}
          onBemerkungChange={onEKolbenBemerkungChange}
        />
      </div>
    </section>
  );
}
