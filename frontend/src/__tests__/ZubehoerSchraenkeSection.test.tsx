import { fireEvent, render, screen } from "@testing-library/react";

import {
  type SchraenkeSelectionState,
  ZubehoerSchraenkeSection
} from "@/components/protocol/ZubehoerSchraenkeSection";

const EMPTY_SELECTION: SchraenkeSelectionState = {
  oben: false,
  unten: false,
  innen: false,
  kleiderschrank: false
};

describe("ZubehoerSchraenkeSection", () => {
  test("renders schraenke category checkboxes as controlled inputs", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerSchraenkeSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    expect(screen.getByRole("heading", { name: "Zubehör" })).not.toBeNull();
    expect(screen.getByText("Kategorie: Schränke")).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>("Oben").checked).toBe(false);
    expect(screen.getByLabelText<HTMLInputElement>("Unten").checked).toBe(false);
    expect(screen.getByLabelText<HTMLInputElement>("Innen").checked).toBe(false);
    expect(screen.getByLabelText<HTMLInputElement>("Kleiderschrank").checked).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("forwards changed key and checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerSchraenkeSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByLabelText("Unten"));

    expect(onValueChange).toHaveBeenCalledWith("unten", true);
  });

  test("forwards kleiderschrank key and checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerSchraenkeSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByLabelText("Kleiderschrank"));

    expect(onValueChange).toHaveBeenCalledWith("kleiderschrank", true);
  });
});
