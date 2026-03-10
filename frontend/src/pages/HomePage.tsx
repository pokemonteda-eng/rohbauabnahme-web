import { useState } from "react";

import { LackierungSection } from "@/components/protocol/LackierungSection";
import { ProtocolHeader } from "@/components/protocol/ProtocolHeader";
import {
  type AufbauOptionKey,
  type AufbauSelectionState,
  ZubehoerAufbauSection
} from "@/components/protocol/ZubehoerAufbauSection";
import {
  type RahmenSelectionState,
  ZubehoerRahmenSection
} from "@/components/protocol/ZubehoerRahmenSection";
import {
  type SchuettblendeOptionKey,
  type SchuettblendeSelectionState,
  ZubehoerSchuettblendeSection
} from "@/components/protocol/ZubehoerSchuettblendeSection";
import {
  type SchrottkastenSelectionState,
  ZubehoerSchrottkastenSection
} from "@/components/protocol/ZubehoerSchrottkastenSection";
import {
  type SchraenkeOptionKey,
  type SchraenkeSelectionState,
  ZubehoerSchraenkeSection
} from "@/components/protocol/ZubehoerSchraenkeSection";
import { Button } from "@/components/ui/button";

const INITIAL_AUFBAU_SELECTION: AufbauSelectionState = {
  uml: false,
  fhb: false,
  ruk: false,
  asw: false,
  rfk: false,
  spo: false,
  sb: false
};

const INITIAL_RAHMEN_SELECTION: RahmenSelectionState = {
  rahmen: false
};

const INITIAL_SCHUETTBLENDE_SELECTION: SchuettblendeSelectionState = {
  aussen: false,
  innen: false
};

const INITIAL_SCHRAENKE_SELECTION: SchraenkeSelectionState = {
  oben: false,
  unten: false,
  innen: false,
  kleiderschrank: false
};

const INITIAL_SCHROTTKASTEN_SELECTION: SchrottkastenSelectionState = {
  schrottkasten: false
};

export function HomePage() {
  const [customerQuery, setCustomerQuery] = useState("");
  const [projektleiter, setProjektleiter] = useState("");
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
  const [aufbauSelection, setAufbauSelection] = useState<AufbauSelectionState>(INITIAL_AUFBAU_SELECTION);
  const [rahmenSelection, setRahmenSelection] = useState<RahmenSelectionState>(INITIAL_RAHMEN_SELECTION);
  const [schuettblendeSelection, setSchuettblendeSelection] = useState<SchuettblendeSelectionState>(
    INITIAL_SCHUETTBLENDE_SELECTION
  );
  const [schraenkeSelection, setSchraenkeSelection] = useState<SchraenkeSelectionState>(
    INITIAL_SCHRAENKE_SELECTION
  );
  const [schrottkastenSelection, setSchrottkastenSelection] = useState<SchrottkastenSelectionState>(
    INITIAL_SCHROTTKASTEN_SELECTION
  );

  const handleAufbauChange = (key: AufbauOptionKey, checked: boolean) => {
    setAufbauSelection((previousState) => ({
      ...previousState,
      [key]: checked
    }));
  };

  const handleRahmenChange = (checked: boolean) => {
    setRahmenSelection({ rahmen: checked });
  };

  const handleSchuettblendeChange = (key: SchuettblendeOptionKey, checked: boolean) => {
    setSchuettblendeSelection((previousState) => ({
      ...previousState,
      [key]: checked
    }));
  };

  const handleSchraenkeChange = (key: SchraenkeOptionKey, checked: boolean) => {
    setSchraenkeSelection((previousState) => ({
      ...previousState,
      [key]: checked
    }));
  };

  const handleSchrottkastenChange = (checked: boolean) => {
    setSchrottkastenSelection({ schrottkasten: checked });
  };

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
          projektleiter={projektleiter}
          orderNumber={orderNumber}
          protocolDate={protocolDate}
          aufbautyp={aufbautyp}
          vertriebsgebiet={vertriebsgebiet}
          onCustomerQueryChange={setCustomerQuery}
          onProjektleiterChange={setProjektleiter}
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
        <ZubehoerAufbauSection values={aufbauSelection} onValueChange={handleAufbauChange} />
        <ZubehoerRahmenSection values={rahmenSelection} onValueChange={handleRahmenChange} />
        <ZubehoerSchuettblendeSection
          values={schuettblendeSelection}
          onValueChange={handleSchuettblendeChange}
        />
        <ZubehoerSchraenkeSection values={schraenkeSelection} onValueChange={handleSchraenkeChange} />
        <ZubehoerSchrottkastenSection
          values={schrottkastenSelection}
          onValueChange={handleSchrottkastenChange}
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
