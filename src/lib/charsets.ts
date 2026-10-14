export const CHAR_CLASSES = ["lower", "upper", "digit", "symbol"] as const;
export type CharClass = (typeof CHAR_CLASSES)[number];

export const LETTERS: Record<Exclude<CharClass, "symbol">, string> = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digit: "0123456789",
};

/**
 * Symbols used when a site accepts any: printable ASCII punctuation without quotes,
 * backslash and backtick, which break shells, JSON and some sign-up forms.
 */
export const DEFAULT_SYMBOLS = "!#$%&()*+,-./:;<=>?@[]^_{|}~";

/** Characters that are easy to misread or mistype: 0 O o, 1 l I |. */
export const AMBIGUOUS = "0Oo1lI|";

export function classOf(char: string): CharClass {
  if (char >= "a" && char <= "z") return "lower";
  if (char >= "A" && char <= "Z") return "upper";
  if (char >= "0" && char <= "9") return "digit";
  return "symbol";
}
