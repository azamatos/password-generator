import type { CharClass } from "./charsets";
import { checkRules, type PasswordRules, type Plan } from "./password";

const MARK: Record<CharClass, string> = { upper: "A", lower: "a", digit: "9", symbol: "!" };
const ORDER: CharClass[] = ["upper", "lower", "digit", "symbol"];
const marks = (classes: CharClass[]) => ORDER.filter((c) => classes.includes(c)).map((c) => MARK[c]);

/** The platform list's one-liner: "8–20 · A/a + 9/!", "Min 8 · a9", "8–127 · 2 of 4". */
export function shortSummary(rules: PasswordRules): string {
  const length = rules.maxLength === null ? `Min ${rules.minLength}` : `${rules.minLength}–${rules.maxLength}`;
  let classes = "Any";
  if (rules.minClasses) classes = `${rules.minClasses.count} of 4`;
  else if (rules.required.length) {
    const singles = marks(rules.required.filter((g) => g.length === 1).map((g) => g[0])).join("");
    const either = rules.required.filter((g) => g.length > 1).map((g) => marks(g).join("/"));
    classes = [...either, singles].filter(Boolean).join(" + ");
  }
  return `${length} · ${classes}`;
}

/** The rules as short tags for the banner. */
export function ruleTags(rules: PasswordRules): string[] {
  const tags = checkRules(rules, "").map((c) => c.label);
  const anyCharacters = rules.required.length === 0 && !rules.minClasses && rules.symbols === null;
  return anyCharacters ? [...tags, "Any characters"] : tags;
}

/**
 * Tooltip and screen-reader suffix for a character type's chip, saying why it can't be switched:
 * "Numbers (required by GitHub)", "Symbols: !@# (not accepted by Example)".
 */
export function chipText(base: string, c: CharClass, p: Pick<Plan, "locked" | "unavailable">, owner: string) {
  const note = p.locked.includes(c)
    ? `required by ${owner}`
    : p.unavailable.includes(c)
      ? `not accepted by ${owner}`
      : "";
  return { title: note ? `${base} (${note})` : base, state: note ? `, ${note}` : "" };
}

/** The share image's tags, three at most: length, then what's required, in words. */
export function shareTags(rules: PasswordRules): string[] {
  const length =
    rules.maxLength === null ? `${rules.minLength}+ characters` : `${rules.minLength}–${rules.maxLength} characters`;
  if (rules.minClasses) return [length, `${rules.minClasses.count} of 4 types`];
  const WORDS: Record<string, [long: string, short: string]> = {
    upper: ["Uppercase", "upper"],
    lower: ["Lowercase", "lower"],
    digit: ["Number", "number"],
    symbol: ["Symbol", "symbol"],
    "lower,upper": ["Letter", "letter"],
    "digit,symbol": ["Number or symbol", "number or symbol"],
  };
  const groups = rules.required.map((g) => WORDS[g.join(",")] ?? [g.join(" or "), g.join(" or ")]);
  if (groups.length === 0) return [length, "Any characters"];
  if (groups.length <= 2) return [length, ...groups.map(([long]) => long)];
  // Three or more fit one tag: "Upper, lower, number".
  const combined = groups.map(([, short]) => short).join(", ");
  return [length, combined.charAt(0).toUpperCase() + combined.slice(1)];
}
