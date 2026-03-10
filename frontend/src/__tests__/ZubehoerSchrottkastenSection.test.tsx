import { fireEvent, render, screen } from "@testing-library/react";

import { ZubehoerSchrottkastenSection } from "@/components/protocol/ZubehoerSchrottkastenSection";

describe("ZubehoerSchrottkastenSection", () => {
  test("renders schrottkasten category checkbox as controlled input", () => {
    const onValueChange = jest.fn();

    render(
      <ZubehoerSchrottkastenSection
        values={{ schrottkasten: false }}
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByRole("heading", { name: "Zubehör" })).not.toBeNull();
    expect(screen.getByText("Kategorie: Schrottkasten")).not.toBeNull();
    expect(screen.getByLabelText<HTMLInputElement>("Schrottkasten").checked).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  test("forwards checked state when toggled", () => {
    const onValueChange = jest.fn();

    render(
      <ZubehoerSchrottkastenSection
        values={{ schrottkasten: false }}
        onValueChange={onValueChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Schrottkasten"));

    expect(onValueChange).toHaveBeenCalledWith(true);
  });
});
