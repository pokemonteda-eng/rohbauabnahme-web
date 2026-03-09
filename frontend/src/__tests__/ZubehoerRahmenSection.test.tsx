import { fireEvent, render, screen } from "@testing-library/react";

import { ZubehoerRahmenSection } from "@/components/protocol/ZubehoerRahmenSection";

describe("ZubehoerRahmenSection", () => {
  test("renders rahmen category checkbox as controlled input", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerRahmenSection values={{ rahmen: false }} onValueChange={onValueChange} />);

    expect(screen.getByRole("heading", { name: "Zubehör" })).not.toBeNull();
    expect(screen.getByText("Kategorie: Rahmen")).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>("Rahmen").checked).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("forwards checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(<ZubehoerRahmenSection values={{ rahmen: false }} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByLabelText("Rahmen"));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
