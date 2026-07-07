import { zxcvbn } from "zxcvbn-ts";
import type { BreachResult } from "./hibp";
import { ScoreLevel } from "../types";

export interface CheckItem {
  id: string;
  label: string;
  detail: string;
  status: "pass" | "warn" | "fail";
}

export interface StrengthResult {
  /** 0–100 numeric score */
  score: number;
  level: ScoreLevel;
  /** e.g. "3 hours", "centuries" */
  crackTime: string;
  checks: CheckItem[];
  /** zxcvbn warning string, if any */
  warning: string | null;
}

const SCORE_MAP: Record<ScoreLevel, number> = {
  0: 5,
  1: 25,
  2: 50,
  3: 75,
  4: 95,
};

/**
 * Analyse a password locally using zxcvbn-ts and combine with an optional
 * pre-fetched HIBP breach result.
 *
 * `breach` is optional so callers can show instant local results before the
 * async HIBP fetch completes, then re-call with breach data to update.
 */
export function analysePassword(password: string, breach?: BreachResult): StrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 0,
      crackTime: "instant",
      checks: [],
      warning: null,
    };
  }

  const result = zxcvbn(password);
  const zScore = result.score as ScoreLevel;

  // --- length check ---
  const lengthCheck: CheckItem = {
    id: "length",
    label: `${password.length} characters`,
    detail: `min 8`,
    status: password.length >= 16 ? "pass" : password.length >= 8 ? "pass" : "fail",
  };

  // --- variety check (uppercase + lowercase + symbol or number) ---
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const varietyParts: string[] = [];
  if (hasLower) varietyParts.push("a-z");
  if (hasUpper) varietyParts.push("A-Z");
  if (hasDigit) varietyParts.push("0-9");
  if (hasSymbol) varietyParts.push("!");
  const goodVariety = (hasUpper || hasLower) && (hasDigit || hasSymbol);
  const varietyCheck: CheckItem = {
    id: "variety",
    label: goodVariety ? "Mixed case + symbol" : "Low character variety",
    detail: varietyParts.join(" ") || "letters only",
    status: goodVariety ? "pass" : "warn",
  };

  // --- dictionary / pattern check ---
  const dictMatch = result.sequence?.find((s) => s.pattern === "dictionary" && s.token && s.token.length >= 4);
  const patternCheck: CheckItem | null = dictMatch
    ? {
        id: "pattern",
        label: "Contains a dictionary word",
        detail: `"${dictMatch.token}" – ${dictMatch.token.length} chars`,
        status: "warn",
      }
    : null;

  // --- breach check ---
  let breachCheck: CheckItem | null = null;
  let breachPenalty = 0;
  if (breach) {
    if (breach.breached) {
      const lastSeen = new Date().getFullYear(); // HIBP doesn't return year — omit or approximate
      breachCheck = {
        id: "breach",
        label: `Found in ${breach.count.toLocaleString()} known breach${breach.count === 1 ? "" : "es"}`,
        detail: breach.count > 1000 ? "replace immediately" : "last seen ~" + lastSeen,
        status: "warn",
      };
      breachPenalty = breach.count > 10000 ? 30 : breach.count > 100 ? 20 : 10;
    } else {
      breachCheck = {
        id: "breach",
        label: "Not found in known breaches",
        detail: "checked via HIBP k-anon",
        status: "pass",
      };
    }
  }

  // --- final score (0–100) with penalties ---
  let numericScore = SCORE_MAP[zScore];
  if (dictMatch) numericScore = Math.max(0, numericScore - 10);
  if (breachPenalty) numericScore = Math.max(0, numericScore - breachPenalty);
  numericScore = Math.min(100, numericScore);

  // Reclassify level after penalties
  let level: ScoreLevel = zScore;
  if (numericScore <= 10) level = 0;
  else if (numericScore <= 30) level = 1;
  else if (numericScore <= 55) level = 2;
  else if (numericScore <= 80) level = 3;
  else level = 4;

  const checks: CheckItem[] = [
    lengthCheck,
    varietyCheck,
    ...(patternCheck ? [patternCheck] : []),
    ...(breachCheck ? [breachCheck] : []),
  ];

  return {
    score: numericScore,
    level,
    crackTime: result.crack_times_display?.online_no_throttling_10_per_second ?? "unknown",
    checks,
    warning: result.feedback?.warning || null,
  };
}
