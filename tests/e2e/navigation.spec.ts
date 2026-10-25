import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

const h1 = (page: Page) => page.getByRole("heading", { level: 1 });
const tab = (page: Page, path: string) => page.locator(`nav[aria-label="Main"] a[href="${path}"]`);
const isPage = (url: string) => new URL(url).pathname.endsWith("/");

test("switching pages makes no request once they're loaded", async ({ page }) => {
  // After the first page loads, both tabs and the page itself are downloaded once.
  const loaded = ["/github/", "/", "/health/"].map((path) =>
    page.waitForResponse((r) => new URL(r.url()).pathname === path && r.request().resourceType() === "fetch"),
  );
  await open(page, "/github/");
  await Promise.all(loaded);

  const requests: string[] = [];
  page.on("request", (r) => isPage(r.url()) && requests.push(r.url()));
  await tab(page, "/health/").click();
  await expect(h1(page)).toHaveText("How strong is yours?");
  await expect(tab(page, "/health/")).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-health]")).toHaveAttribute("data-mounted", "");
  await page.goBack();
  await expect(h1(page)).toHaveText("GitHub");
  await expect(tab(page, "/")).toHaveAttribute("aria-current", "page");
  expect(requests).toEqual([]);
});

test("a page that failed to load ahead still opens", async ({ page }) => {
  let failed = false;
  await page.route("**/health/", (route) => {
    if (failed) return route.continue();
    failed = true;
    return route.abort();
  });
  await open(page, "/");
  await expect.poll(() => failed).toBe(true);
  await tab(page, "/health/").click();
  await expect(h1(page)).toHaveText("How strong is yours?");
  await expect(page).toHaveURL(/\/health\/$/);
});
