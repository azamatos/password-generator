/**
 * The EFF large wordlist (https://www.eff.org/dice), minus its four hyphenated words, so every
 * word is plain a–z. 7,772 words, about 12.9 bits each. CC BY 3.0 US, Electronic Frontier Foundation.
 * Loaded on demand, the first time someone picks a passphrase.
 */
export async function loadWordlist(): Promise<string[]> {
  const { default: text } = await import("./eff-large.txt?raw");
  return text.trim().split("\n");
}
