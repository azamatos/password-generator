import { DEFAULT_SYMBOLS, type CharClass } from "./charsets";
import type { PasswordRules } from "./password";
import { clamp } from "./math";
import { randomInt } from "./random";

/** "" joins words in CamelCase, for sites that accept no separator at all. */
export const SEPARATORS = ["-", ".", "_", " ", ""] as const;
export type Separator = (typeof SEPARATORS)[number];

export interface PassphraseOptions {
  words: number;
  separator: Separator;
  capitalize: boolean;
  /** Add one random digit to the end of one random word. */
  number: boolean;
}

/** Where passphrases start, and what "recommended" sets: 5 words is about 65 bits. */
export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  words: 5,
  separator: "-",
  capitalize: false,
  number: false,
};

export const MIN_WORDS = 4;
export const MAX_WORDS = 10;

/** Word lengths in the bundled list, used to guarantee the result fits the site's length limits. */
export const WORD_LENGTH = { min: 3, max: 9 };

export interface PassphrasePlan extends PassphraseOptions {
  minWords: number;
  maxWords: number;
  separators: Separator[];
  locked: { capitalize: boolean; number: boolean };
  /** Why passphrases can't work on this site, when they can't. */
  unsupported: string | null;
}

/** Character classes a passphrase with these settings always contains. */
function classesIn(options: Pick<PassphraseOptions, "separator" | "capitalize" | "number">): Set<CharClass> {
  const classes = new Set<CharClass>(["lower"]);
  if (options.capitalize) classes.add("upper");
  if (options.number) classes.add("digit");
  if (options.separator !== " " && options.separator !== "") classes.add("symbol");
  return classes;
}

function meetsClassRules(rules: PasswordRules, classes: Set<CharClass>): boolean {
  const groups = rules.required.every((group) => group.some((c) => classes.has(c)));
  const min = !rules.minClasses || rules.minClasses.from.filter((c) => classes.has(c)).length >= rules.minClasses.count;
  return groups && min;
}

export function planPassphrase(rules: PasswordRules, options: PassphraseOptions): PassphrasePlan {
  const symbols = rules.symbols ?? DEFAULT_SYMBOLS;
  const separators = SEPARATORS.filter((s) => s === "" || (s === " " ? rules.spaces === true : symbols.includes(s)));

  const base = { ...options, minWords: MIN_WORDS, maxWords: MAX_WORDS, separators };
  const fail = (unsupported: string): PassphrasePlan => ({
    ...base,
    locked: { capitalize: false, number: false },
    unsupported,
  });

  // A short maximum rules passphrases out whatever the other settings, so say that first.
  const tooLong = (gap: number) => MIN_WORDS * WORD_LENGTH.max + (MIN_WORDS - 1) * gap;
  if (rules.maxLength !== null && tooLong(0) > rules.maxLength) {
    return fail(`its ${rules.maxLength}-character limit is too short for ${MIN_WORDS} words.`);
  }

  // Prefer the chosen separator; otherwise the first one the site accepts.
  const settings = {
    separator: separators.includes(options.separator) ? options.separator : separators[0],
    capitalize: options.capitalize,
    number: options.number,
  };
  const needs = (s: typeof settings) => !meetsClassRules(rules, classesIn(s));

  // Turn on only what a missing rule needs: a symbol between words, capitals, or a number.
  const symbolSeparator = separators.find((s) => s !== " " && s !== "");
  const fixes: [CharClass, () => void][] = [
    ["symbol", () => (settings.separator = symbolSeparator!)],
    ["upper", () => (settings.capitalize = true)],
    ["digit", () => (settings.number = true)],
  ];
  const usable = fixes.filter(([c]) => c !== "symbol" || symbolSeparator);
  for (const group of rules.required) {
    if (group.some((c) => classesIn(settings).has(c))) continue;
    usable.find(([c]) => group.includes(c))?.[1]();
  }
  if (rules.minClasses) {
    const { count, from } = rules.minClasses;
    for (const [c, apply] of usable) {
      const present = classesIn(settings);
      if (from.filter((x) => present.has(x)).length >= count) break;
      if (from.includes(c) && !present.has(c)) apply();
    }
  }
  // Without a separator, capitals are what keep the words readable.
  if (settings.separator === "") settings.capitalize = true;
  if (needs(settings)) return fail("its character rules can't be met with words.");
  const separator = settings.separator;

  const locked = {
    capitalize: settings.capitalize && (settings.separator === "" || needs({ ...settings, capitalize: false })),
    number: settings.number && needs({ ...settings, number: false }),
  };

  // Word counts whose shortest result meets the minimum and longest result fits the maximum.
  const extra = settings.number ? 1 : 0;
  const gap = settings.separator.length;
  const shortest = (w: number) => w * WORD_LENGTH.min + (w - 1) * gap + extra;
  const longest = (w: number) => w * WORD_LENGTH.max + (w - 1) * gap + extra;
  let minWords = MIN_WORDS;
  while (shortest(minWords) < rules.minLength) minWords++;
  let maxWords = MAX_WORDS;
  if (rules.maxLength !== null) while (maxWords >= minWords && longest(maxWords) > rules.maxLength) maxWords--;
  if (maxWords < minWords) {
    return fail(`its ${rules.maxLength}-character limit is too short for ${MIN_WORDS} words.`);
  }

  const words = clamp(Math.round(options.words), minWords, maxWords);
  return { ...base, ...settings, separator, words, minWords, maxWords, locked, unsupported: null };
}

export function generatePassphrase(wordlist: readonly string[], p: PassphrasePlan): string {
  const words = Array.from({ length: p.words }, () => {
    const word = wordlist[randomInt(wordlist.length)];
    return p.capitalize ? word[0].toUpperCase() + word.slice(1) : word;
  });
  if (p.number) {
    const i = randomInt(words.length);
    words[i] += String(randomInt(10));
  }
  return words.join(p.separator);
}

/** Exact bits: each word is one of N, and the digit adds 10 choices in one of `words` positions. */
export function passphraseBits(listSize: number, p: Pick<PassphrasePlan, "words" | "number">): number {
  return p.words * Math.log2(listSize) + (p.number ? Math.log2(10 * p.words) : 0);
}
