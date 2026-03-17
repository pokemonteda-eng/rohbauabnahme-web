import { expect, test } from "@playwright/test";

test.describe("Homepage smoke tests", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    
    // Should redirect to login page
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("login page shows required elements", async ({ page }) => {
    await page.goto("/login");
    
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });
});
