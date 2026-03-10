import { fireEvent, render, screen } from "@testing-library/react";

import { TechnAenderungSection } from "@/components/protocol/TechnAenderungSection";

describe("TechnAenderungSection", () => {
  test("forwards yes and no selection through the toggle buttons", () => {
    const handleChange = jest.fn();

    render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={null}
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={handleChange}
        onAenderungsdatumChange={jest.fn()}
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
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={jest.fn()}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Ja" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Nein" }).getAttribute("aria-pressed")).toBe("false");

    rerender(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={false}
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={jest.fn()}
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
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={jest.fn()}
        onTechnischeAenderungenChange={handleTextChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Technische Änderungen"), {
      target: { value: "Leitungsweg angepasst\nFunkmodul versetzt" }
    });

    expect(handleTextChange).toHaveBeenCalledWith("Leitungsweg angepasst\nFunkmodul versetzt");
  });

  test("shows a required date input only when the layout change is enabled", () => {
    const { rerender } = render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={null}
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={jest.fn()}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    expect(screen.queryByLabelText("Änderungsdatum")).toBeNull();
    expect(screen.getByLabelText<HTMLTextAreaElement>("Technische Änderungen").required).toBe(false);

    rerender(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={true}
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={jest.fn()}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText<HTMLInputElement>("Änderungsdatum").required).toBe(true);
    expect(screen.getByLabelText<HTMLTextAreaElement>("Technische Änderungen").required).toBe(true);
  });

  test("forwards date changes through the date input", () => {
    const handleDateChange = jest.fn();

    render(
      <TechnAenderungSection
        kabelFunklayoutGeaendert={true}
        aenderungsdatum=""
        technischeAenderungen=""
        onKabelFunklayoutGeaendertChange={jest.fn()}
        onAenderungsdatumChange={handleDateChange}
        onTechnischeAenderungenChange={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Änderungsdatum"), {
      target: { value: "2026-03-10" }
    });

    expect(handleDateChange).toHaveBeenCalledWith("2026-03-10");
  });
});
