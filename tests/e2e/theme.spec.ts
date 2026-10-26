import { expect, test } from "@playwright/test";
import { open } from "./helpers";

test("the theme follows the system until one is chosen, and the choice holds across pages and visits", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await open(page, "/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("radio", { name: "System" })).toBeChecked();

  await page.getByRole("radio", { name: "Dark" }).check();
  await expect(html).toHaveAttribute("data-theme", "dark");
  // The client router swaps in a page without the attribute; it has to be set again.
  await page.locator('nav[aria-label="Main"] a[href="/health/"]').click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("How long would it take to guess?");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();

  await page.getByRole("radio", { name: "System" }).check();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(html).toHaveAttribute("data-theme", "dark");
});
