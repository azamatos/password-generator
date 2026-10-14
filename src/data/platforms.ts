import { DEFAULT_SYMBOLS } from "@/lib/charsets";
import type { Platform, Source } from "./types";

/**
 * Each site's password rules, checked in October 2026 against its help pages and live sign-up form,
 * with Apple's password-manager-resources (MIT) filling gaps. Where sources disagree, the strictest
 * compatible rule is used, so a generated password passes both. Notes per site:
 * - Amazon: its store help lists no rules; these are Amazon Pay's password guidance.
 * - Facebook: the Help Center states no minimum; 6 is from Facebook's safety guidance.
 * - GitHub: 15+ characters may be anything; shorter ones need a lowercase letter and a number.
 * - Spotify: the sign-up form has had trouble with "#", so it's left out.
 * - TikTok: asks for 2 of letters, numbers and symbols (older forms: all three), and rejects some
 *   symbols without saying which, so all three classes and only common symbols are used.
 * - X: help pages block automated reading; the minimum is from Apple's list.
 * Reddit was dropped: it publishes no password rules.
 */

const APPLE_RULES: Source = {
  label: "Apple's password rules list",
  url: "https://github.com/apple/password-manager-resources/blob/main/quirks/password-rules.json",
};

const without = (chars: string) => [...DEFAULT_SYMBOLS].filter((c) => !chars.includes(c)).join("");

