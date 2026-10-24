import { describe, expect, it } from "vitest";
import { countIn, sha1Hex } from "./hibp";

describe("Have I Been Pwned helpers", () => {
  it("hashes like the API expects", async () => {
    // SHA-1 of "password", a well-known test vector.
    expect(await sha1Hex("password")).toBe("5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8");
  });

  const padding = "A".repeat(35);

  it("finds the suffix and ignores padding", () => {
    const body = `0018A45C4D1DEF81644B54AB7F969B88D65:1\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:10434004\r\n${padding}:0\r\n`;
    expect(countIn(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8")).toBe(10434004);
    expect(countIn(body, padding)).toBe(0);
    expect(countIn(body, "F".repeat(35))).toBe(0);
  });

  it("refuses an answer that isn't a range response, such as a Wi-Fi sign-in page", () => {
    expect(() => countIn("<!doctype html><title>Sign in to Wi-Fi</title>", "F".repeat(35))).toThrow();
    expect(() => countIn("", "F".repeat(35))).toThrow();
  });
});
