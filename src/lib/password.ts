import { AMBIGUOUS, CHAR_CLASSES, classOf, DEFAULT_SYMBOLS, LETTERS, type CharClass } from "./charsets";
import { log2BigInt, randomInt } from "./random";

/** What a site accepts. Every platform preset is one of these, and so is the default generator. */
export interface PasswordRules {
  minLength: number;
  /** null when the site documents no maximum. */
  maxLength: number | null;
  /**
   * Groups that must each appear at least once. A group with several classes means "any of these":
   * ["lower", "upper"] is "a letter", ["digit", "symbol"] is "a number or a symbol".
   */
  required: CharClass[][];
  /** "At least N of these classes", such as 3 of lowercase, uppercase, numbers and symbols. */
  minClasses?: { count: number; from: CharClass[] };
  /** Symbols the site accepts: null for the default set, "" for none at all. */
  symbols: string | null;
  /** Whether the site accepts spaces. Only passphrases use them. */
  spaces?: boolean;
  /** Longest run of one repeated character the site accepts, e.g. 2 rejects "aaa". */
  maxRepeat?: number;
}

export interface PasswordOptions {
  length: number;
  classes: Record<CharClass, boolean>;
  avoidAmbiguous: boolean;
}

/** Longest password offered when a site sets no maximum. */
export const MAX_LENGTH = 64;

/** The generator's own rules when no platform is selected. */
export const ANY_SITE: PasswordRules = { minLength: 8, maxLength: null, required: [], symbols: null, spaces: true };

/** What the generator will actually do for these rules and options, after applying the site's limits. */
export interface Plan {
  length: number;
  maxRepeat?: number;
  minLength: number;
  maxLength: number;
  /** Characters available for each class that is switched on. */
  pools: Partial<Record<CharClass, string>>;
  /** Classes that are on and can't be switched off without breaking a rule. */
  locked: CharClass[];
  /** Classes the site doesn't accept. */
  unavailable: CharClass[];
}

function poolsFor(rules: PasswordRules, avoidAmbiguous: boolean): Partial<Record<CharClass, string>> {
  const all: Record<CharClass, string> = { ...LETTERS, symbol: rules.symbols ?? DEFAULT_SYMBOLS };
  const pools: Partial<Record<CharClass, string>> = {};
  for (const c of CHAR_CLASSES) {
    let pool = [...new Set(all[c])].join("");
    if (avoidAmbiguous) {
      const clear = [...pool].filter((ch) => !AMBIGUOUS.includes(ch)).join("");
      if (clear) pool = clear;
    }
    if (pool) pools[c] = pool;
  }
  return pools;
}

function satisfies(rules: PasswordRules, enabled: Set<CharClass>, available: CharClass[]): boolean {
  const groupsOk = rules.required.every((group) => {
    const possible = group.filter((c) => available.includes(c));
    return possible.length === 0 || possible.some((c) => enabled.has(c));
  });
  if (!groupsOk) return false;
  if (!rules.minClasses) return true;
  const from = rules.minClasses.from.filter((c) => available.includes(c));
  return from.filter((c) => enabled.has(c)).length >= Math.min(rules.minClasses.count, from.length);
}

export function plan(rules: PasswordRules, options: PasswordOptions): Plan {
  const pools = poolsFor(rules, options.avoidAmbiguous);
  const available = CHAR_CLASSES.filter((c) => pools[c]);
  const enabled = new Set(available.filter((c) => options.classes[c]));

  // Switch classes back on, in the usual order, until the site's rules can be met.
  for (const c of available) {
    if (satisfies(rules, enabled, available) && enabled.size > 0) break;
    enabled.add(c);
  }
  // Adding in order can overshoot (e.g. "a number" needs only digits); drop extras the user had off.
  for (const c of [...enabled].reverse()) {
    if (options.classes[c] || enabled.size === 1) continue;
    enabled.delete(c);
    if (!satisfies(rules, enabled, available)) enabled.add(c);
  }

  const locked = [...enabled].filter((c) => {
    if (enabled.size === 1) return true;
    const without = new Set(enabled);
    without.delete(c);
    return !satisfies(rules, without, available);
  });

  const maxLength = Math.min(rules.maxLength ?? MAX_LENGTH, MAX_LENGTH);
  const minLength = Math.min(Math.max(rules.minLength, enabled.size), maxLength);
  const length = Math.min(Math.max(Math.round(options.length), minLength), maxLength);

  const enabledPools: Partial<Record<CharClass, string>> = {};
  for (const c of CHAR_CLASSES) if (enabled.has(c)) enabledPools[c] = pools[c];

  return {
    length,
    maxRepeat: rules.maxRepeat,
    minLength,
    maxLength,
    pools: enabledPools,
    locked: CHAR_CLASSES.filter((c) => locked.includes(c)),
    unavailable: CHAR_CLASSES.filter((c) => !pools[c]),
  };
}

