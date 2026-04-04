import { describe, it, expect } from "vitest";
import { generatePassword, type GeneratorParams } from "./generator";
import { getPlatformById, platforms, type Platform } from "./platforms";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const instagram = getPlatformById("instagram")!;
const google = getPlatformById("google")!;
const amazon = getPlatformById("amazon")!;
const github = getPlatformById("github")!;
const apple = getPlatformById("apple")!;
const netflix = getPlatformById("netflix")!;

const allOn: GeneratorParams = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

// ─── Length constraints ───────────────────────────────────────────────────────

describe("length constraints", () => {
  it("produces output of exactly the requested length", () => {
    const password = generatePassword(instagram, { ...allOn, length: 20 });
    expect(password.length).toBe(20);
  });

  it("clamps up to platform minLength when params.length is too short", () => {
    // Instagram minLength = 6, requesting 2
    const password = generatePassword(instagram, { ...allOn, length: 2 });
    expect(password.length).toBe(6);
  });

  it("clamps down to platform maxLength (Netflix max = 60)", () => {
    const password = generatePassword(netflix, { ...allOn, length: 100 });
    expect(password.length).toBe(60);
  });

  it("respects Google maxLength of 100", () => {
    const password = generatePassword(google, { ...allOn, length: 100 });
    expect(password.length).toBe(100);
  });

  it("uses platform defaultLength as a reasonable default", () => {
    const password = generatePassword(instagram, { ...allOn, length: instagram.defaultLength });
    expect(password.length).toBe(instagram.defaultLength);
  });
});

// ─── Forbidden chars ──────────────────────────────────────────────────────────

describe("forbidden chars", () => {
  it("never includes spaces for Amazon (100 runs)", () => {
    for (let i = 0; i < 100; i++) {
      const password = generatePassword(amazon, { ...allOn, length: 16 });
      expect(password).not.toContain(" ");
    }
  });
});

// ─── Required character types ─────────────────────────────────────────────────

describe("required character types", () => {
  it("always contains lowercase and number for GitHub (50 runs)", () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(github, { ...allOn, length: 16 });
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
    }
  });

  it("always meets minLength for Apple (50 runs)", () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(apple, { ...allOn, length: 18 });
      expect(password.length).toBeGreaterThanOrEqual(apple.minLength);
    }
  });

  it("guarantees required char types when platform requires them (50 runs)", () => {
    // Use Apple which requires uppercase + lowercase + number
    const strictPlatform: Platform = {
      ...apple,
      requiresSpecial: true,
    };
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(strictPlatform, { ...allOn, length: 16 });
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(password)).toBe(true);
    }
  });

  it("skips guarantee when the matching include flag is off", () => {
    // GitHub requiresLowercase = true, but includeLowercase = false
    // Should not throw, just produce a password without guaranteed lowercase
    const params: GeneratorParams = { ...allOn, includeLowercase: false };
    expect(() => generatePassword(github, params)).not.toThrow();
  });
});

// ─── Symbol restriction ───────────────────────────────────────────────────────

describe("symbol restriction", () => {
  it("only uses allowed special chars when platform restricts them (50 runs)", () => {
    const restrictedPlatform: Platform = {
      ...instagram,
      allowedSpecialChars: "!@#",
      requiresSpecial: true,
    };

    for (let i = 0; i < 50; i++) {
      const password = generatePassword(restrictedPlatform, { ...allOn, length: 16 });
      const symbolsInPassword = password.split("").filter((c) => /[^A-Za-z0-9]/.test(c));
      for (const sym of symbolsInPassword) {
        expect("!@#").toContain(sym);
      }
    }
  });
});

// ─── Randomness ───────────────────────────────────────────────────────────────

describe("randomness", () => {
  it("produces at least 5 unique passwords across 10 calls", () => {
    const results = new Set(
      Array.from({ length: 10 }, () => generatePassword(instagram, { ...allOn, length: 16 })),
    );
    expect(results.size).toBeGreaterThanOrEqual(5);
  });
});

// ─── Permissive platform (Instagram — no forced requirements) ────────────────

describe("permissive platform", () => {
  it("respects exact length with no forced requirements", () => {
    const password = generatePassword(instagram, { ...allOn, length: 24 });
    expect(password.length).toBe(24);
  });

  it("works with only numbers enabled", () => {
    const params: GeneratorParams = {
      length: 12,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: true,
      includeSymbols: false,
    };
    const password = generatePassword(instagram, params);
    expect(password).toMatch(/^[0-9]+$/);
    expect(password.length).toBe(12);
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("error handling", () => {
  it("throws when all character types are disabled", () => {
    const params: GeneratorParams = {
      length: 16,
      includeUppercase: false,
      includeLowercase: false,
      includeNumbers: false,
      includeSymbols: false,
    };
    expect(() => generatePassword(instagram, params)).toThrow(
      "No valid characters available for this configuration",
    );
  });
});

// ─── All platforms ────────────────────────────────────────────────────────────

describe("all platforms", () => {
  it.each(platforms)("$name — invariants hold across 30 runs", (platform) => {
    const params: GeneratorParams = {
      ...allOn,
      length: platform.defaultLength,
    };

    for (let i = 0; i < 30; i++) {
      const password = generatePassword(platform, params);

      // Length in bounds
      expect(password.length).toBeGreaterThanOrEqual(platform.minLength);
      if (platform.maxLength !== null) {
        expect(password.length).toBeLessThanOrEqual(platform.maxLength);
      }

      // No forbidden chars
      for (const char of platform.forbiddenChars) {
        expect(password).not.toContain(char);
      }

      // Required character types
      if (platform.requiresUppercase) expect(/[A-Z]/.test(password)).toBe(true);
      if (platform.requiresLowercase) expect(/[a-z]/.test(password)).toBe(true);
      if (platform.requiresNumber) expect(/[0-9]/.test(password)).toBe(true);
      if (platform.requiresSpecial) expect(/[^A-Za-z0-9]/.test(password)).toBe(true);

      // Symbols stay within allowedSpecialChars when restricted
      if (platform.allowedSpecialChars !== null) {
        const specials = password.split("").filter((c) => /[^A-Za-z0-9]/.test(c));
        for (const sym of specials) {
          expect(platform.allowedSpecialChars).toContain(sym);
        }
      }
    }
  });
});
