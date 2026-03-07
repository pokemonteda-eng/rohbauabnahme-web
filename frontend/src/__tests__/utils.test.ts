import { describe, expect, test } from "@jest/globals";

import { cn } from "@/lib/utils";

describe("cn", () => {
  test("merges class names and deduplicates conflicting tailwind classes", () => {
    const merged = cn("px-2", "px-4", "text-sm", false, undefined, "text-sm");

    expect(merged).toContain("px-4");
    expect(merged).toContain("text-sm");
    expect(merged).not.toContain("px-2");
  });
});
