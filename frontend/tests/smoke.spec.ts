import { expect, test } from "@playwright/test";

test.describe("Homepage smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders application header", async ({ page }) => {
    await expect(page).toHaveTitle(/rohbauabnahme/i);
    await expect(page.getByText("rohbauabnahme-web")).toBeVisible();
  });

  test("shows setup section content", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "React Frontend Setup" })
    ).toBeVisible();
    await expect(
      page.getByText("Vite, TypeScript, Tailwind und shadcn/ui Basis sind initialisiert.")
    ).toBeVisible();
  });

  test("shows primary and secondary actions", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Primary Action" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sekundär" })).toBeVisible();
  });
});