export const platforms: Platform[] = [
  {
    id: "instagram",
    name: "Instagram",
    short: "Ig",
    color: "#d96f5f",
    rules: { minLength: 6, maxLength: null, required: [], symbols: null },
    sources: [{ label: "Instagram Help Center", url: "https://help.instagram.com/369001149843369" }],
    checked: "2026-10",
  },
  {
    id: "google",
    name: "Google",
    short: "Go",
    color: "#c79b6e",
    rules: { minLength: 8, maxLength: null, required: [], symbols: null, spaces: true },
    sources: [{ label: "Google Account Help", url: "https://support.google.com/accounts/answer/32040" }, APPLE_RULES],
    checked: "2026-10",
  },
  {
    id: "apple",
    name: "Apple",
    short: "Ap",
    color: "#8a8d99",
    rules: { minLength: 8, maxLength: 63, required: [["lower"], ["upper"], ["digit"]], symbols: null, maxRepeat: 2 },
    sources: [
      { label: "Apple Platform Security guide", url: "https://support.apple.com/guide/security/secbd5822138/web" },
      { label: "Apple Account sign-up page", url: "https://account.apple.com/account" },
      APPLE_RULES,
    ],
    checked: "2026-10",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    short: "Ms",
    color: "#6a8eb8",
    rules: {
      minLength: 8,
      maxLength: 127,
      required: [],
      minClasses: { count: 2, from: ["lower", "upper", "digit", "symbol"] },
      symbols: null,
    },
    sources: [{ label: "Microsoft account sign-up form", url: "https://signup.live.com/" }, APPLE_RULES],
    checked: "2026-10",
  },
  {
    id: "github",
    name: "GitHub",
    short: "Gh",
    color: "#5a4f6e",
    rules: { minLength: 8, maxLength: null, required: [["lower"], ["digit"]], symbols: null },
    sources: [
      {
        label: "GitHub Docs",
        url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-strong-password",
      },
    ],
    checked: "2026-10",
  },
  {
    id: "amazon",
    name: "Amazon",
    short: "Am",
    color: "#c79b2e",
    rules: {
      minLength: 6,
      maxLength: null,
      required: [],
      minClasses: { count: 3, from: ["lower", "upper", "digit", "symbol"] },
      symbols: null,
    },
    sources: [{ label: "Amazon Pay help", url: "https://pay.amazon.com/help/201754750" }],
    checked: "2026-10",
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    short: "Tw",
    color: "#6a8eb8",
    rules: { minLength: 8, maxLength: null, required: [], symbols: null },
    sources: [
      { label: "X Help Center", url: "https://help.x.com/en/safety-and-security/account-security-tips" },
      APPLE_RULES,
    ],
    checked: "2026-10",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    short: "Li",
    color: "#4a6e8a",
    rules: { minLength: 8, maxLength: 200, required: [], symbols: null },
    sources: [
      { label: "LinkedIn Help", url: "https://www.linkedin.com/help/linkedin/answer/267" },
      { label: "LinkedIn sign-up page", url: "https://www.linkedin.com/signup" },
    ],
    checked: "2026-10",
  },
  {
    id: "spotify",
    name: "Spotify",
    short: "Sp",
    color: "#457f60",
    rules: {
      minLength: 10,
      maxLength: 100,
      required: [
        ["lower", "upper"],
        ["digit", "symbol"],
      ],
      symbols: without("#"),
    },
    sources: [{ label: "Spotify sign-up form", url: "https://www.spotify.com/us/signup" }],
    checked: "2026-10",
  },
  {
    id: "tiktok",
    name: "TikTok",
    short: "Tt",
    color: "#2a2d44",
    rules: { minLength: 8, maxLength: 20, required: [["lower", "upper"], ["digit"], ["symbol"]], symbols: "!#$%&@" },
    sources: [{ label: "TikTok sign-up form", url: "https://www.tiktok.com/signup/phone-or-email/email" }],
    checked: "2026-10",
  },
  {
    id: "paypal",
    name: "PayPal",
    short: "Pp",
    color: "#4a6e8a",
    rules: {
      minLength: 8,
      maxLength: 20,
      required: [
        ["lower", "upper"],
        ["digit", "symbol"],
      ],
      symbols: "!@#$%^&*()",
      maxRepeat: 3,
    },
    sources: [
      { label: "PayPal Help Center", url: "https://www.paypal.com/us/cshelp/article/why-cant-i-view-my-password-help681" },
      APPLE_RULES,
    ],
    checked: "2026-10",
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "Fb",
    color: "#5b6fa8",
    rules: { minLength: 6, maxLength: null, required: [], symbols: null },
    sources: [
      { label: "Facebook Help Center", url: "https://www.facebook.com/help/124904560921566" },
      { label: "Meta security basics", url: "https://www.meta.com/safety/topics/safety-basics/tools/security/" },
    ],
    checked: "2026-10",
  },
  {
    id: "netflix",
    name: "Netflix",
    short: "Nf",
    color: "#c0392b",
    rules: { minLength: 6, maxLength: 60, required: [], symbols: without("~") },
    sources: [
      { label: "Netflix Help Center", url: "https://help.netflix.com/en/node/54078" },
      { label: "Netflix sign-up form", url: "https://www.netflix.com/signup/regform" },
    ],
    checked: "2026-10",
  },
  {
    id: "shopify",
    name: "Shopify",
    short: "Sh",
    color: "#537f48",
    rules: { minLength: 8, maxLength: null, required: [], symbols: null, spaces: true },
    sources: [
      { label: "Shopify Help Center", url: "https://help.shopify.com/en/manual/your-account/logging-in/reset-password" },
    ],
    checked: "2026-10",
  },
  {
    id: "steam",
    name: "Steam",
    short: "St",
    color: "#4a6e8a",
    rules: { minLength: 8, maxLength: 64, required: [["lower"], ["upper"], ["digit"]], symbols: "~!@#$%^&*" },
    sources: [
      { label: "Steam Support", url: "https://help.steampowered.com/en/faqs/view/6639-EB3C-EC79-FF60" },
      { label: "Steam sign-up form", url: "https://store.steampowered.com/join/" },
      APPLE_RULES,
    ],
    checked: "2026-10",
  },
  {
    id: "twitch",
    name: "Twitch",
    short: "Tv",
    color: "#7b5ea7",
    rules: { minLength: 8, maxLength: 71, required: [], symbols: null },
    sources: [
      { label: "Twitch Safety Center", url: "https://safety.twitch.tv/s/article/Two-Factor-Authentication" },
      APPLE_RULES,
    ],
    checked: "2026-10",
  },
];

/** "Any site": the generator's own defaults, shown first in the list. */
export const ANY = { id: "any", name: "Any site", short: "✱", color: "#ff6b4d" } as const;
