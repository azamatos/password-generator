import { expect, test } from "@playwright/test";
import { open, password, stubClipboard, tabTo } from "./helpers";

test("⌘K or Ctrl+K searches the sites, and Enter opens the first match", async ({ page }) => {
  await open(page, "/");
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Choose a site" });
  const search = dialog.getByRole("searchbox", { name: "Search sites" });
  await expect(search).toBeFocused();
  await page.keyboard.type("pay");
  await expect(dialog.getByRole("link")).toHaveText([/PayPal/]);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/paypal/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("PayPal");
  await expect(dialog).toBeHidden();

  // The first Escape clears the search, the second closes the switcher.
  await page.keyboard.press("ControlOrMeta+k");
  await search.fill("nothing like this");
  await expect(dialog.getByText("No site called “nothing like this”.", { exact: false })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).toHaveValue("");
  await expect(dialog.getByText("No site called")).toBeHidden();
  await expect(dialog.getByRole("link", { name: /PayPal/ })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("the generator works from the keyboard", async ({ page, browserName }) => {
  await stubClipboard(page, true);
  await open(page, "/");
  // In page order: Firefox leaves the page after the last stop instead of starting over.
  await tabTo(page, browserName, page.getByRole("button", { name: "Copy", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Copied", exact: true })).toBeVisible();

  const passphrase = page.getByRole("radio", { name: "Passphrase" });
  await tabTo(page, browserName, page.getByRole("radio", { name: "Password" }));
  await page.keyboard.press("ArrowRight");
  await expect(passphrase).toBeChecked();
  await expect.poll(() => password(page)).toMatch(/^(?=[^\d]*\d[^\d]*$)([a-z]+\d?-){4}[a-z]+\d?$/);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => password(page).then((p) => p.length)).toBe(16);

  const slider = page.getByRole("slider", { name: "Length" });
  await tabTo(page, browserName, slider);
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => password(page).then((p) => p.length)).toBe(17);
  await page.keyboard.press("Home");
  await expect.poll(() => password(page).then((p) => p.length)).toBe(8);

  const symbols = page.getByRole("checkbox", { name: /^Symbols/ });
  await tabTo(page, browserName, symbols);
  await page.keyboard.press("Space");
  await expect(symbols).not.toBeChecked();
  await expect.poll(() => password(page)).toMatch(/^[A-Za-z0-9]+$/);
});

test("Recent opens from the keyboard, and Escape gives focus back", async ({ page, browserName }) => {
  await open(page, "/");
  const button = page.getByRole("button", { name: "Recent" });
  await tabTo(page, browserName, button);
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Recent" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

for (const path of ["/", "/paypal/", "/health/"]) {
  test(`every Tab stop on ${path} shows where focus is`, async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit only tabs to text fields by default.");
    await open(page, path);
    const missing: string[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press("Tab");
      // What the focused element, a sibling it styles (the hidden inputs inside chips and switches) or its label
      // looks like with focus and without. Something has to change.
      const stop = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const parts = [element, element.nextElementSibling, element.parentElement].filter((e) => e !== null);
        const look = () =>
          parts
            .map((e) => {
              const s = getComputedStyle(e);
              return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderColor].join(" ");
            })
            .join(" / ");
        const focused = look();
        element.blur();
        const blurred = look();
        element.focus();
        const label = element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40) ?? "";
        const index = [...document.querySelectorAll("*")].indexOf(element);
        return { id: `${element.tagName.toLowerCase()} #${index} "${label}"`, shown: focused !== blurred };
      });
      if (!stop || seen.has(stop.id)) break;
      seen.add(stop.id);
      if (!stop.shown) missing.push(stop.id);
    }
    expect(seen.size).toBeGreaterThan(5);
    expect(missing).toEqual([]);
  });
}
