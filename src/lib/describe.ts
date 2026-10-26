import { DEFAULT_SYMBOLS, type CharClass } from "./charsets";
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
 * The line under a character type's tile: why it can't be switched ("Required", "Not allowed"), or for symbols, which
 * ones the site takes ("Only !#$%&@", "No #"). Empty otherwise.
 */
export function classNote(c: CharClass, p: Pick<Plan, "locked" | "unavailable">, rules: PasswordRules): string {
  if (p.locked.includes(c)) return "Required";
  if (p.unavailable.includes(c)) return "Not allowed";
  if (c !== "symbol" || !rules.symbols) return "";
  const missing = [...DEFAULT_SYMBOLS].filter((s) => !rules.symbols!.includes(s)).join("");
  if (!missing) return "";
  return missing.length < rules.symbols.length ? `No ${missing}` : `Only ${rules.symbols}`;
}

/**
 * The banner's tags, from length to the details: "8–20 characters", "Letter", "Number or symbol", "No 4 in a row",
 * "Symbols !@#$%^&*()". A limited symbol set comes last, as "Symbols " and the set, so the banner can set it in mono.
 */
export function bannerTags(rules: PasswordRules): string[] {
  const tags = [
    rules.maxLength === null ? `${rules.minLength}+ characters` : `${rules.minLength}–${rules.maxLength} characters`,
  ];
  const WORDS: Record<string, string> = {
    lower: "Lowercase",
    upper: "Uppercase",
    digit: "Number",
    symbol: "Symbol",
    "lower,upper": "Letter",
    "digit,symbol": "Number or symbol",
  };
  for (const group of rules.required) tags.push(WORDS[group.join(",")] ?? group.join(" or "));
  if (rules.minClasses) tags.push(`${rules.minClasses.count} of 4 types`);
  if (rules.maxRepeat) tags.push(`No ${rules.maxRepeat + 1} in a row`);
  const note = rules.symbols === null ? "" : classNote("symbol", { locked: [], unavailable: [] }, rules);
  if (rules.symbols === "") tags.push("No symbols");
  else if (note.startsWith("Only ")) tags.push(`Symbols ${rules.symbols}`);
  else if (note) tags.push(note);
  if (tags.length === 1) tags.push("Any characters");
  if (rules.spaces) tags.push("Spaces OK");
  return tags;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" → "Oct 2026", for when a site's rules were checked. */
export function monthYear(checked: string): string {
  const [year, month] = checked.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
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
