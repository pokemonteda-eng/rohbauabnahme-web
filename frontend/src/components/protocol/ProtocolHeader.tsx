import { AufbautypDropdown } from "@/components/protocol/AufbautypDropdown";
import { KundenAutocomplete } from "@/components/protocol/KundenAutocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type ProtocolHeaderProps = {
  aufbautyp: string;
  aufbautypen: string[];
  customerQuery: string;
  isLoadingAufbautypen: boolean;
  orderNumber: string;
  protocolDate: string;
  aufbautyp: string;
  aufbautypenError: string | null;
  onAufbautypChange: (value: string) => void;
  onCustomerQueryChange: (value: string) => void;
  onOrderNumberChange: (value: string) => void;
  onProtocolDateChange: (value: string) => void;
  onAufbautypChange: (value: string) => void;
};

export function ProtocolHeader({
  aufbautyp,
  aufbautypen,
  customerQuery,
  isLoadingAufbautypen,
  orderNumber,
  protocolDate,
  aufbautypenError,
  onAufbautypChange,
  onCustomerQueryChange,
  onOrderNumberChange,
  onProtocolDateChange
}: ProtocolHeaderProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <KundenAutocomplete value={customerQuery} onChange={onCustomerQueryChange} />

        <div className="space-y-2">
          <Label htmlFor="aufbautyp">Aufbautyp</Label>
          <Select
            id="aufbautyp"
            name="aufbautyp"
            value={aufbautyp}
            onChange={(event) => onAufbautypChange(event.target.value)}
            required
            disabled={isLoadingAufbautypen || aufbautypenError !== null}
          >
            <option value="" disabled>
              {isLoadingAufbautypen
                ? "Lade Aufbautypen..."
                : aufbautypenError ?? "Aufbautyp wählen"}
            </option>
            {aufbautypen.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-number">Auftrags-Nr.</Label>
          <Input
            id="order-number"
            name="orderNumber"
            type="text"
            value={orderNumber}
            onChange={(event) => onOrderNumberChange(event.target.value)}
            placeholder="z. B. A-2026-015"
            required
          />
        </div>

        <AufbautypDropdown value={aufbautyp} onChange={onAufbautypChange} />

        <div className="space-y-2">
          <Label htmlFor="protocol-date">Protokolldatum</Label>
          <Input
            id="protocol-date"
            name="protocolDate"
            type="date"
            value={protocolDate}
            onChange={(event) => onProtocolDateChange(event.target.value)}
            required
          />
        </div>
      </div>
    </section>
  );
}
