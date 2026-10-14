/**
 * Have I Been Pwned "Pwned Passwords" range API, with k-anonymity: only the first five hex
 * characters of the password's SHA-1 hash are sent, and the API returns every hash suffix that
 * starts with them. The match happens here, so neither the password nor its full hash leaves the browser.
 * Padding makes every response a similar size, so the response doesn't hint at the result.
 * https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** How many times the password appears in known breaches (0 if never). */
export async function pwnedCount(password: string, signal?: AbortSignal): Promise<number> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
    signal,
  });
  if (!response.ok) throw new Error(`Have I Been Pwned answered ${response.status}`);
  return countIn(await response.text(), suffix);
}

/** Finds the suffix in a range response ("SUFFIX:COUNT" lines). Padding lines have a count of 0. */
export function countIn(body: string, suffix: string): number {
  for (const line of body.split("\n")) {
    const [lineSuffix, count] = line.trim().split(":");
    if (lineSuffix === suffix) return Number.parseInt(count, 10) || 0;
  }
  return 0;
}
