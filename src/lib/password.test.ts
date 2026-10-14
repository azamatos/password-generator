import { describe, expect, it } from "vitest";
import { AMBIGUOUS, classOf, type CharClass } from "./charsets";
import {
  ANY_SITE,
  checkRules,
  entropyBits,
  generate,
  longestRepeat,
  MAX_LENGTH,
  plan,
  type PasswordOptions,
  type PasswordRules,
} from "./password";
import { log2BigInt, randomInt } from "./random";

const ALL_ON: PasswordOptions = {
  length: 16,
  classes: { lower: true, upper: true, digit: true, symbol: true },
  avoidAmbiguous: false,
};

const options = (patch: Partial<PasswordOptions> & { off?: CharClass[] } = {}): PasswordOptions => {
  const classes = { ...ALL_ON.classes };
  for (const c of patch.off ?? []) classes[c] = false;
  return { ...ALL_ON, ...patch, classes };
};

// Typical and awkward rule shapes, in the same form the platform presets use.
const FIXTURES: Record<string, PasswordRules> = {
  any: ANY_SITE,
  "letter and digit": { minLength: 8, maxLength: null, required: [["lower", "upper"], ["digit"]], symbols: null },
  "8-20, all four": {
    minLength: 8,
    maxLength: 20,
    required: [["lower"], ["upper"], ["digit"], ["symbol"]],
    symbols: "!@#$%^&*",
  },
  "3 of 4": {
    minLength: 8,
    maxLength: 256,
    required: [],
    minClasses: { count: 3, from: ["lower", "upper", "digit", "symbol"] },
    symbols: null,
  },
  "no symbols": { minLength: 6, maxLength: 12, required: [["digit"]], symbols: "" },
  // A tiny pool makes repeats common, so the limit is actually exercised.
  "repeat limit": { minLength: 12, maxLength: 12, required: [["digit"]], symbols: "", maxRepeat: 2 },
};

