export interface BreachResult {
  breached: boolean;
  count: number;
}

/**
 * Checks a password against the HaveIBeenPwned database using k-Anonymity.
 * Only the first 5 hex characters of the SHA-1 hash are sent to the API —
 * the full password and hash never leave the browser.
 */
export async function checkBreach(password: string): Promise<BreachResult> {
  const hashBuffer = await crypto.subtle.digest(
    "SHA-1",
    new TextEncoder().encode(password),
  );

  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });

  if (!res.ok) throw new Error(`HIBP ${res.status}`);

  const text = await res.text();

  for (const line of text.split("\r\n")) {
    const [lineSuffix, countStr] = line.split(":");
    if (lineSuffix === suffix) {
      const count = parseInt(countStr, 10);
      return { breached: count > 0, count };
    }
  }

  return { breached: false, count: 0 };
}
