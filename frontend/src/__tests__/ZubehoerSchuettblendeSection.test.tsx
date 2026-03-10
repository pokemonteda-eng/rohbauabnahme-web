import { fireEvent, render, screen } from "@testing-library/react";

import {
  type SchuettblendeSelectionState,
  ZubehoerSchuettblendeSection
} from "@/components/protocol/ZubehoerSchuettblendeSection";

const EMPTY_SELECTION: SchuettblendeSelectionState = {
  aussen: false,
  innen: false
};

describe("ZubehoerSchuettblendeSection", () => {
  test("renders schuettblende category checkboxes as controlled inputs", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerSchuettblendeSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    expect(screen.getByRole("heading", { name: "Zubehör" })).not.toBeNull();
    expect(screen.getByText("Kategorie: Schüttblende")).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>("Schüttblende Außen").checked).toBe(false);
    expect(screen.getByLabelText<HTMLInputElement>("Schüttblende Innen").checked).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("forwards changed key and checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerSchuettblendeSection values={EMPTY_SELECTION} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByLabelText("Schüttblende Außen"));
    fireEvent.click(screen.getByLabelText("Schüttblende Innen"));

    expect(onValueChange).toHaveBeenNthCalledWith(1, "aussen", true);
    expect(onValueChange).toHaveBeenNthCalledWith(2, "innen", true);
  });
});