describe("randomInt", () => {
  it("stays in range and rejects bad bounds", () => {
    for (let i = 0; i < 1000; i++) {
      const n = randomInt(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(1.5)).toThrow(RangeError);
  });

  it("is uniform (chi-square, 60,000 draws over 6 values)", () => {
    const counts = new Array(6).fill(0);
    const draws = 60_000;
    for (let i = 0; i < draws; i++) counts[randomInt(6)]++;
    const expected = draws / 6;
    const chi = counts.reduce((sum, c) => sum + (c - expected) ** 2 / expected, 0);
    // 5 degrees of freedom: p = 0.001 at 20.5.
    expect(chi).toBeLessThan(20.5);
  });
});

describe("plan", () => {
  it("locks classes the site requires and turns them back on", () => {
    const p = plan(FIXTURES["letter and digit"], options({ off: ["digit"] }));
    expect(Object.keys(p.pools)).toContain("digit");
    expect(p.locked).toContain("digit");
  });

  it("keeps a letter when the site needs one but either case will do", () => {
    const p = plan(FIXTURES["letter and digit"], options({ off: ["lower", "upper", "symbol"] }));
    expect(p.pools.lower ?? p.pools.upper).toBeTruthy();
    expect(p.pools.symbol).toBeUndefined();
  });

  it("only locks a letter case when it is the last one left", () => {
    expect(plan(FIXTURES["letter and digit"], options()).locked).toEqual(["digit"]);
    expect(plan(FIXTURES["letter and digit"], options({ off: ["upper"] })).locked).toEqual(["lower", "digit"]);
  });

  it("meets an N-of-M rule by switching classes back on", () => {
    const p = plan(FIXTURES["3 of 4"], options({ off: ["upper", "digit", "symbol"] }));
    expect(Object.keys(p.pools).length).toBeGreaterThanOrEqual(3);
  });

  it("never lets every class be switched off", () => {
    const p = plan(ANY_SITE, options({ off: ["lower", "upper", "digit", "symbol"] }));
    expect(Object.keys(p.pools).length).toBe(1);
    expect(p.locked.length).toBe(1);
  });

  it("marks symbols unavailable when the site accepts none", () => {
    const p = plan(FIXTURES["no symbols"], options());
    expect(p.unavailable).toEqual(["symbol"]);
    expect(p.pools.symbol).toBeUndefined();
  });

  it("clamps length to the site's limits and the generator's maximum", () => {
    expect(plan(FIXTURES["8-20, all four"], options({ length: 40 })).length).toBe(20);
    expect(plan(FIXTURES["8-20, all four"], options({ length: 3 })).length).toBe(8);
    expect(plan(FIXTURES["3 of 4"], options({ length: 500 })).length).toBe(MAX_LENGTH);
  });

  it("drops look-alike characters when asked", () => {
    const pools = Object.values(plan(ANY_SITE, options({ avoidAmbiguous: true })).pools).join("");
    for (const ch of AMBIGUOUS) expect(pools).not.toContain(ch);
  });
});

describe("generate", () => {
  for (const [name, rules] of Object.entries(FIXTURES)) {
    it(`always passes the rules: ${name}`, () => {
      for (const opts of [options(), options({ off: ["symbol"] }), options({ off: ["upper", "digit"], length: 8 })]) {
        const p = plan(rules, opts);
        for (let i = 0; i < 300; i++) {
          const password = generate(p);
          expect(password).toHaveLength(p.length);
          expect(checkRules(rules, password).filter((c) => !c.pass)).toEqual([]);
          // Every switched-on class appears, and nothing outside the pools does.
          for (const [c, pool] of Object.entries(p.pools)) expect([...password].some((ch) => pool.includes(ch)), c).toBe(true);
          const allowed = Object.values(p.pools).join("");
          expect([...password].every((ch) => allowed.includes(ch))).toBe(true);
        }
      }
    });
  }

  it("respects the avoid-ambiguous option", () => {
    const p = plan(ANY_SITE, options({ length: 64, avoidAmbiguous: true }));
    for (let i = 0; i < 100; i++) for (const ch of generate(p)) expect(AMBIGUOUS).not.toContain(ch);
  });
});

describe("entropyBits", () => {
  // Count by brute force: every string over the pools that uses each pool at least once.
  function bruteForce(pools: string[], length: number): number {
    const chars = pools.join("");
    let count = 0;
    const total = chars.length ** length;
    for (let n = 0; n < total; n++) {
      let s = "";
      for (let i = 0, m = n; i < length; i++, m = Math.floor(m / chars.length)) s += chars[m % chars.length];
      if (pools.every((pool) => [...s].some((ch) => pool.includes(ch)))) count++;
    }
    return Math.log2(count);
  }

  it("matches brute-force counting on small pools", () => {
    const cases: [Partial<Record<CharClass, string>>, number][] = [
      [{ lower: "ab", digit: "1" }, 3],
      [{ lower: "abc", upper: "XY", digit: "7" }, 4],
      [{ lower: "ab", upper: "C", digit: "12", symbol: "!" }, 5],
    ];
    for (const [pools, length] of cases) {
      const p = { length, minLength: length, maxLength: length, pools, locked: [], unavailable: [] };
      expect(entropyBits(p)).toBeCloseTo(bruteForce(Object.values(pools) as string[], length), 10);
    }
  });

  it("is a little under length × log2(charset) because every class must appear", () => {
    const p = plan(ANY_SITE, options());
    const charset = Object.values(p.pools).join("").length;
    const naive = p.length * Math.log2(charset);
    expect(entropyBits(p)).toBeLessThan(naive);
    expect(entropyBits(p)).toBeGreaterThan(naive - 1);
  });

  it("log2BigInt is accurate past 2^53", () => {
    expect(log2BigInt(2n ** 200n)).toBeCloseTo(200, 10);
    expect(log2BigInt(3n ** 100n)).toBeCloseTo(100 * Math.log2(3), 8);
  });
});

describe("repeat limit", () => {
  it("never produces a run longer than the site allows", () => {
    const p = plan(FIXTURES["repeat limit"], options({ off: ["lower", "upper"] }));
    expect(Object.keys(p.pools)).toEqual(["digit"]);
    for (let i = 0; i < 500; i++) expect(longestRepeat(generate(p))).toBeLessThanOrEqual(2);
  });

  it("measures runs", () => {
    expect([longestRepeat(""), longestRepeat("abc"), longestRepeat("abbbc"), longestRepeat("aabb")]).toEqual([0, 1, 3, 2]);
  });
});

describe("checkRules", () => {
  it("labels rules in plain words", () => {
    const labels = checkRules(FIXTURES["letter and digit"], "abc12345").map((c) => c.label);
    expect(labels).toEqual(["At least 8 characters", "A letter", "A number"]);
    expect(checkRules(FIXTURES["8-20, all four"], "").map((c) => c.label)).toEqual([
      "8 to 20 characters",
      "A lowercase letter",
      "An uppercase letter",
      "A number",
      "A symbol",
      "Symbols only from !@#$%^&*",
    ]);
  });

  it("fails what is missing", () => {
    const failed = checkRules(FIXTURES["8-20, all four"], "abcdefgh~").filter((c) => !c.pass).map((c) => c.id);
    expect(failed).toEqual(["has-upper", "has-digit", "symbols"]);
  });

  it("classifies characters", () => {
    expect(["a", "Z", "5", "#", " "].map(classOf)).toEqual(["lower", "upper", "digit", "symbol", "symbol"]);
  });
});
