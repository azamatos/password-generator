import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { generatePassphrase, passphraseBits, planPassphrase, WORD_LENGTH, type PassphraseOptions } from "./passphrase";
import { ANY_SITE, checkRules, type PasswordRules } from "./password";

const wordlist = readFileSync(new URL("./wordlist/eff-large.txt", import.meta.url), "utf8")
  .trim()
  .split("\n");

const DEFAULTS: PassphraseOptions = { words: 5, separator: "-", capitalize: false, number: false };

describe("wordlist", () => {
  it("is the EFF large list without its hyphenated words", () => {
    expect(wordlist).toHaveLength(7772);
    expect(new Set(wordlist).size).toBe(wordlist.length);
    for (const word of wordlist) {
      expect(word).toMatch(/^[a-z]+$/);
      expect(word.length).toBeGreaterThanOrEqual(WORD_LENGTH.min);
      expect(word.length).toBeLessThanOrEqual(WORD_LENGTH.max);
    }
  });
});

describe("planPassphrase", () => {
  it("keeps the choices when the site has no rules", () => {
    const p = planPassphrase(ANY_SITE, { ...DEFAULTS, separator: " " });
    expect(p).toMatchObject({ words: 5, separator: " ", capitalize: false, number: false, unsupported: null });
  });

  it("turns on and locks capitals and a number when the site requires them", () => {
    const rules: PasswordRules = { minLength: 8, maxLength: null, required: [["upper"], ["digit"]], symbols: null };
    const p = planPassphrase(rules, DEFAULTS);
    expect(p).toMatchObject({ capitalize: true, number: true, locked: { capitalize: true, number: true } });
  });

  it("turns on only what a missing rule needs", () => {
    const rules: PasswordRules = { minLength: 8, maxLength: null, required: [["lower"], ["digit"]], symbols: null };
    expect(planPassphrase(rules, DEFAULTS)).toMatchObject({ capitalize: false, number: true, separator: "-" });
    const threeOfFour: PasswordRules = {
      minLength: 8,
      maxLength: null,
      required: [],
      minClasses: { count: 3, from: ["lower", "upper", "digit", "symbol"] },
      symbols: null,
    };
    // Words and a dash already give lowercase + symbol; one more is needed.
    expect(planPassphrase(threeOfFour, DEFAULTS)).toMatchObject({ capitalize: true, number: false });
  });

  it("switches from spaces to a symbol when the site needs a symbol", () => {
    const rules: PasswordRules = { minLength: 8, maxLength: null, required: [["symbol"]], symbols: null, spaces: true };
    expect(planPassphrase(rules, { ...DEFAULTS, separator: " " }).separator).toBe("-");
  });

  it("only offers separators the site accepts", () => {
    const rules: PasswordRules = { minLength: 8, maxLength: null, required: [], symbols: "!_" };
    const p = planPassphrase(rules, DEFAULTS);
    expect(p.separators).toEqual(["_", ""]);
    expect(p.separator).toBe("_");
  });

  it("limits words so the longest result still fits the maximum", () => {
    const p = planPassphrase({ ...ANY_SITE, maxLength: 40 }, { ...DEFAULTS, words: 10 });
    expect(p.maxWords).toBe(4);
    expect(p.words).toBe(4);
  });

  it("says when a site's limit is too short for a passphrase", () => {
    const p = planPassphrase({ ...ANY_SITE, maxLength: 20 }, DEFAULTS);
    expect(p.unsupported).toMatch(/20-character limit/);
  });

  it("joins words in CamelCase when the site accepts nothing to separate them", () => {
    const p = planPassphrase({ minLength: 8, maxLength: null, required: [], symbols: "" }, DEFAULTS);
    expect(p).toMatchObject({ separators: [""], separator: "", capitalize: true, unsupported: null });
    expect(p.locked.capitalize).toBe(true);
    expect(generatePassphrase(wordlist, p)).toMatch(/^([A-Z][a-z]+){5}$/);
  });
});

describe("generatePassphrase", () => {
  it("builds words from the list with the chosen settings", () => {
    const p = planPassphrase(ANY_SITE, { words: 6, separator: ".", capitalize: true, number: true });
    for (let i = 0; i < 200; i++) {
      const phrase = generatePassphrase(wordlist, p);
      const words = phrase.split(".");
      expect(words).toHaveLength(6);
      expect(words.filter((w) => /\d$/.test(w))).toHaveLength(1);
      for (const w of words) expect(wordlist).toContain(w.replace(/\d$/, "").toLowerCase());
      expect(words.every((w) => /^[A-Z]/.test(w))).toBe(true);
    }
  });

  it("passes the site's rules", () => {
    const rules: PasswordRules = {
      minLength: 12,
      maxLength: 64,
      required: [["upper"], ["digit"], ["symbol"]],
      symbols: "-!",
    };
    const p = planPassphrase(rules, DEFAULTS);
    for (let i = 0; i < 300; i++) {
      expect(checkRules(rules, generatePassphrase(wordlist, p)).filter((c) => !c.pass)).toEqual([]);
    }
  });
});

describe("passphraseBits", () => {
  it("counts words and the digit's position", () => {
    expect(passphraseBits(7772, { words: 5, number: false })).toBeCloseTo(5 * Math.log2(7772), 10);
    expect(passphraseBits(7772, { words: 5, number: true })).toBeCloseTo(5 * Math.log2(7772) + Math.log2(50), 10);
  });
});