/** Length of the longest run of one repeated character ("baaac" is 3). */
export function longestRepeat(password: string): number {
  let longest = 0;
  let run = 0;
  for (let i = 0; i < password.length; i++) {
    run = password[i] === password[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
}

/**
 * A random password for the plan. Whole passwords are drawn uniformly and redrawn until every
 * switched-on class appears (and no character repeats too often), so every valid password is
 * equally likely: no "one of each, then shuffle" bias.
 */
export function generate(p: Plan): string {
  const pools = Object.values(p.pools);
  const charset = pools.join("");
  for (let attempt = 0; attempt < 100_000; attempt++) {
    let password = "";
    for (let i = 0; i < p.length; i++) password += charset[randomInt(charset.length)];
    if (!pools.every((pool) => [...password].some((ch) => pool.includes(ch)))) continue;
    if (p.maxRepeat && longestRepeat(password) > p.maxRepeat) continue;
    return password;
  }
  throw new Error("generate: could not satisfy the plan");
}

/**
 * Exact strength in bits: log2 of how many passwords the plan can produce, counted with
 * inclusion–exclusion over the classes that must appear. An attacker who knows the settings
 * still has to search this many. A repeat limit removes a tiny share of passwords (under 0.01 bits
 * for these lengths), which isn't subtracted.
 */
export function entropyBits(p: Plan): number {
  const sizes = Object.values(p.pools).map((pool) => BigInt(pool.length));
  const total = sizes.reduce((a, b) => a + b, 0n);
  const length = BigInt(p.length);
  let count = 0n;
  for (let mask = 0; mask < 1 << sizes.length; mask++) {
    let missing = 0n;
    let terms = 0;
    sizes.forEach((size, i) => {
      if (mask & (1 << i)) {
        missing += size;
        terms++;
      }
    });
    const term = (total - missing) ** length;
    count += terms % 2 ? -term : term;
  }
  return log2BigInt(count);
}

export interface RuleCheck {
  id: string;
  label: string;
  pass: boolean;
}

const CLASS_NOUN: Record<CharClass, string> = {
  lower: "lowercase letter",
  upper: "uppercase letter",
  digit: "number",
  symbol: "symbol",
};

const PLURAL: Record<CharClass, string> = { lower: "lowercase", upper: "uppercase", digit: "numbers", symbol: "symbols" };

function article(noun: string): string {
  return /^[aeiou]/.test(noun) ? `An ${noun}` : `A ${noun}`;
}

function groupLabel(group: CharClass[]): string {
  if (group.length === 2 && group.includes("lower") && group.includes("upper")) return "A letter";
  const nouns = group.map((c) => CLASS_NOUN[c]);
  return article(nouns.join(" or "));
}

/** The site's rules as a checklist, evaluated against a password. */
export function checkRules(rules: PasswordRules, password: string): RuleCheck[] {
  const present = new Set([...password].map(classOf));
  const checks: RuleCheck[] = [];

  const { minLength: min, maxLength: max } = rules;
  checks.push({
    id: "length",
    label: max === null ? `At least ${min} characters` : `${min} to ${max} characters`,
    pass: password.length >= min && (max === null || password.length <= max),
  });

  for (const group of rules.required) {
    checks.push({ id: `has-${group.join("-")}`, label: groupLabel(group), pass: group.some((c) => present.has(c)) });
  }

  if (rules.minClasses) {
    const { count, from } = rules.minClasses;
    checks.push({
      id: "min-classes",
      label: `At least ${count} of: ${from.map((c) => PLURAL[c]).join(", ")}`,
      pass: from.filter((c) => present.has(c)).length >= count,
    });
  }

  if (rules.maxRepeat) {
    checks.push({
      id: "max-repeat",
      label: `No character ${rules.maxRepeat + 1}× in a row`,
      pass: longestRepeat(password) <= rules.maxRepeat,
    });
  }

  if (rules.symbols === "") {
    checks.push({ id: "no-symbols", label: "No symbols", pass: !present.has("symbol") });
  } else if (rules.symbols !== null) {
    const allowed = rules.symbols;
    // A few symbols left out of the default set read better as "No ~" than as the full list.
    const missing = [...DEFAULT_SYMBOLS].filter((ch) => !allowed.includes(ch));
    const subset = [...allowed].every((ch) => DEFAULT_SYMBOLS.includes(ch));
    checks.push({
      id: "symbols",
      label: subset && missing.length <= 3 ? `No ${missing.join(" ")}` : `Symbols only from ${allowed}`,
      pass: [...password].every((ch) => classOf(ch) !== "symbol" || allowed.includes(ch)),
    });
  }

  return checks;
}
