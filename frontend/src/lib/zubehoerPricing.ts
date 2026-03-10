export const AUFBAU_PRICE_OPTIONS = [
  { id: "uml", label: "UML", price: 1850 },
  { id: "fhb", label: "FHB", price: 1320 },
  { id: "ruk", label: "RUK", price: 980 },
  { id: "asw", label: "ASW", price: 760 },
  { id: "rfk", label: "RFK", price: 1100 },
  { id: "spo", label: "SPO", price: 690 },
  { id: "sb", label: "SB", price: 540 }
] as const;

export const RAHMEN_PRICE_OPTIONS = [{ id: "rahmen", label: "Rahmen", price: 2490 }] as const;

export const SCHUETTBLENDE_PRICE_OPTIONS = [
  { id: "aussen", label: "Außen", price: 875 },
  { id: "innen", label: "Innen", price: 825 }
] as const;

export const SCHRAENKE_PRICE_OPTIONS = [
  { id: "oben", label: "Oben", price: 1490 },
  { id: "unten", label: "Unten", price: 1390 },
  { id: "innen", label: "Innen", price: 1190 },
  { id: "kleiderschrank", label: "Kleiderschrank", price: 1890 }
] as const;

export const SCHROTTKASTEN_PRICE_OPTIONS = [
  { id: "schrottkasten", label: "Schrottkasten", price: 990 }
] as const;

export type AufbauOptionKey = (typeof AUFBAU_PRICE_OPTIONS)[number]["id"];
export type RahmenOptionKey = (typeof RAHMEN_PRICE_OPTIONS)[number]["id"];
export type SchuettblendeOptionKey = (typeof SCHUETTBLENDE_PRICE_OPTIONS)[number]["id"];
export type SchraenkeOptionKey = (typeof SCHRAENKE_PRICE_OPTIONS)[number]["id"];
export type SchrottkastenOptionKey = (typeof SCHROTTKASTEN_PRICE_OPTIONS)[number]["id"];

type SelectionState<Key extends string> = Record<Key, boolean>;

export type AccessorySelections = {
  aufbau: SelectionState<AufbauOptionKey>;
  rahmen: SelectionState<RahmenOptionKey>;
  schuettblende: SelectionState<SchuettblendeOptionKey>;
  schraenke: SelectionState<SchraenkeOptionKey>;
  schrottkasten: SelectionState<SchrottkastenOptionKey>;
};

export type SelectedAccessory = {
  category: string;
  label: string;
  price: number;
};

export type AccessorySummary = {
  selectedItems: SelectedAccessory[];
  total: number;
};

type PriceOption<Key extends string> = {
  id: Key;
  label: string;
  price: number;
};

function collectSelectedItems<Key extends string>(
  category: string,
  options: readonly PriceOption<Key>[],
  values: SelectionState<Key>
): SelectedAccessory[] {
  return options
    .filter((option) => values[option.id])
    .map((option) => ({
      category,
      label: option.label,
      price: option.price
    }));
}

export function calculateAccessorySummary(selections: AccessorySelections): AccessorySummary {
  const selectedItems = [
    ...collectSelectedItems("Aufbau", AUFBAU_PRICE_OPTIONS, selections.aufbau),
    ...collectSelectedItems("Rahmen", RAHMEN_PRICE_OPTIONS, selections.rahmen),
    ...collectSelectedItems("Schüttblende", SCHUETTBLENDE_PRICE_OPTIONS, selections.schuettblende),
    ...collectSelectedItems("Schränke", SCHRAENKE_PRICE_OPTIONS, selections.schraenke),
    ...collectSelectedItems("Schrottkasten", SCHROTTKASTEN_PRICE_OPTIONS, selections.schrottkasten)
  ];

  return {
    selectedItems,
    total: selectedItems.reduce((sum, item) => sum + item.price, 0)
  };
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}
