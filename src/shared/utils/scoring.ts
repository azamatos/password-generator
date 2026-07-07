import { DEFAULT_SCORING_PARAMS } from "../constants";
import { PasswordScore, ScoreLevel, ScoringParams } from "../types";

function getPoolSize(params: ScoringParams): number {
  let pool = 0;
  if (params.includeLowercase) pool += 26;
  if (params.includeUppercase) pool += 26;
  if (params.includeNumbers) pool += 10;
  if (params.includeSymbols) pool += 32;
  return pool || 26;
}

function applyPenalties(password: string, bits: number): number {
  let penalty = 0;
  if (/(.)\1{2,}/.test(password)) penalty += 10;
  if (/abcd|bcde|1234|2345|qwert/i.test(password)) penalty += 10;
  if (/^[A-Z][a-z]+\d{1,4}[^a-zA-Z0-9]?$/.test(password)) penalty += 15;
  return Math.max(0, bits - penalty);
}

export function scorePassword(password: string, params: ScoringParams = DEFAULT_SCORING_PARAMS): PasswordScore {
  if (!password) return { bits: 0, level: 0 };

  const raw = password.length * Math.log2(getPoolSize(params));
  const bits = Math.round(applyPenalties(password, raw));

  const level: ScoreLevel = bitsToBarCount(bits);

  return { bits, level };
}

// Maps entropy bits to a 0-5 segment bar count for the vault UI.
// Thresholds are calibrated so typical strong passwords (16+ chars, mixed) land at 4-5.
export function bitsToBarCount(bits: number): ScoreLevel {
  if (bits >= 128) return 4;
  if (bits >= 80) return 3;
  if (bits >= 40) return 2;
  if (bits >= 20) return 1;
  if (bits > 0) return 0;
  return 0;
}

// Maps entropy bits to a 0-5 segment bar count for the vault UI.
// Thresholds are calibrated so typical strong passwords (16+ chars, mixed) land at 4-5.
export function passwordScoreToColor(score: ScoreLevel): string {
  switch (score) {
    case 0:
      return "var(--danger)";
    case 1:
      return "var(--warn)";
    case 2:
      return "var(--warn)";
    case 3:
      return "var(--mint)";
    case 4:
      return "var(--mint)";
  }
}
