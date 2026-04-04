import type { Platform } from './platforms';

export interface GeneratorParams {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const DEFAULT_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';

// ─── Private helpers ──────────────────────────────────────────────────────────

function pickRandom(str: string): string {
  const index = crypto.getRandomValues(new Uint32Array(1))[0] % str.length;
  return str[index];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function filterForbidden(str: string, forbidden: string[]): string {
  if (forbidden.length === 0) return str;
  return str
    .split('')
    .filter((c) => !forbidden.includes(c))
    .join('');
}

function buildCharset(platform: Platform, params: GeneratorParams): string {
  const symbolPool = platform.allowedSpecialChars ?? DEFAULT_SYMBOLS;

  let charset = '';
  if (params.includeUppercase) charset += filterForbidden(UPPERCASE, platform.forbiddenChars);
  if (params.includeLowercase) charset += filterForbidden(LOWERCASE, platform.forbiddenChars);
  if (params.includeNumbers) charset += filterForbidden(NUMBERS, platform.forbiddenChars);
  if (params.includeSymbols) charset += filterForbidden(symbolPool, platform.forbiddenChars);

  return charset;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generatePassword(platform: Platform, params: GeneratorParams): string {
  const charset = buildCharset(platform, params);
  if (charset.length === 0) {
    throw new Error('No valid characters available for this configuration');
  }

  const clampedLength = Math.max(
    platform.minLength,
    platform.maxLength !== null ? Math.min(params.length, platform.maxLength) : params.length,
  );

  const symbolPool = platform.allowedSpecialChars ?? DEFAULT_SYMBOLS;
  const filteredSymbols = filterForbidden(symbolPool, platform.forbiddenChars);
  const filteredUpper = filterForbidden(UPPERCASE, platform.forbiddenChars);
  const filteredLower = filterForbidden(LOWERCASE, platform.forbiddenChars);
  const filteredNumbers = filterForbidden(NUMBERS, platform.forbiddenChars);

  // Collect guaranteed characters for each required type
  const guaranteed: string[] = [];

  if (platform.requiresUppercase && params.includeUppercase && filteredUpper.length > 0) {
    guaranteed.push(pickRandom(filteredUpper));
  }
  if (platform.requiresLowercase && params.includeLowercase && filteredLower.length > 0) {
    guaranteed.push(pickRandom(filteredLower));
  }
  if (platform.requiresNumber && params.includeNumbers && filteredNumbers.length > 0) {
    guaranteed.push(pickRandom(filteredNumbers));
  }
  if (platform.requiresSpecial && params.includeSymbols && filteredSymbols.length > 0) {
    guaranteed.push(pickRandom(filteredSymbols));
  }

  // If we can't fit guarantees, fall back to filling from charset only
  const useGuaranteed = guaranteed.length <= clampedLength;
  const fillLength = useGuaranteed ? clampedLength - guaranteed.length : clampedLength;
  const base = useGuaranteed ? guaranteed : [];

  const filled = Array.from({ length: fillLength }, () => pickRandom(charset));

  return shuffle([...base, ...filled]).join('');
}
