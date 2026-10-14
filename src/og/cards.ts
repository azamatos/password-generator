import { ANY, platforms } from "@/data/platforms";
import { shortName, type Platform } from "@/data/types";
import { ANY_SITE, entropyBits, generate, plan, type PasswordRules } from "@/lib/password";
import { strengthOf } from "@/lib/strength";
import type { ShareCard } from "./render";

/** Short tags for the image, three at most: length, then what's required, in words. */
function shortTags(rules: PasswordRules): string[] {
  const length = rules.maxLength === null ? `${rules.minLength}+ characters` : `${rules.minLength}–${rules.maxLength} characters`;
  if (rules.minClasses) return [length, `${rules.minClasses.count} of 4 types`];
  const WORDS: Record<string, [long: string, short: string]> = {
    upper: ["Uppercase", "upper"],
    lower: ["Lowercase", "lower"],
    digit: ["Number", "number"],
    symbol: ["Symbol", "symbol"],
    "lower,upper": ["Letter", "letter"],
    "digit,symbol": ["Number or symbol", "number or symbol"],
  };
  const groups = rules.required.map((g) => WORDS[g.join(",")] ?? [g.join(" or "), g.join(" or ")]);
  if (groups.length === 0) return [length, "Any characters"];
  if (groups.length <= 2) return [length, ...groups.map(([long]) => long)];
  // Three or more fit one tag: "Upper, lower, number".
  const combined = groups.map(([, short]) => short).join(", ");
  return [length, combined.charAt(0).toUpperCase() + combined.slice(1)];
}

const DEFAULTS = {
  length: 16,
  classes: { lower: true, upper: true, digit: true, symbol: true },
  avoidAmbiguous: false,
};

/** A real password for these rules, mostly masked: the image is public, so it only hints at one. */
function sample(rules: PasswordRules) {
  const p = plan(rules, DEFAULTS);
  const password = generate(p);
  const bits = entropyBits(p);
  const strength = strengthOf(bits);
  return {
    text: password.slice(0, 4) + "•".repeat(password.length - 4),
    bars: Math.min(5, Math.max(1, Math.ceil(bits / 20))),
    tone: strength.score === 1 ? ("weak" as const) : strength.score === 2 ? ("fair" as const) : ("good" as const),
  };
}

function platformCard(p: Platform): ShareCard {
  return {
    eyebrow: "Password generator",
    title: p.name,
    tags: shortTags(p.rules),
    art: { logo: p.id },
    brand: p.color,
    sample: { ...sample(p.rules), status: `Meets ${shortName(p.name)}'s rules` },
  };
}

export const cards: Record<string, ShareCard> = {
  main: {
    eyebrow: "Password generator",
    title: "Passwords that pass the rules",
    tags: [`${platforms.length} sites`, "Passphrases", "Strength check"],
    art: { icon: "asterisk" },
    brand: ANY.color,
    sample: { ...sample(ANY_SITE), status: `Rules for ${platforms.length} sites` },
  },
  health: {
    eyebrow: "Password strength check",
    title: "How strong is yours?",
    tags: ["Time to crack", "Leak check"],
    art: { icon: "eye" },
    brand: "#c4421f",
    sample: {
      text: "Tr0u•••••••",
      bars: 1,
      tone: "weak",
      status: "Seen 3,196 times in breaches",
      alert: true,
    },
  },
  ...Object.fromEntries(platforms.map((p) => [p.id, platformCard(p)])),
};
