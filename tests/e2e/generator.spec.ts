import { expect, test } from "@playwright/test";
import { open, password, stubClipboard, switchSite } from "./helpers";

test("Any site: a 16-character password, and New makes another", async ({ page }) => {
  await open(page, "/");
  const first = await password(page);
  expect(first).toHaveLength(16);
  // Any site has no rules to meet.
  await expect(page.getByText("Meets")).toBeHidden();
  await page.getByRole("button", { name: "New" }).click();
  await expect.poll(() => password(page)).not.toBe(first);
});

test("GitHub: the classes it requires are on and locked", async ({ page }) => {
  await open(page, "/github/");
  await expect(page.getByText("Meets GitHub's rules")).toBeVisible();
  for (const name of ["Lowercase", "Numbers"]) {
    const box = page.getByRole("checkbox", { name: new RegExp(`^${name}\\s+Required`) });
    await expect(box).toBeChecked();
    await expect(box).toBeDisabled();
  }
  await expect(page.getByRole("checkbox", { name: "Uppercase", exact: true })).toBeEnabled();
  await expect(page.getByText("15+ characters may be anything")).toBeVisible();
  await expect(page.getByRole("link", { name: /GitHub Docs/ })).toHaveAttribute("href", /docs\.github\.com/);
});

test("PayPal: passwords use only its symbols and stay within 20 characters", async ({ page }) => {
  await open(page, "/paypal/");
  const slider = page.getByRole("slider", { name: "Length" });
  await expect(slider).toHaveAttribute("max", "20");
  await slider.focus();
  await page.keyboard.press("End");
  for (let i = 0; i < 20; i++) {
    const value = await password(page);
    expect(value).toHaveLength(20);
    expect(value).toMatch(/^[A-Za-z0-9!@#$%^&*()]+$/);
    expect(value).not.toMatch(/(.)\1{3}/);
    await page.getByRole("button", { name: "New" }).click();
  }
});

test("the slider follows the site's limits from page to page", async ({ page }) => {
  await open(page, "/");
  const slider = page.getByRole("slider", { name: "Length" });
  await slider.fill("40");
  await expect.poll(() => password(page).then((p) => p.length)).toBe(40);
  // TikTok allows 20 at most, so 40 comes down to 20 there.
  await switchSite(page, "TikTok");
  await expect(slider).toHaveValue("20");
  await expect.poll(() => password(page).then((p) => p.length)).toBe(20);
  await page.getByRole("button", { name: "Reset to 16" }).click();
  await expect(slider).toHaveValue("16");
});

test("choices carry over to another site", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("checkbox", { name: /^Symbols/ }).uncheck();
  await expect.poll(() => password(page)).toMatch(/^[A-Za-z0-9]+$/);
  await switchSite(page, "GitHub");
  await expect(page.getByRole("checkbox", { name: /^Symbols/ })).not.toBeChecked();
  await expect.poll(() => password(page)).toMatch(/^[A-Za-z0-9]+$/);
});

test("passphrases, and the sites they don't fit", async ({ page }) => {
  await open(page, "/");
  await page.getByRole("radio", { name: "Passphrase" }).check();
  await expect.poll(() => password(page)).toMatch(/^(?=[^\d]*\d[^\d]*$)([a-z]+\d?-){4}[a-z]+\d?$/);
  await expect(page.getByText("5 words")).toBeVisible();

  // TikTok's 20 characters are too few for 4 words.
  await switchSite(page, "TikTok");
  await expect(page.getByText(/Passphrases don't fit TikTok/)).toBeVisible();
  await expect(page.locator("[data-output]")).toBeHidden();
  await page.getByRole("button", { name: "Use a password" }).click();
  await expect(page.getByRole("radio", { name: "Password" })).toBeFocused();
  await expect(page.getByRole("radio", { name: "Password" })).toBeChecked();
  expect((await password(page)).length).toBeLessThanOrEqual(20);
});

test("the word list can't load", async ({ page }) => {
  await open(page, "/");
  await page.route(/eff-large/, (route) => route.abort());
  await page.getByRole("radio", { name: "Passphrase" }).check();
  await expect(page.getByText(/Couldn't load the word list/)).toBeVisible();
  await page.getByRole("button", { name: "Use a password" }).click();
  await expect.poll(() => password(page).then((p) => p.length)).toBe(16);
});

test("copied passwords go to Recent, masked, and only for this tab", async ({ page }) => {
  await stubClipboard(page, true);
  await open(page, "/github/");
  const value = await password(page);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Recent, 1 copied" }).click();
  const recent = page.getByRole("dialog", { name: "Recent" });
  await expect(recent.locator("code")).toHaveText(`${value.slice(0, 3)}${"•".repeat(12)}`);
  await expect(recent).toContainText("GitHub · just now");
  await expect(recent).not.toContainText(value);
  await recent.getByRole("button", { name: "Close" }).click();

  // Never written anywhere a later visit could read it.
  const stored = await page.evaluate(() =>
    [JSON.stringify({ ...localStorage }), JSON.stringify({ ...sessionStorage }), document.cookie].join(" "),
  );
  expect(stored).not.toContain(value);

  // Kept across client-side navigation, gone after a reload.
  await page.locator('nav[aria-label="Main"] a[href="/health/"]').click();
  await expect(page.getByRole("button", { name: "Recent, 1 copied" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Recent", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Recent" }).click();
  await expect(page.getByText("Nothing yet.")).toBeVisible();
});

test("Clear all empties Recent", async ({ page }) => {
  await stubClipboard(page, true);
  await open(page, "/");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByRole("button", { name: "New" }).click();
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await page.getByRole("button", { name: "Recent, 2 copied" }).click();
  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page.getByText("Nothing yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear all" })).toBeHidden();
});

test("the browser refuses the clipboard", async ({ page }) => {
  await stubClipboard(page, false);
  await open(page, "/");
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(page.getByRole("button", { name: "Copy failed" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Couldn't copy" })).toBeAttached();
  await expect(page.getByRole("button", { name: "Recent", exact: true })).toBeVisible();
});

test.describe("before the script runs", () => {
  test("the password area already has its final size", async ({ page }) => {
    // Holds the script back, as a slow connection would.
    await page.route(/Generator\.astro_astro_type_script/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });
    // Not "domcontentloaded": that waits for module scripts to run.
    await page.goto("/", { waitUntil: "commit" });
    const output = page.locator("[data-output]");
    await output.waitFor();
    // Measured before the fonts load too: Firefox and WebKit hold fonts.ready until the scripts have run.
    const before = await output.boundingBox();
    await expect(page.locator("[data-generator]")).not.toHaveAttribute("data-mounted");
    expect((await password(page)).length).toBe(16);
    await page.evaluate(() => document.fonts.ready);
    expect(await output.boundingBox()).toEqual(before);
  });

  test("without JavaScript, it says it needs it", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/");
    // Playwright reads no text in <noscript>, so ask the page.
    const message = page.locator("[data-output] noscript");
    await expect(message).toBeVisible();
    expect(await message.evaluate((e) => e.textContent)).toBe("Turn on JavaScript to generate a password.");
    // "Change site" leads to the list of every site instead of opening the switcher.
    const change = page.getByRole("link", { name: /Change site/ });
    await expect(change).toHaveAttribute("href", "#other-sites");
    // No ⌘K, since there's no switcher to open.
    await expect(change.locator("kbd")).toBeHidden();
    await expect(page.getByRole("region", { name: "Passwords for other sites" }).getByRole("link")).toHaveCount(17);
    await context.close();
  });

  test("nothing moves while the page loads, on a phone or a desktop, a Mac or not", async ({
    browser,
    browserName,
  }) => {
    test.skip(browserName !== "chromium", "Only Chromium reports layout shifts.");
    // The shortcut on "Change site" is written for the device, and must be before the first paint.
    for (const [system, userAgent, keys] of [
      ["a Mac", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", "⌘K"],
      ["Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Ctrl K"],
    ]) {
      for (const viewport of [
        { width: 360, height: 740 },
        { width: 1280, height: 800 },
      ]) {
        const context = await browser.newContext({ userAgent, viewport });
        const page = await context.newPage();
        await page.goto("/github/");
        await page.evaluate(() => document.fonts.ready);
        const shift = await page.evaluate(
          () =>
            new Promise<number>((resolve) => {
              let total = 0;
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as (PerformanceEntry & { value: number })[]) total += entry.value;
              }).observe({ type: "layout-shift", buffered: true });
              setTimeout(() => resolve(total), 500);
            }),
        );
        expect(shift, `layout shift at ${viewport.width}px on ${system}`).toBe(0);
        if (viewport.width > 700) {
          await expect(page.getByRole("link", { name: /Change site/ }).locator("kbd")).toHaveText(keys, {
            useInnerText: true,
          });
        }
        await context.close();
      }
    }
  });
});
