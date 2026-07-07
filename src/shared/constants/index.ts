import { GeneratorParams, ScoringParams } from "../types";

const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 36;

const DEFAULT_GENERATOR_PARAMS: GeneratorParams = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

const DEFAULT_SCORING_PARAMS: ScoringParams = {
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#d96f5f",
  google: "#c79b6e",
  apple: "#8a8d99",
  microsoft: "#6a8eb8",
  github: "#5a4f6e",
  amazon: "#c79b2e",
  twitter: "#6a8eb8",
  linkedin: "#4a6e8a",
  spotify: "#4e8a6a",
  reddit: "#d96f5f",
  tiktok: "#2a2d44",
  paypal: "#4a6e8a",
  facebook: "#5b6fa8",
  netflix: "#c0392b",
  shopify: "#5a8a4e",
  steam: "#4a6e8a",
  twitch: "#7b5ea7",
};

export { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PLATFORM_COLORS, DEFAULT_GENERATOR_PARAMS, DEFAULT_SCORING_PARAMS };
