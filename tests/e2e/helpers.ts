import { createHash } from "node:crypto";
import { expect, type Locator, type Page, type Request } from "@playwright/test";

/**
 * Opens a page and waits until its script has taken it over. The pages come with their markup made at build time,
 * which looks ready before the script can react to anything.
 */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await expect(page.locator("[data-generator], [data-health]").first()).toHaveAttribute("data-mounted", "");
}

/** Goes to another site the way a visitor would, with the site switcher. Keeps the page, unlike page.goto. */
export async function switchSite(page: Page, name: string): Promise<void> {
  await page.getByRole("link", { name: /Change site/ }).click();
  await page.getByRole("searchbox", { name: "Search sites" }).fill(name);
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(page.locator("[data-generator]")).toHaveAttribute("data-mounted", "");
}

/** The password on screen once the script has filled it in. */
export async function password(page: Page): Promise<string> {
  const output = page.locator("[data-output]");
  await expect(output.locator(".placeholder")).toHaveCount(0);
  return (await output.textContent()) ?? "";
}

/** Moves focus to `target` with Tab, as a keyboard user would. WebKit only tabs to text fields by default. */
export async function tabTo(page: Page, browserName: string, target: Locator): Promise<void> {
  if (browserName === "webkit") {
    await target.focus();
    return;
  }
  for (let i = 0; i < 80 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

/**
 * Waits for the animations on `target` and inside it to finish, such as Recent sliding in, skipping endless ones like
 * the wordmark's cursor. axe measures contrast on what's painted, so a check halfway through a fade fails.
 */
export async function settle(target: Locator): Promise<void> {
  await target.evaluate((element) =>
    Promise.all(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
}

/** Makes the clipboard always accept, or always refuse, whatever the browser's own permissions are. */
export async function stubClipboard(page: Page, works: boolean): Promise<void> {
  await page.addInitScript((works) => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => (works ? Promise.resolve() : Promise.reject(new DOMException("Denied"))) },
    });
  }, works);
}

export const RANGE = "https://api.pwnedpasswords.com/range/*";
export const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Add-Padding" };

/**
 * Answers the range API in place of Have I Been Pwned, which these tests never reach: each password in `leaked` is
 * found that many times, any other isn't found. Returns the requests the page made.
 */
export async function pwned(page: Page, leaked: Record<string, number> = {}): Promise<Request[]> {
  const requests: Request[] = [];
  await page.route(RANGE, async (route) => {
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    requests.push(route.request());
    const prefix = route.request().url().split("/").pop();
    const lines = Object.entries(leaked).flatMap(([password, count]) => {
      const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
      return hash.startsWith(prefix!) ? [`${hash.slice(5)}:${count}`] : [];
    });
    // Padding, as the real API sends with Add-Padding.
    lines.push(`${"A".repeat(35)}:0`, `${"B".repeat(35)}:0`);
    await route.fulfill({ headers: cors, contentType: "text/plain", body: lines.join("\r\n") });
  });
  return requests;
}
