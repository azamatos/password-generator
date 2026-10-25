import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { open, pwned, settle, stubClipboard } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Every screen and state worth checking, as a visitor would reach it. */
const states: { name: string; reach: (page: Page) => Promise<void> }[] = [
  { name: "Any site", reach: (page) => open(page, "/") },
  { name: "GitHub", reach: (page) => open(page, "/github/") },
  {
    name: "a passphrase",
    reach: async (page) => {
      await open(page, "/");
      await page.getByRole("radio", { name: "Passphrase" }).check();
      await expect(page.locator("[data-output]")).toHaveText(/-/);
    },
  },
  {
    name: "a passphrase that doesn't fit TikTok",
    reach: async (page) => {
      await open(page, "/tiktok/");
      await page.getByRole("radio", { name: "Passphrase" }).check();
      await expect(page.getByText(/Passphrases don't fit/)).toBeVisible();
    },
  },
  {
    name: "Recent with a password",
    reach: async (page) => {
      await stubClipboard(page, true);
      await open(page, "/");
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      await page.getByRole("button", { name: /^Recent/ }).click();
      await settle(page.getByRole("dialog"));
    },
  },
  {
    name: "/health, leaked",
    reach: async (page) => {
      await pwned(page, { password123: 2266543 });
      await open(page, "/health/");
      await page.getByRole("textbox", { name: "Check your password" }).fill("password123");
      await expect(page.getByText("Leaked", { exact: true })).toBeVisible();
    },
  },
  {
    name: "/health, strong and not leaked",
    reach: async (page) => {
      await pwned(page);
      await open(page, "/health/");
      await page.getByRole("textbox", { name: "Check your password" }).fill("vQ7#mZ2!kR9$wL4@");
      await expect(page.getByText("Not found in known data breaches.", { exact: true })).toBeVisible();
    },
  },
  {
    name: "404",
    reach: async (page) => {
      await page.goto("/no-such-page/");
    },
  },
];

for (const colorScheme of ["light", "dark"] as const) {
  for (const state of states) {
    test(`${state.name}, ${colorScheme}: no accessibility violations`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await state.reach(page);
      await settle(page.locator("body"));
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
}
