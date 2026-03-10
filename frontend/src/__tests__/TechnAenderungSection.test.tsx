import { fireEvent, render, screen } from "@testing-library/react";

import { TechnAenderungSection } from "@/components/protocol/TechnAenderungSection";

describe("TechnAenderungSection", () => {
  test("forwards yes and no selection through the toggle buttons", () => {
    const handleChange = jest.fn();

    render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={null}
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={handleChange}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    const jaButton = screen.getByRole("button", { name: "Ja" });
    const neinButton = screen.getByRole("button", { name: "Nein" });

    fireEvent.click(jaButton);
    fireEvent.click(neinButton);

    expect(handleChange).toHaveBeenNthCalledWith(1, true);
    expect(handleChange).toHaveBeenNthCalledWith(2, false);
  });

  test("reflects the current selected state with aria-pressed", () => {
    const { rerender } = render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={true}
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Ja" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Nein" }).getAttribute("aria-pressed")).toBe("false");

    rerender(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={false}
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Ja" }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Nein" }).getAttribute("aria-pressed")).toBe("true");
  });

  test("forwards multiline text changes through the textarea", () => {
    const handleTextChange = jest.fn();

    render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={null}
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onTechnischeAenderungenChange={handleTextChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Technische Änderungen"), {
      target: { value: "Leitungsweg angepasst\nFunkmodul versetzt" }
    });

    expect(handleTextChange).toHaveBeenCalledWith("Leitungsweg angepasst\nFunkmodul versetzt");
  });
});
