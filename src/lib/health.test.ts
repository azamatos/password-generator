import { describe, expect, it } from "vitest";
import { countIn, sha1Hex } from "./hibp";
import { humanizeSeconds } from "./time";

describe("Have I Been Pwned helpers", () => {
  it("hashes like the API expects", async () => {
    // SHA-1 of "password", a well-known test vector.
    expect(await sha1Hex("password")).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  it("finds the suffix and ignores padding", () => {
    const body = "0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004\r\nAAAAA:0\r\n";
    expect(countIn(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8")).toBe(10434004);
    expect(countIn(body, "AAAAA")).toBe(0);
    expect(countIn(body, "FFFFF")).toBe(0);
  });
});

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
});
