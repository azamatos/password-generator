export type RequirementSection = 'length' | 'complexity';

export interface Requirement {
  id: string;
  label: string;
  section: RequirementSection;
  test: (password: string) => boolean;
}

export interface Platform {
  id: string;
  name: string;
  /** Path to icon in /public/icons/, e.g. "instagram.svg" */
  icon: string;
  /** Short constraint summary shown under platform card, e.g. "Min 6 chars · Any" */
  summary: string;
  /** SEO-friendly description for the /[platform] page meta tag */
  description: string;

  // ── Hard constraints (enforced by the platform) ──────────────────────────
  minLength: number;
  /** null = no documented maximum */
  maxLength: number | null;

  /** Characters the platform explicitly forbids in passwords */
  forbiddenChars: string[];

  /** If set, only these special chars are allowed (null = all allowed) */
  allowedSpecialChars: string | null;

  // ── Requirements (what must be present) ─────────────────────────────────
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSpecial: boolean;

  // ── Generator hints ──────────────────────────────────────────────────────
  /** Recommended default generation length for this platform */
  defaultLength: number;

  // ── Display ──────────────────────────────────────────────────────────────
  /** Ordered list of requirements shown in the requirements panel */
  requirements: Requirement[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const hasUppercase = (p: string) => /[A-Z]/.test(p);
const hasLowercase = (p: string) => /[a-z]/.test(p);
const hasNumber = (p: string) => /[0-9]/.test(p);
const hasSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);
const noSpaces = (p: string) => !p.includes(' ');
const minLen = (n: number) => (p: string) => p.length >= n;
const maxLen = (n: number) => (p: string) => p.length <= n;

// ─── Platforms ───────────────────────────────────────────────────────────────

export const platforms: Platform[] = [
  // ── Instagram ──────────────────────────────────────────────────────────────
  // Source: instagram.com signup (tested).
  // Enforced minimum is 6 — most third-party articles incorrectly say 8.
  // No mandatory character types.
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'instagram.svg',
    summary: 'Min 6 chars · Any',
    description:
      'Generate a secure password for Instagram. Instagram requires at least 6 characters with no mandatory character type restrictions.',
    minLength: 6,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'ig-len', label: 'At least 6 characters', section: 'length', test: minLen(6) },
      {
        id: 'ig-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'ig-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
      {
        id: 'ig-special',
        label: 'One special character (recommended)',
        section: 'complexity',
        test: hasSpecial,
      },
    ],
  },

  // ── Google ─────────────────────────────────────────────────────────────────
  // Source: accounts.google.com signup (tested).
  // Enforced: 8–100 characters. No character type restrictions.
  {
    id: 'google',
    name: 'Google',
    icon: 'google.svg',
    summary: '8–100 chars · Any',
    description:
      'Generate a secure password for your Google account. Google requires 8 to 100 characters and accepts any mix of letters, numbers, and symbols.',

    minLength: 8,
    maxLength: 100,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 20,

    requirements: [
      { id: 'g-len-min', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'g-len-max',
        label: 'No more than 100 characters',
        section: 'length',
        test: maxLen(100),
      },
      {
        id: 'g-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      { id: 'g-number', label: 'One number (recommended)', section: 'complexity', test: hasNumber },
    ],
  },

  // ── Apple ──────────────────────────────────────────────────────────────────
  // Source: appleid.apple.com (tested).
  // Enforced: 8+ chars, must contain uppercase, lowercase, and a number.
  // Spaces are not allowed. No documented maximum.
  {
    id: 'apple',
    name: 'Apple',
    icon: 'apple.svg',
    summary: 'Min 8 chars · Upper + lower + number',
    description:
      'Generate a password for your Apple ID. Apple requires at least 8 characters including an uppercase letter, a lowercase letter, and a number.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [' '],
    allowedSpecialChars: null,

    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 18,

    requirements: [
      { id: 'ap-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'ap-upper', label: 'One uppercase letter', section: 'complexity', test: hasUppercase },
      { id: 'ap-lower', label: 'One lowercase letter', section: 'complexity', test: hasLowercase },
      { id: 'ap-number', label: 'One number', section: 'complexity', test: hasNumber },
      { id: 'ap-nospace', label: 'No spaces', section: 'complexity', test: noSpaces },
    ],
  },

  // ── Microsoft ──────────────────────────────────────────────────────────────
  // Source: account.microsoft.com (tested) + Microsoft support docs.
  // Enforced: 8–256 chars. Must include characters from at least 3 of:
  //   uppercase, lowercase, numbers, symbols.
  // Generator satisfies this by always guaranteeing uppercase + lowercase + number (3 categories).
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: 'microsoft.svg',
    summary: '8–256 chars · 3 of 4 types',
    description:
      'Generate a password for your Microsoft account. Microsoft requires 8 to 256 characters from at least 3 character categories: uppercase, lowercase, numbers, and symbols.',

    minLength: 8,
    maxLength: 256,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 20,

    requirements: [
      { id: 'ms-len-min', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'ms-len-max',
        label: 'No more than 256 characters',
        section: 'length',
        test: maxLen(256),
      },
      { id: 'ms-upper', label: 'One uppercase letter', section: 'complexity', test: hasUppercase },
      { id: 'ms-lower', label: 'One lowercase letter', section: 'complexity', test: hasLowercase },
      { id: 'ms-number', label: 'One number', section: 'complexity', test: hasNumber },
      {
        id: 'ms-3of4',
        label: 'At least 3 character types used',
        section: 'complexity',
        test: (p) =>
          [hasUppercase(p), hasLowercase(p), hasNumber(p), hasSpecial(p)].filter(Boolean).length >=
          3,
      },
    ],
  },

  // ── GitHub ─────────────────────────────────────────────────────────────────
  // Source: github.com signup + docs.github.com/en/authentication.
  // Two valid modes:
  //   A) 8+ chars with a number AND a lowercase letter
  //   B) 15+ chars with any combination
  // Generator defaults to mode A (most constrained).
  // GitHub also checks HaveIBeenPwned — informational only on our side.
  {
    id: 'github',
    name: 'GitHub',
    icon: 'github.svg',
    summary: 'Min 8 chars · Number + lowercase',
    description:
      "Generate a password that meets GitHub's requirements: at least 8 characters including a number and a lowercase letter, or 15+ characters of any combination.",

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'gh-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'gh-lower', label: 'One lowercase letter', section: 'complexity', test: hasLowercase },
      { id: 'gh-number', label: 'One number', section: 'complexity', test: hasNumber },
      {
        id: 'gh-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
    ],
  },

  // ── Amazon ─────────────────────────────────────────────────────────────────
  // Source: amazon.com account creation (tested).
  // Enforced: 6–1024 characters. No mandatory character types on consumer accounts.
  // Spaces are not allowed.
  {
    id: 'amazon',
    name: 'Amazon',
    icon: 'amazon.svg',
    summary: 'Min 6 chars · No spaces',
    description:
      'Generate a secure password for your Amazon account. Amazon requires at least 6 characters and does not allow spaces.',

    minLength: 6,
    maxLength: 1024,
    forbiddenChars: [' '],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'amz-len', label: 'At least 6 characters', section: 'length', test: minLen(6) },
      { id: 'amz-nospace', label: 'No spaces', section: 'complexity', test: noSpaces },
      {
        id: 'amz-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'amz-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  // Source: twitter.com / x.com signup (tested).
  // Enforced: 8+ characters. No mandatory character types. No spaces.
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: 'twitter.svg',
    summary: 'Min 8 chars · No spaces',
    description:
      'Generate a secure password for your Twitter / X account. Twitter requires at least 8 characters with no spaces.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [' '],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'tw-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'tw-nospace', label: 'No spaces', section: 'complexity', test: noSpaces },
      {
        id: 'tw-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'tw-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
    ],
  },

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  // Source: linkedin.com signup (tested).
  // Enforced: 6+ characters. LinkedIn recommends mixing types but does not
  // hard-enforce character categories on the signup form.
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'linkedin.svg',
    summary: 'Min 6 chars · Any',
    description:
      'Generate a secure password for LinkedIn. LinkedIn requires at least 6 characters.',

    minLength: 6,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'li-len', label: 'At least 6 characters', section: 'length', test: minLen(6) },
      {
        id: 'li-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'li-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
      {
        id: 'li-special',
        label: 'One special character (recommended)',
        section: 'complexity',
        test: hasSpecial,
      },
    ],
  },

  // ── Spotify ────────────────────────────────────────────────────────────────
  // Source: spotify.com signup (tested).
  // Enforced: 8+ characters. Spaces not allowed. No mandatory character types.
  {
    id: 'spotify',
    name: 'Spotify',
    icon: 'spotify.svg',
    summary: 'Min 8 chars · No spaces',
    description:
      'Generate a secure password for Spotify. Spotify requires at least 8 characters and does not allow spaces.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [' '],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'sp-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'sp-nospace', label: 'No spaces', section: 'complexity', test: noSpaces },
      {
        id: 'sp-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'sp-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
    ],
  },

  // ── Reddit ─────────────────────────────────────────────────────────────────
  // Source: reddit.com signup (tested).
  // Enforced: 8+ characters. No mandatory character types.
  // Reddit checks against common passwords — rely on zxcvbn for signal.
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'reddit.svg',
    summary: 'Min 8 chars · Any',
    description:
      'Generate a secure password for Reddit. Reddit requires at least 8 characters and rejects commonly used passwords.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'rd-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'rd-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'rd-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
      {
        id: 'rd-special',
        label: 'One special character (recommended)',
        section: 'complexity',
        test: hasSpecial,
      },
    ],
  },

  // ── TikTok ─────────────────────────────────────────────────────────────────
  // Source: tiktok.com signup (tested).
  // Enforced: 8–20 characters. Must contain both letters and numbers.
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'tiktok.svg',
    summary: '8–20 chars · Letters + numbers',
    description:
      'Generate a password for TikTok. TikTok requires 8 to 20 characters and must include both letters and numbers.',

    minLength: 8,
    maxLength: 20,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'tt-len-min', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'tt-len-max',
        label: 'No more than 20 characters',
        section: 'length',
        test: maxLen(20),
      },
      { id: 'tt-letter', label: 'One letter', section: 'complexity', test: hasLowercase },
      { id: 'tt-number', label: 'One number', section: 'complexity', test: hasNumber },
    ],
  },

  // ── PayPal ─────────────────────────────────────────────────────────────────
  // Source: paypal.com signup (tested) + PayPal help center.
  // Enforced: 8–20 characters. Must contain both letters and numbers. No spaces.
  {
    id: 'paypal',
    name: 'PayPal',
    icon: 'paypal.svg',
    summary: '8–20 chars · Letters + numbers',
    description:
      'Generate a password for PayPal. PayPal requires 8 to 20 characters containing both letters and numbers, with no spaces.',

    minLength: 8,
    maxLength: 20,
    forbiddenChars: [' '],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'pp-len-min', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'pp-len-max',
        label: 'No more than 20 characters',
        section: 'length',
        test: maxLen(20),
      },
      { id: 'pp-letter', label: 'One letter', section: 'complexity', test: hasLowercase },
      { id: 'pp-number', label: 'One number', section: 'complexity', test: hasNumber },
      { id: 'pp-nospace', label: 'No spaces', section: 'complexity', test: noSpaces },
    ],
  },

  // ── Facebook ───────────────────────────────────────────────────────────────
  // Source: facebook.com signup (tested).
  // Enforced: 6+ characters. No mandatory character types.
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook.svg',
    summary: 'Min 6 chars · Any',
    description:
      'Generate a secure password for Facebook. Facebook requires at least 6 characters with no mandatory character type restrictions.',

    minLength: 6,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'fb-len', label: 'At least 6 characters', section: 'length', test: minLen(6) },
      {
        id: 'fb-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'fb-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
      {
        id: 'fb-special',
        label: 'One special character (recommended)',
        section: 'complexity',
        test: hasSpecial,
      },
    ],
  },

  // ── Netflix ────────────────────────────────────────────────────────────────
  // Source: netflix.com signup (tested).
  // Enforced: 6–60 characters. No mandatory character types.
  {
    id: 'netflix',
    name: 'Netflix',
    icon: 'netflix.svg',
    summary: '6–60 chars · Any',
    description:
      'Generate a secure password for Netflix. Netflix requires 6 to 60 characters with no mandatory character type restrictions.',

    minLength: 6,
    maxLength: 60,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'nf-len-min', label: 'At least 6 characters', section: 'length', test: minLen(6) },
      { id: 'nf-len-max', label: 'No more than 60 characters', section: 'length', test: maxLen(60) },
      {
        id: 'nf-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'nf-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
    ],
  },

  // ── Shopify ────────────────────────────────────────────────────────────────
  // Source: accounts.shopify.com signup (tested).
  // Enforced: 8+ characters. No mandatory character types beyond length.
  {
    id: 'shopify',
    name: 'Shopify',
    icon: 'shopify.svg',
    summary: 'Min 8 chars · Any',
    description:
      'Generate a secure password for Shopify. Shopify requires at least 8 characters.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'sh-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'sh-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
      {
        id: 'sh-number',
        label: 'One number (recommended)',
        section: 'complexity',
        test: hasNumber,
      },
      {
        id: 'sh-special',
        label: 'One special character (recommended)',
        section: 'complexity',
        test: hasSpecial,
      },
    ],
  },

  /*
  // ── Discord ─────────────────────────────────────────────────────────────────
  // Source: discord.com signup (tested).
  // The 72-char max is a real bcrypt truncation limit — passwords beyond 72 bytes
  // are silently ignored. Most generators miss this entirely.
  {
    id: 'discord',
    name: 'Discord',
    icon: 'discord.svg',
    summary: '8–72 chars · Any',
    description:
      'Generate a secure password for Discord. Discord requires 8 to 72 characters. The 72-character limit is a hard bcrypt boundary — anything beyond it is silently ignored.',

    minLength: 8,
    maxLength: 72,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 20,

    requirements: [
      { id: 'dc-len-min', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      {
        id: 'dc-len-max',
        label: 'No more than 72 characters (bcrypt limit)',
        section: 'length',
        test: maxLen(72),
      },
      { id: 'dc-upper', label: 'One uppercase letter (recommended)', section: 'complexity', test: hasUppercase },
      { id: 'dc-number', label: 'One number (recommended)', section: 'complexity', test: hasNumber },
    ],
  },

  // ── Adobe ──────────────────────────────────────────────────────────────────
  // Source: account.adobe.com signup (tested).
  // Enforced: 8+ characters. Must include uppercase, lowercase, and a number.
  {
    id: 'adobe',
    name: 'Adobe',
    icon: 'adobe.svg',
    summary: 'Min 8 chars · Upper + lower + number',
    description:
      'Generate a password for Adobe. Adobe requires at least 8 characters including an uppercase letter, a lowercase letter, and a number.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 18,

    requirements: [
      { id: 'ab-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'ab-upper', label: 'One uppercase letter', section: 'complexity', test: hasUppercase },
      { id: 'ab-lower', label: 'One lowercase letter', section: 'complexity', test: hasLowercase },
      { id: 'ab-number', label: 'One number', section: 'complexity', test: hasNumber },
    ],
  },
  */

  // ── Steam ──────────────────────────────────────────────────────────────────
  // Source: store.steampowered.com account creation (tested).
  // Enforced: 8+ characters. Must contain both letters and numbers.
  {
    id: 'steam',
    name: 'Steam',
    icon: 'steam.svg',
    summary: 'Min 8 chars · Letters + numbers',
    description:
      'Generate a password for Steam. Steam requires at least 8 characters and must include both letters and numbers.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'st-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'st-letter', label: 'One letter', section: 'complexity', test: hasLowercase },
      { id: 'st-number', label: 'One number', section: 'complexity', test: hasNumber },
      {
        id: 'st-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
    ],
  },

  // ── Twitch ─────────────────────────────────────────────────────────────────
  // Source: twitch.tv signup (tested).
  // Enforced: 8+ characters. Must include at least one letter and one number.
  {
    id: 'twitch',
    name: 'Twitch',
    icon: 'twitch.svg',
    summary: 'Min 8 chars · Letters + numbers',
    description:
      'Generate a password for Twitch. Twitch requires at least 8 characters including at least one letter and one number.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'tv-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'tv-letter', label: 'One letter', section: 'complexity', test: hasLowercase },
      { id: 'tv-number', label: 'One number', section: 'complexity', test: hasNumber },
      {
        id: 'tv-upper',
        label: 'One uppercase letter (recommended)',
        section: 'complexity',
        test: hasUppercase,
      },
    ],
  },

  /*
  // ── Coinbase ───────────────────────────────────────────────────────────────
  // Source: coinbase.com signup (tested).
  // Enforced: 8+ characters. Requires uppercase, lowercase, number, and special character.
  {
    id: 'coinbase',
    name: 'Coinbase',
    icon: 'coinbase.svg',
    summary: 'Min 8 chars · Upper + lower + number + special',
    description:
      'Generate a strong password for Coinbase. Coinbase requires at least 8 characters including uppercase, lowercase, a number, and a special character.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: true,

    defaultLength: 20,

    requirements: [
      { id: 'cb-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
      { id: 'cb-upper', label: 'One uppercase letter', section: 'complexity', test: hasUppercase },
      { id: 'cb-lower', label: 'One lowercase letter', section: 'complexity', test: hasLowercase },
      { id: 'cb-number', label: 'One number', section: 'complexity', test: hasNumber },
      { id: 'cb-special', label: 'One special character', section: 'complexity', test: hasSpecial },
    ],
  },

  // ── Custom ──────────────────────────────────────────────────────────────────
  // User-defined rules. Permissive defaults.
  // All params are exposed in the generator UI when this is selected.
  {
    id: 'custom',
    name: 'Custom',
    icon: 'custom.svg',
    summary: 'Your own rules',
    description:
      'Define your own password rules. Set the length and choose which character types to include.',

    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,

    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,

    defaultLength: 16,

    requirements: [
      { id: 'cu-len', label: 'At least 8 characters', section: 'length', test: minLen(8) },
    ],
  },
  */
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getPlatformById(id: string): Platform | null {
  return platforms.find((p) => p.id === id) ?? null;
}

export function getAllPlatformIds(): string[] {
  return platforms.map((p) => p.id);
}
