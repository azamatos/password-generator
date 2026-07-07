// ─── Helpers ─────────────────────────────────────────────────────────────────

import { Platform } from "../types";

const hasUppercase = (p: string) => /[A-Z]/.test(p);
const hasLowercase = (p: string) => /[a-z]/.test(p);
const hasNumber = (p: string) => /[0-9]/.test(p);
const hasSpecial = (p: string) => /[^A-Za-z0-9]/.test(p);
const noSpaces = (p: string) => !p.includes(" ");
const minLen = (n: number) => (p: string) => p.length >= n;
const maxLen = (n: number) => (p: string) => p.length <= n;

// ─── Platforms ───────────────────────────────────────────────────────────────

export const platforms: Platform[] = [
  // ── Instagram ──────────────────────────────────────────────────────────────
  {
    id: "instagram",
    short: "Ig",
    name: "Instagram",
    icon: "instagram.svg",
    summary: "Min 6 · Any",
    description:
      "Generate a secure password for Instagram. Instagram requires at least 6 characters with no mandatory character type restrictions.",
    tips: [
      "Instagram supports authenticator apps — pair this password with one for real security.",
      "Avoid reusing your Facebook password. Meta links both accounts and one breach exposes both.",
      "Instagram won't warn you about weak passwords — the strength bar here does that job instead.",
    ],
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
      { id: "ig-len", label: "At least 6 characters", section: "length", required: true, test: minLen(6) },
      { id: "ig-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "ig-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "ig-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Google ─────────────────────────────────────────────────────────────────
  {
    id: "google",
    name: "Google",
    short: "Go",
    icon: "google.svg",
    summary: "8–100 · Any",
    description:
      "Generate a secure password for your Google account. Google requires 8 to 100 characters and accepts any mix of letters, numbers, and symbols.",
    tips: [
      "Your Google account unlocks Gmail, Drive, YouTube, and payments — treat it as your highest-priority password.",
      "Google supports passkeys on modern browsers — consider switching to one after saving this password.",
      "Check google.com/myaccount/security after saving to verify no unknown sessions are active.",
    ],
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
      { id: "g-len-min", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "g-len-max", label: "No more than 100 characters", section: "length", required: true, test: maxLen(100) },
      { id: "g-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "g-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
    ],
  },

  // ── Apple ──────────────────────────────────────────────────────────────────
  {
    id: "apple",
    name: "Apple",
    short: "Ap",
    icon: "apple.svg",
    summary: "Min 8 · Aa9",
    description:
      "Generate a password for your Apple ID. Apple requires at least 8 characters including an uppercase letter, a lowercase letter, and a number.",
    tips: [
      "Your Apple ID secures iCloud, App Store purchases, and Find My — use a unique password you haven't used anywhere else.",
      "Apple supports passkeys on iOS 16+ and macOS Ventura — consider switching after setting this password.",
      "Spaces are explicitly forbidden by Apple — this generator already excludes them automatically.",
    ],
    minLength: 8,
    maxLength: null,
    forbiddenChars: [" "],
    allowedSpecialChars: null,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,
    defaultLength: 18,
    requirements: [
      { id: "ap-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "ap-upper", label: "One uppercase letter", section: "complexity", required: true, test: hasUppercase },
      { id: "ap-lower", label: "One lowercase letter", section: "complexity", required: true, test: hasLowercase },
      { id: "ap-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "ap-space", label: "No spaces allowed", section: "complexity", required: true, test: noSpaces },
    ],
  },

  // ── Microsoft ──────────────────────────────────────────────────────────────
  {
    id: "microsoft",
    name: "Microsoft",
    short: "Ms",
    icon: "microsoft.svg",
    summary: "8–256 · 3of4",
    description:
      "Generate a password for your Microsoft account. Microsoft requires 8 to 256 characters from at least 3 character categories: uppercase, lowercase, numbers, and symbols.",
    tips: [
      "Microsoft accounts cover Xbox, Office 365, and Azure — a breach here can affect work and personal life simultaneously.",
      "The 3-of-4 rule means uppercase + lowercase + number already satisfies the requirement.",
      "Enable the Microsoft Authenticator app for phishing-resistant 2FA beyond SMS codes.",
    ],
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
      { id: "ms-len-min", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "ms-len-max", label: "No more than 256 characters", section: "length", required: true, test: maxLen(256) },
      { id: "ms-upper", label: "One uppercase letter", section: "complexity", required: true, test: hasUppercase },
      { id: "ms-lower", label: "One lowercase letter", section: "complexity", required: true, test: hasLowercase },
      { id: "ms-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      {
        id: "ms-3of4",
        label: "3 of 4 character types used",
        section: "complexity",
        required: true,
        test: (p) => [hasUppercase(p), hasLowercase(p), hasNumber(p), hasSpecial(p)].filter(Boolean).length >= 3,
      },
      { id: "ms-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── GitHub ─────────────────────────────────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    short: "Gh",
    icon: "github.svg",
    summary: "Min 8 · a9",
    description:
      "Generate a password that meets GitHub's requirements: at least 8 characters including a number and a lowercase letter, or 15+ characters of any combination.",
    tips: [
      "GitHub checks your password against known breach databases on sign-in — a generated password like this passes automatically.",
      "If you commit to public repos, consider a hardware key. Source code access is a high-value target.",
      "Use fine-grained personal access tokens instead of passwords for CLI and API access.",
    ],
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
      { id: "gh-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "gh-lower", label: "One lowercase letter", section: "complexity", required: true, test: hasLowercase },
      { id: "gh-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "gh-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "gh-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Amazon ─────────────────────────────────────────────────────────────────
  {
    id: "amazon",
    name: "Amazon",
    short: "Am",
    icon: "amazon.svg",
    summary: "Min 6 · No spc",
    description:
      "Generate a secure password for your Amazon account. Amazon requires at least 6 characters and does not allow spaces.",
    tips: [
      "Amazon stores payment cards and your shipping address — treat this account with the same care as your bank.",
      "Spaces are not allowed by Amazon — this generator excludes them automatically.",
      "Enable One-Time Password (OTP) via the Amazon app for a second layer beyond this password.",
    ],
    minLength: 6,
    maxLength: 1024,
    forbiddenChars: [" "],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    defaultLength: 16,
    requirements: [
      { id: "amz-len", label: "At least 6 characters", section: "length", required: true, test: minLen(6) },
      { id: "amz-space", label: "No spaces allowed", section: "complexity", required: true, test: noSpaces },
      { id: "amz-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "amz-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "amz-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Twitter / X ────────────────────────────────────────────────────────────
  {
    id: "twitter",
    name: "Twitter / X",
    short: "Tw",
    icon: "twitter.svg",
    summary: "Min 8 · No spc",
    description:
      "Generate a secure password for your Twitter / X account. Twitter requires at least 8 characters with no spaces.",
    tips: [
      "X / Twitter accounts are frequently targeted for impersonation — a strong unique password significantly reduces exposure.",
      "Spaces are not allowed — this generator excludes them automatically.",
      "Use an authenticator app rather than SMS for 2FA — SMS-based codes have been exploited in high-profile Twitter breaches.",
    ],
    minLength: 8,
    maxLength: null,
    forbiddenChars: [" "],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    defaultLength: 16,
    requirements: [
      { id: "tw-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "tw-space", label: "No spaces allowed", section: "complexity", required: true, test: noSpaces },
      { id: "tw-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "tw-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "tw-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── LinkedIn ───────────────────────────────────────────────────────────────
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "Li",
    icon: "linkedin.svg",
    summary: "Min 6 · Any",
    description: "Generate a secure password for LinkedIn. LinkedIn requires at least 6 characters.",
    tips: [
      "LinkedIn has suffered major credential breaches in the past — if you reused an old password here, change it now.",
      "Your LinkedIn account ties to your professional identity and often your work email — treat it as high priority.",
      "Enable two-step verification under Settings → Sign In & Security.",
    ],
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
      { id: "li-len", label: "At least 6 characters", section: "length", required: true, test: minLen(6) },
      { id: "li-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "li-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "li-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Spotify ────────────────────────────────────────────────────────────────
  {
    id: "spotify",
    name: "Spotify",
    short: "Sp",
    icon: "spotify.svg",
    summary: "Min 8 · No spc",
    description:
      "Generate a secure password for Spotify. Spotify requires at least 8 characters and does not allow spaces.",
    tips: [
      "Spotify accounts with saved payment methods are sold on dark web markets — use a unique password here.",
      "Spaces are not allowed — this generator excludes them automatically.",
      "After updating your password, check Settings → Apps and revoke access for any unrecognized third-party app.",
    ],
    minLength: 8,
    maxLength: null,
    forbiddenChars: [" "],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    defaultLength: 16,
    requirements: [
      { id: "sp-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "sp-space", label: "No spaces allowed", section: "complexity", required: true, test: noSpaces },
      { id: "sp-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "sp-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "sp-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Reddit ─────────────────────────────────────────────────────────────────
  {
    id: "reddit",
    name: "Reddit",
    short: "Re",
    icon: "reddit.svg",
    summary: "Min 8 · Any",
    description:
      "Generate a secure password for Reddit. Reddit requires at least 8 characters and rejects commonly used passwords.",
    tips: [
      "Reddit actively checks submitted passwords against common breach lists — a generated password like this passes automatically.",
      "Old Reddit accounts often have weak passwords set years ago. If you haven't changed yours recently, now is the time.",
      "Enable two-factor authentication under User Settings → Safety & Privacy.",
    ],
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
      { id: "rd-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "rd-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "rd-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "rd-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── TikTok ─────────────────────────────────────────────────────────────────
  {
    id: "tiktok",
    name: "TikTok",
    short: "Tt",
    icon: "tiktok.svg",
    summary: "8–20 · Aa9",
    description:
      "Generate a password for TikTok. TikTok requires 8 to 20 characters and must include both letters and numbers.",
    tips: [
      "TikTok enforces a 20-character maximum — the generator respects this limit automatically.",
      "TikTok accounts linked to brand or creator profiles are high-value targets. Use a unique password here.",
      "Enable 2-step verification under Settings → Security → 2-Step Verification.",
    ],
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
      { id: "tt-len-min", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "tt-len-max", label: "No more than 20 characters", section: "length", required: true, test: maxLen(20) },
      { id: "tt-letter", label: "At least one letter", section: "complexity", required: true, test: hasLowercase },
      { id: "tt-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "tt-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
    ],
  },

  // ── PayPal ─────────────────────────────────────────────────────────────────
  {
    id: "paypal",
    name: "PayPal",
    short: "Pp",
    icon: "paypal.svg",
    summary: "8–20 · Aa9",
    description:
      "Generate a password for PayPal. PayPal requires 8 to 20 characters containing both letters and numbers, with no spaces.",
    tips: [
      "PayPal has direct access to your bank account or card — this is one of the most critical passwords you own.",
      "PayPal enforces a 20-character maximum and forbids spaces — the generator handles both automatically.",
      "After updating your password, review Settings → Security → Linked Accounts and remove anything unrecognized.",
    ],
    minLength: 8,
    maxLength: 20,
    forbiddenChars: [" "],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecial: false,
    defaultLength: 16,
    requirements: [
      { id: "pp-len-min", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "pp-len-max", label: "No more than 20 characters", section: "length", required: true, test: maxLen(20) },
      { id: "pp-letter", label: "At least one letter", section: "complexity", required: true, test: hasLowercase },
      { id: "pp-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "pp-space", label: "No spaces allowed", section: "complexity", required: true, test: noSpaces },
      { id: "pp-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
    ],
  },

  // ── Facebook ───────────────────────────────────────────────────────────────
  {
    id: "facebook",
    name: "Facebook",
    short: "Fb",
    icon: "facebook.svg",
    summary: "Min 6 · Any",
    description:
      "Generate a secure password for Facebook. Facebook requires at least 6 characters with no mandatory character type restrictions.",
    tips: [
      "Facebook and Instagram share a Meta account system — a breach of one can affect the other.",
      "Facebook's minimum of 6 characters is dangerously low. Use the full generated length here.",
      "Enable two-factor authentication under Settings → Security and Login.",
    ],
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
      { id: "fb-len", label: "At least 6 characters", section: "length", required: true, test: minLen(6) },
      { id: "fb-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "fb-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "fb-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Netflix ────────────────────────────────────────────────────────────────
  {
    id: "netflix",
    name: "Netflix",
    short: "Nf",
    icon: "netflix.svg",
    summary: "6–60 · Any",
    description:
      "Generate a secure password for Netflix. Netflix requires 6 to 60 characters with no mandatory character type restrictions.",
    tips: [
      "Netflix accounts with active subscriptions are frequently listed for sale — a unique strong password closes this vector.",
      "Netflix's 60-character maximum is generous. Generate at 20+ characters for strong entropy.",
      "Check Netflix → Account → Recent device streaming activity after updating to confirm no unknown sessions.",
    ],
    minLength: 6,
    maxLength: 60,
    forbiddenChars: [],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    defaultLength: 20,
    requirements: [
      { id: "nf-len-min", label: "At least 6 characters", section: "length", required: true, test: minLen(6) },
      { id: "nf-len-max", label: "No more than 60 characters", section: "length", required: true, test: maxLen(60) },
      { id: "nf-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "nf-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "nf-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Shopify ────────────────────────────────────────────────────────────────
  {
    id: "shopify",
    name: "Shopify",
    short: "Sh",
    icon: "shopify.svg",
    summary: "Min 8 · Any",
    description: "Generate a secure password for Shopify. Shopify requires at least 8 characters.",
    tips: [
      "Shopify admin access controls your entire store, orders, and customer data — use a dedicated unique password.",
      "Enable two-step authentication under Shopify Admin → Settings → Account → Security.",
      "Consider using Shopify's organization-level access controls if multiple staff members share account access.",
    ],
    minLength: 8,
    maxLength: null,
    forbiddenChars: [],
    allowedSpecialChars: null,
    requiresUppercase: false,
    requiresLowercase: false,
    requiresNumber: false,
    requiresSpecial: false,
    defaultLength: 20,
    requirements: [
      { id: "sh-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "sh-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "sh-number", label: "At least one number", section: "complexity", required: false, test: hasNumber },
      { id: "sh-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Steam ──────────────────────────────────────────────────────────────────
  {
    id: "steam",
    name: "Steam",
    short: "St",
    icon: "steam.svg",
    summary: "Min 8 · Aa9",
    description:
      "Generate a password for Steam. Steam requires at least 8 characters and must include both letters and numbers.",
    tips: [
      "Steam accounts with game libraries are a top target for credential stuffing attacks. Never reuse a password here.",
      "Enable Steam Guard Mobile Authenticator — it adds a time-based code requirement on every login.",
      "Steam requires both a letter and a number — this generator guarantees both are present.",
    ],
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
      { id: "st-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "st-letter", label: "At least one letter", section: "complexity", required: true, test: hasLowercase },
      { id: "st-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "st-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "st-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },

  // ── Twitch ─────────────────────────────────────────────────────────────────
  {
    id: "twitch",
    name: "Twitch",
    short: "Tv",
    icon: "twitch.svg",
    summary: "Min 8 · Aa9",
    description:
      "Generate a password for Twitch. Twitch requires at least 8 characters including at least one letter and one number.",
    tips: [
      "Twitch accounts with subscriptions, bits, or linked payment methods are targeted regularly.",
      "Enable two-factor authentication under Twitch Settings → Security and Privacy.",
      "If you stream, treat your Twitch password as high priority — account takeovers can result in permanent bans.",
    ],
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
      { id: "tv-len", label: "At least 8 characters", section: "length", required: true, test: minLen(8) },
      { id: "tv-letter", label: "At least one letter", section: "complexity", required: true, test: hasLowercase },
      { id: "tv-number", label: "At least one number", section: "complexity", required: true, test: hasNumber },
      { id: "tv-upper", label: "One uppercase letter", section: "complexity", required: false, test: hasUppercase },
      { id: "tv-special", label: "At least one symbol", section: "complexity", required: false, test: hasSpecial },
    ],
  },
];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getPlatformById(id: string): Platform | null {
  return platforms.find((p) => p.id === id) ?? null;
}

export function getAllPlatformIds(): string[] {
  return platforms.map((p) => p.id);
}
