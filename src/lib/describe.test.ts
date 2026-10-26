import { describe, expect, it } from "vitest";
import { platforms } from "@/data/platforms";
import { bannerTags, classNote, monthYear, ruleTags, shareTags, shortSummary } from "./describe";

const byId = Object.fromEntries(platforms.map((p) => [p.id, p]));

describe("shortSummary", () => {
  it("matches the original list style", () => {
    expect(shortSummary(byId.github.rules)).toBe("Min 8 · a9");
    expect(shortSummary(byId.apple.rules)).toBe("8–63 · Aa9");
    expect(shortSummary(byId.paypal.rules)).toBe("8–20 · A/a + 9/!");
    expect(shortSummary(byId.microsoft.rules)).toBe("8–127 · 2 of 4");
    expect(shortSummary(byId.instagram.rules)).toBe("Min 6 · Any");
  });
});

describe("ruleTags", () => {
  it("keeps tags short", () => {
    expect(ruleTags(byId.netflix.rules)).toEqual(["6 to 60 characters", "No ~"]);
    expect(ruleTags(byId.google.rules)).toEqual(["At least 8 characters", "Any characters"]);
    expect(ruleTags(byId.apple.rules)).toContain("No character 3× in a row");
  });
});

describe("classNote", () => {
  const p = { locked: ["digit" as const], unavailable: ["upper" as const] };

  it("says why a tile can't be switched, or which symbols the site takes", () => {
    expect(classNote("digit", p, byId.github.rules)).toBe("Required");
    expect(classNote("upper", p, byId.github.rules)).toBe("Not allowed");
    expect(classNote("lower", p, byId.github.rules)).toBe("");
    expect(classNote("symbol", p, byId.tiktok.rules)).toBe("Only !#$%&@");
    expect(classNote("symbol", p, byId.spotify.rules)).toBe("No #");
    expect(classNote("symbol", p, byId.github.rules)).toBe("");
  });
});

describe("bannerTags", () => {
  it("goes from the length to the details", () => {
    expect(bannerTags(byId.github.rules)).toEqual(["8+ characters", "Lowercase", "Number"]);
    expect(bannerTags(byId.paypal.rules)).toEqual([
      "8–20 characters",
      "Letter",
      "Number or symbol",
      "No 4 in a row",
      "Symbols !@#$%^&*()",
    ]);
    expect(bannerTags(byId.microsoft.rules)).toEqual(["8–127 characters", "2 of 4 types"]);
    expect(bannerTags(byId.netflix.rules)).toEqual(["6–60 characters", "No ~"]);
    expect(bannerTags(byId.google.rules)).toEqual(["8+ characters", "Any characters", "Spaces OK"]);
  });
});

describe("monthYear", () => {
  it("names the month", () => {
    expect(monthYear("2026-10")).toBe("Oct 2026");
    expect(monthYear("2027-01")).toBe("Jan 2027");
  });
});

describe("shareTags", () => {
  it("fits the rules in three tags at most", () => {
    expect(shareTags(byId.paypal.rules)).toEqual(["8–20 characters", "Letter", "Number or symbol"]);
    expect(shareTags(byId.apple.rules)).toEqual(["8–63 characters", "Lower, upper, number"]);
    expect(shareTags(byId.microsoft.rules)).toEqual(["8–127 characters", "2 of 4 types"]);
    expect(shareTags(byId.instagram.rules)).toEqual(["6+ characters", "Any characters"]);
  });
});
