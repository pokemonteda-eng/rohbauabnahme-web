import { expect, test } from "@playwright/test";

test.describe("Login page tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders login page", async ({ page }) => {
    await expect(page).toHaveTitle(/Login/);
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  });

  test("shows login form elements", async ({ page }) => {
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("shows error message on invalid login", async ({ page }) => {
    await page.getByLabel("Email address").fill("invalid@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    // Wait for error message to appear
    await expect(page.getByText("Login failed")).toBeVisible();
  });
});