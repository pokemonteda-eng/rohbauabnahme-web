import { AufbautypDropdown } from "@/components/protocol/AufbautypDropdown";
import { KundenAutocomplete } from "@/components/protocol/KundenAutocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProtocolHeaderProps = {
  customerQuery: string;
  orderNumber: string;
  protocolDate: string;
  aufbautyp: string;
  onCustomerQueryChange: (value: string) => void;
  onOrderNumberChange: (value: string) => void;
  onProtocolDateChange: (value: string) => void;
  onAufbautypChange: (value: string) => void;
};

export function ProtocolHeader({
  customerQuery,
  orderNumber,
  protocolDate,
  aufbautyp,
  onCustomerQueryChange,
  onOrderNumberChange,
  onProtocolDateChange,
  onAufbautypChange
}: ProtocolHeaderProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-6">
        <KundenAutocomplete value={customerQuery} onChange={onCustomerQueryChange} />

        <AufbautypDropdown value={aufbautyp} onChange={onAufbautypChange} />

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
