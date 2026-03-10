import {
  calculateAccessorySummary,
  formatEuro,
  type AccessorySelections
} from "@/lib/zubehoerPricing";

const EMPTY_SELECTIONS: AccessorySelections = {
  aufbau: {
    uml: false,
    fhb: false,
    ruk: false,
    asw: false,
    rfk: false,
    spo: false,
    sb: false
  },
  rahmen: {
    rahmen: false
  },
  schuettblende: {
    aussen: false,
    innen: false
  },
  schraenke: {
    oben: false,
    unten: false,
    innen: false,
    kleiderschrank: false
  },
  schrottkasten: {
    schrottkasten: false
  }
};

describe("zubehoer pricing", () => {
  test("returns an empty summary for no accessory selection", () => {
    expect(calculateAccessorySummary(EMPTY_SELECTIONS)).toEqual({
      selectedItems: [],
      total: 0
    });
  });

  test("sums all selected accessory prices", () => {
    const summary = calculateAccessorySummary({
      ...EMPTY_SELECTIONS,
      aufbau: {
        ...EMPTY_SELECTIONS.aufbau,
        uml: true,
        sb: true
      },
      rahmen: {
        rahmen: true
      },
      schraenke: {
        ...EMPTY_SELECTIONS.schraenke,
        kleiderschrank: true
      }
    });

    expect(summary.selectedItems).toHaveLength(4);
    expect(summary.total).toBe(6770);
    expect(formatEuro(summary.total)).toContain("6.770,00");
  });
});
