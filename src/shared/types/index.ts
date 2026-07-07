export interface GeneratorParams {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export type RequirementSection = "length" | "complexity";

export interface Requirement {
  id: string;
  label: string;
  section: RequirementSection;
  required: boolean;
  test: (password: string) => boolean;
}

export interface Platform {
  id: string;
  name: string;
  short?: string;
  icon: string;
  summary: string;
  description: string;
  tips: string[];
  minLength: number;
  maxLength: number | null;
  forbiddenChars: string[];
  allowedSpecialChars: string | null;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSpecial: boolean;
  defaultLength: number;
  requirements: Requirement[];
}

export type ScoreLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordScore {
  bits: number;
  level: ScoreLevel;
}

export interface ScoringParams {
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}
