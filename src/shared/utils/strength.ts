import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import type { BreachResult } from "./hibp";
import { ScoreLevel } from "../types";

export interface CheckItem {
  id: string;
  label: string;
  detail: string;
  status: "pass" | "warn" | "fail";
}

export interface StrengthResult {
  score: number;
  level: ScoreLevel;
  crackTime: string;
  checks: CheckItem[];
  warning: string | null;
}

const SCORE_MAP: Record<ScoreLevel, number> = {
  0: 5,
  1: 25,
  2: 50,
  3: 75,
  4: 95,
};

// Instantiate once at module load — plain JS dictionary/graph objects,
// fully browser-bundle-safe (no fs, no eval, no Node-only imports).
const zxcvbnInstance = new ZxcvbnFactory({
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
});

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

  const result = zxcvbnInstance.check(password);
  const zScore = result.score as ScoreLevel;

  const lengthCheck: CheckItem = {
    id: "length",
    label: `${password.length} characters`,
    detail: `min 8`,
    status: password.length >= 8 ? "pass" : "fail",
  };

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

  const dictMatch = result.sequence?.find(
    (s): s is typeof s & { token: string } => s.pattern === "dictionary" && !!s.token && s.token.length >= 4,
  );
  const patternCheck: CheckItem | null = dictMatch
    ? {
        id: "pattern",
        label: "Contains a dictionary word",
        detail: `"${dictMatch.token}" – ${dictMatch.token.length} chars`,
        status: "warn",
      }
    : null;

  let breachCheck: CheckItem | null = null;
  let breachPenalty = 0;
  if (breach) {
    if (breach.breached) {
      const lastSeen = new Date().getFullYear();
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

  let numericScore = SCORE_MAP[zScore];
  if (dictMatch) numericScore = Math.max(0, numericScore - 10);
  if (breachPenalty) numericScore = Math.max(0, numericScore - breachPenalty);
  numericScore = Math.min(100, numericScore);

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
    crackTime: result.crackTimes?.onlineNoThrottlingXPerSecond?.display ?? "unknown",
    checks,
    warning: result.feedback?.warning || null,
  };
}
