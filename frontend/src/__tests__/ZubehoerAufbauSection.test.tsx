import { fireEvent, render, screen } from "@testing-library/react";

import {
  type AufbauSelectionState,
  AUFBAU_OPTIONS,
  ZubehoerAufbauSection
} from "@/components/protocol/ZubehoerAufbauSection";

const EMPTY_SELECTION: AufbauSelectionState = {
  uml: false,
  fhb: false,
  ruk: false,
  asw: false,
  rfk: false,
  spo: false,
  sb: false
};

describe("ZubehoerAufbauSection", () => {
  test("renders all aufbau options as controlled checkboxes", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerAufbauSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    expect(screen.getByRole("heading", { name: "Zubehör" })).not.toBeNull();
    expect(screen.getByText("Kategorie: Aufbau")).not.toBeNull();

    for (const option of AUFBAU_OPTIONS) {
      const checkbox = screen.getByLabelText<HTMLInputElement>(option.label);
      expect(checkbox.checked).toBe(false);
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("forwards key and checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerAufbauSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByLabelText("UML"));
    fireEvent.click(screen.getByLabelText("SB"));

    expect(onValueChange).toHaveBeenNthCalledWith(1, "uml", true);
    expect(onValueChange).toHaveBeenNthCalledWith(2, "sb", true);
  });
});
