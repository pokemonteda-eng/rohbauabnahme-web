import { render, screen } from "@testing-library/react";
import React from "react";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  test("renders default variant and size", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });

    expect(button.className).toContain("bg-primary");
    expect(button.className).toContain("h-10");
  });

  test("applies variant classes", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole("button", { name: "Outline" }).className).toContain("border");

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole("button", { name: "Secondary" }).className).toContain("bg-secondary");

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: "Ghost" }).className).toContain("hover:bg-accent");
  });

  test("applies size classes", () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button", { name: "Small" }).className).toContain("h-9");

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button", { name: "Large" }).className).toContain("h-11");
  });

  test("forwards refs and native attributes", () => {
    const ref = React.createRef<HTMLButtonElement>();

    render(
      <Button disabled ref={ref} type="button">
        Disabled
      </Button>
    );

    const button = screen.getByRole("button", { name: "Disabled" });
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(ref.current).toBe(button);
  });
});
