import { useState } from "react";

import { LackierungSection } from "@/components/protocol/LackierungSection";
import { ProtocolHeader } from "@/components/protocol/ProtocolHeader";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const [customerQuery, setCustomerQuery] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [protocolDate, setProtocolDate] = useState("");
  const [aufbautyp, setAufbautyp] = useState("");
  const [vertriebsgebiet, setVertriebsgebiet] = useState("");
  const [klarlackschicht, setKlarlackschicht] = useState(false);
  const [klarlackschichtBemerkung, setKlarlackschichtBemerkung] = useState("");
  const [zinkstaub, setZinkstaub] = useState(false);
  const [zinkstaubBemerkung, setZinkstaubBemerkung] = useState("");
  const [eKolben, setEKolben] = useState(false);
  const [eKolbenBemerkung, setEKolbenBemerkung] = useState("");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center px-4">
          <p className="text-lg font-semibold">rohbauabnahme-web</p>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <ProtocolHeader
          customerQuery={customerQuery}
          orderNumber={orderNumber}
          protocolDate={protocolDate}
          aufbautyp={aufbautyp}
          vertriebsgebiet={vertriebsgebiet}
          onCustomerQueryChange={setCustomerQuery}
          onOrderNumberChange={setOrderNumber}
          onProtocolDateChange={setProtocolDate}
          onAufbautypChange={setAufbautyp}
          onVertriebsgebietChange={setVertriebsgebiet}
        />
        <LackierungSection
          klarlackschicht={klarlackschicht}
          klarlackschichtBemerkung={klarlackschichtBemerkung}
          zinkstaub={zinkstaub}
          zinkstaubBemerkung={zinkstaubBemerkung}
          eKolben={eKolben}
          eKolbenBemerkung={eKolbenBemerkung}
          onKlarlackschichtChange={setKlarlackschicht}
          onKlarlackschichtBemerkungChange={setKlarlackschichtBemerkung}
          onZinkstaubChange={setZinkstaub}
          onZinkstaubBemerkungChange={setZinkstaubBemerkung}
          onEKolbenChange={setEKolben}
          onEKolbenBemerkungChange={setEKolbenBemerkung}
        />
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight">React Frontend Setup</h1>
          <p className="mt-2 text-slate-600">
            Vite, TypeScript, Tailwind und shadcn/ui Basis sind initialisiert.
          </p>
          <div className="mt-6 flex gap-3">
            <Button>Primary Action</Button>
            <Button variant="outline">Sekundär</Button>
          </div>
        </section>
      </main>
    </div>
  );
}
