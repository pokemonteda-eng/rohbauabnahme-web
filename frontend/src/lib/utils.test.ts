import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("p-2", "text-sm")).toBe("p-2 text-sm");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
