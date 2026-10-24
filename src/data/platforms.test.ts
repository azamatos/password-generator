import { describe, expect, it } from "vitest";
import { parsePlatforms, platforms } from "./platforms";
import { DEFAULT_SYMBOLS } from "@/lib/charsets";
import { checkRules, generate, plan, type PasswordOptions } from "@/lib/password";
import { generatePassphrase, planPassphrase } from "@/lib/passphrase";
import { readFileSync } from "node:fs";

const wordlist = readFileSync(new URL("../lib/wordlist/eff-large.txt", import.meta.url), "utf8")
  .trim()
  .split("\n");

const settings: PasswordOptions[] = [
  { length: 16, classes: { lower: true, upper: true, digit: true, symbol: true }, avoidAmbiguous: false },
  { length: 8, classes: { lower: true, upper: false, digit: false, symbol: false }, avoidAmbiguous: true },
  { length: 64, classes: { lower: false, upper: false, digit: true, symbol: true }, avoidAmbiguous: false },
];

const valid = {
  id: "example",
  name: "Example",
  short: "Ex",
  color: "#4a6e8a",
  rules: { minLength: 8, maxLength: 20, required: [["digit"]], symbols: { except: "#" } },
  sources: [{ label: "Example Help", url: "https://example.com/help" }],
  checked: "2026-10",
};

describe("platforms.json", () => {
  it("turns { except } into the default symbols without those", () => {
    const [p] = parsePlatforms([valid]);
    expect(p.rules.symbols).toBe(DEFAULT_SYMBOLS.replace("#", ""));
  });

  it("rejects typos and impossible rules, naming the field", () => {
    const broken = (rules: object) => () => parsePlatforms([{ ...valid, rules: { ...valid.rules, ...rules } }]);
    expect(broken({ minLenght: 8 })).toThrow(/minLenght/);
    expect(broken({ required: [["digits"]] })).toThrow(/required/);
    expect(broken({ minLength: 30 })).toThrow(/minLength is above maxLength/);
    expect(broken({ symbols: "!@a" })).toThrow(/only hold symbols/);
    expect(broken({ symbols: "!@!" })).toThrow(/twice/);
    expect(() => parsePlatforms([{ ...valid, checked: "Oct 2026" }])).toThrow(/YYYY-MM/);
  });

  it("have unique ids and an icon each", () => {
    expect(new Set(platforms.map((p) => p.id)).size).toBe(platforms.length);
    for (const p of platforms) {
      expect(() => readFileSync(new URL(`../../public/icons/${p.id}.svg`, import.meta.url))).not.toThrow();
    }
  });
});

describe("platforms", () => {
  for (const p of platforms) {
    it(`${p.name}: 1,000 passwords all pass its rules`, () => {
      for (const options of settings) {
        const pl = plan(p.rules, options);
        for (let i = 0; i < 1000 / settings.length; i++) {
          const password = generate(pl);
          expect(
            checkRules(p.rules, password).filter((c) => !c.pass),
            password,
          ).toEqual([]);
        }
      }
    });

    it(`${p.name}: passphrases pass its rules, or say why they can't`, () => {
      const pl = planPassphrase(p.rules, { words: 5, separator: " ", capitalize: false, number: false });
      // Only a short maximum rules passphrases out: PayPal and TikTok allow 20 characters.
      if (pl.unsupported) {
        expect(pl.unsupported).toMatch(/character limit/);
        expect(p.rules.maxLength).toBeLessThanOrEqual(36);
        return;
      }
      for (let i = 0; i < 200; i++) {
        const phrase = generatePassphrase(wordlist, pl);
        expect(
          checkRules(p.rules, phrase).filter((c) => !c.pass),
          phrase,
        ).toEqual([]);
        if (!p.rules.spaces) expect(phrase).not.toContain(" ");
      }
    });
  }
});
