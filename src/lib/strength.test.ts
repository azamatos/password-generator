import { describe, expect, it } from "vitest";
import { meterForBits, meterForScore } from "./strength";

describe("meterForBits", () => {
  it("fills a bar per 20 bits and names the strength", () => {
    expect(meterForBits(103)).toEqual({ label: "Very strong", bars: 5, tone: "good" });
    expect(meterForBits(64)).toEqual({ label: "Strong", bars: 4, tone: "good" });
    expect(meterForBits(45)).toEqual({ label: "Fair", bars: 3, tone: "fair" });
    expect(meterForBits(5)).toEqual({ label: "Weak", bars: 1, tone: "weak" });
  });
});

describe("meterForScore", () => {
  it("maps zxcvbn's 0–4 to 1–5 bars", () => {
    expect(meterForScore(0)).toEqual({ label: "Very weak", bars: 1, tone: "weak" });
    expect(meterForScore(2)).toEqual({ label: "Fair", bars: 3, tone: "fair" });
    expect(meterForScore(4)).toEqual({ label: "Very strong", bars: 5, tone: "good" });
  });
});
