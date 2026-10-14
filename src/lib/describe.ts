import type { CharClass } from "./charsets";
import { checkRules, type PasswordRules } from "./password";

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
