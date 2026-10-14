import { clamp } from "./math";

type Tone = "weak" | "fair" | "good";

/** What the five-bar strength meter shows, on the site and in share images. */
export interface Meter {
  label: "Very weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  /** 1 to 5 filled bars. */
  bars: number;
  tone: Tone;
}

/**
 * For a generated password, whose strength is known exactly in bits: a bar per 20 bits. At 10 billion
 * guesses a second, 60 bits holds about 1.8 years on average and 80 bits about 2 million years.
 */
export function meterForBits(bits: number): Meter {
  const bars = clamp(Math.ceil(bits / 20), 1, 5);
  if (bits >= 80) return { label: "Very strong", bars, tone: "good" };
  if (bits >= 60) return { label: "Strong", bars, tone: "good" };
  if (bits >= 40) return { label: "Fair", bars, tone: "fair" };
  return { label: "Weak", bars, tone: "weak" };
}

const SCORES: Omit<Meter, "bars">[] = [
  { label: "Very weak", tone: "weak" },
  { label: "Weak", tone: "weak" },
  { label: "Fair", tone: "fair" },
  { label: "Strong", tone: "good" },
  { label: "Very strong", tone: "good" },
];

/** For a typed password, from zxcvbn's 0–4 score: one bar per point, plus one. */
export function meterForScore(score: 0 | 1 | 2 | 3 | 4): Meter {
  return { ...SCORES[score], bars: score + 1 };
}
