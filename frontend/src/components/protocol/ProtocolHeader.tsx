import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProtocolHeaderProps = {
  orderNumber: string;
  protocolDate: string;
  onOrderNumberChange: (value: string) => void;
  onProtocolDateChange: (value: string) => void;
};

export function ProtocolHeader({
  orderNumber,
  protocolDate,
  onOrderNumberChange,
  onProtocolDateChange
}: ProtocolHeaderProps) {
  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
