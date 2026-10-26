import { createHash } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { cors, open, pwned, RANGE } from "./helpers";

const field = (page: Page) => page.getByRole("textbox", { name: "Password to check" });
const leak = (page: Page) => page.locator("[data-leak-title]");
const level = (page: Page) => page.locator("[data-verdict] [data-level]");
const leakSwitch = (page: Page) => page.getByRole("switch", { name: /^Check Have I Been Pwned/ });

test("a leaked password: the count, and only 5 characters of its hash sent", async ({ page }) => {
  const requests = await pwned(page, { password123: 2266543 });
  await open(page, "/health/");
  await field(page).fill("password123");
  await expect(leak(page)).toHaveText("Found in 2,266,543 leaks");
  await expect(level(page)).toHaveText("Very weak");
  await expect(page.locator("[data-stronger-link]")).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Very weak. Found in 2,266,543 leaks." })).toBeAttached();
  // What leaves the browser, shown: the 5 characters sent, the rest masked while the password is.
  const sent = createHash("sha1").update("password123").digest("hex").toUpperCase().slice(0, 5);
  await expect(page.locator("[data-hash]")).toHaveText(sent + "•".repeat(35));

  // Once, after typing paused, with the hash's first 5 characters and nothing else.
  expect(requests).toHaveLength(1);
  const hash = createHash("sha1").update("password123").digest("hex").toUpperCase();
  expect(requests[0].url()).toBe(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`);
  expect(await requests[0].headerValue("add-padding")).toBe("true");
});

test("a strong password that hasn't leaked", async ({ page }) => {
  await pwned(page);
  await open(page, "/health/");
  await field(page).fill("vQ7#mZ2!kR9$wL4@");
  await expect(leak(page)).toHaveText("Not found in known leaks");
  await expect(level(page)).toHaveText("Very strong");
  await expect(page.locator("[data-offline]")).toHaveText(/years|centuries/);
});

test("with the leak check off, nothing is sent", async ({ page }) => {
  const requests = await pwned(page);
  await open(page, "/health/");
  await leakSwitch(page).uncheck();
  await field(page).fill("password123");
  await expect(level(page)).toHaveText("Very weak");
  await expect(leak(page)).toHaveText("Leak check is off");
  // Longer than the pause the leak check waits for.
  await page.waitForTimeout(1200);
  expect(requests).toHaveLength(0);

  // Still off after visiting another page in the same tab.
  await page.locator('nav[aria-label="Main"] a[href="/"]').click();
  await page.locator('nav[aria-label="Main"] a[href="/health/"]').click();
  await expect(leakSwitch(page)).not.toBeChecked();
});

test("Have I Been Pwned can't be reached, or something else answers", async ({ page }) => {
  await page.route(RANGE, (route) => route.abort());
  await open(page, "/health/");
  await field(page).fill("password123");
  await expect(leak(page)).toHaveText("Couldn’t check for leaks");

  // A Wi-Fi sign-in page in the API's place.
  await page.unroute(RANGE);
  await page.route(RANGE, (route) =>
    route.fulfill({ headers: cors, contentType: "text/html", body: "<html><body>Sign in to Wi-Fi</body></html>" }),
  );
  await field(page).fill("password1234");
  await expect(leak(page)).toHaveText("Couldn’t check for leaks");
});

test("the strength check can't load, then can", async ({ page }) => {
  await pwned(page);
  await page.route(/zxcvbn\.worker/, (route) => route.abort());
  await open(page, "/health/");
  await field(page).fill("hunter2");
  await expect(page.locator("[data-failed]")).toBeVisible();
  await expect(page.locator("[data-verdict]")).toBeHidden();

  await page.unroute(/zxcvbn\.worker/);
  await field(page).press("End");
  await field(page).press("3");
  await expect(page.locator("[data-verdict]")).toBeVisible();
  await expect(page.locator("[data-failed]")).toBeHidden();
});

test("a password typed before the script loaded is checked", async ({ page }) => {
  await pwned(page);
  // Holds the page's script back, as a slow connection would.
  await page.route(/health\.astro_astro_type_script/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await route.continue();
  });
  await page.goto("/health/", { waitUntil: "commit" });
  await field(page).fill("password123");
  await expect(page.locator("[data-health]")).not.toHaveAttribute("data-mounted");
  await expect(level(page)).toHaveText("Very weak");
});

test("show, hide and clear", async ({ page }) => {
  await pwned(page);
  await open(page, "/health/");
  await field(page).fill("hunter2");
  const eye = page.getByRole("button", { name: "Show password" });
  await eye.click();
  await expect(eye).toHaveAttribute("aria-pressed", "true");
  await expect(field(page)).toHaveAttribute("type", "text");
  await eye.click();
  await expect(field(page)).toHaveAttribute("type", "password");

  await page.getByRole("button", { name: "Clear" }).click();
  await expect(field(page)).toHaveValue("");
  await expect(field(page)).toBeFocused();
  await expect(page.locator("[data-verdict]")).toBeHidden();
});
