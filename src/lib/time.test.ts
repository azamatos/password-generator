import { describe, expect, it } from "vitest";
import { humanizeSeconds } from "./time";

describe("humanizeSeconds", () => {
  it("reads naturally", () => {
    expect(humanizeSeconds(0.2)).toBe("less than a second");
    expect(humanizeSeconds(1)).toBe("1 second");
    expect(humanizeSeconds(3 * 3600)).toBe("3 hours");
    expect(humanizeSeconds(40 * 86400)).toBe("1 month");
    expect(humanizeSeconds(5 * 365.25 * 86400)).toBe("5 years");
    expect(humanizeSeconds(2.1e6 * 365.25 * 86400)).toBe("about 2 million years");
    expect(humanizeSeconds(1e30)).toBe("longer than the universe has existed");
  });

  it("moves to the next unit instead of rounding up to its size", () => {
    expect(humanizeSeconds(59.6)).toBe("1 minute");
    expect(humanizeSeconds(23.7 * 3600)).toBe("1 day");
    expect(humanizeSeconds(999.6 * 365.25 * 86400)).toBe("about 1 thousand years");
    expect(humanizeSeconds(999_600 * 365.25 * 86400)).toBe("about 1 million years");
  });
});
