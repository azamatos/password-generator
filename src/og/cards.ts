import { ANY, platforms } from "@/data/platforms";
import { shortName, type Platform } from "@/data/types";
import { bannerTags } from "@/lib/describe";
import { DEFAULT_PASSWORD_OPTIONS, entropyBits, generate, plan, type PasswordRules } from "@/lib/password";
import { meterForBits } from "@/lib/strength";
import { SITE } from "@/site";
import type { ShareCard } from "./render";

const FOOTER = ["pass.azamatos.com", `${platforms.length} sites`, "never sent"];

/**
 * A password generated for these rules with the default options. A draw can come out mostly symbols, which reads as
 * noise in a small picture, so the picture takes the first with at most 3.
 */
function sample(rules: PasswordRules): ShareCard["sample"] {
  const p = plan(rules, DEFAULT_PASSWORD_OPTIONS);
  let password = generate(p);
  for (let i = 0; i < 100 && password.replace(/[a-z0-9 ]/gi, "").length > 3; i++) password = generate(p);
  const bits = Math.round(entropyBits(p));
  const { label, bars, tone } = meterForBits(bits);
  return {
    label: "Your password",
    password,
    bars,
    tone,
    level: label,
    detail: `${password.length} characters · ${bits} bits`,
  };
}

/** A card for a generator page: "Any site" or one site's rules. */
function generatorCard(site: Platform | typeof ANY, platform: boolean): ShareCard {
  const name = shortName(site.name);
  const headline = platform ? `Passwords that pass ${name}'s rules.` : "Passwords that pass the rules.";
  const card = sample(site.rules);
  return {
    eyebrow: "Password generator",
    headline,
    sub: platform
      ? `Get a password ${name}'s sign-up form accepts. Made in your browser.`
      : "Pick a site and get a password its sign-up form accepts. Made in your browser.",
    footer: FOOTER,
    alt: `${SITE.name}: ${headline.charAt(0).toLowerCase()}${headline.slice(1)} A generated password, rated ${card.level.toLowerCase()}.`,
    banner: {
      color: site.color,
      eyebrow: platform ? "Password generator for" : "Password generator",
      title: site.name,
      tags: bannerTags(site.rules),
      art: platform ? { logo: site.id } : { icon: "asterisk" },
    },
    sample: card,
  };
}

export const cards: Record<string, ShareCard> = {
  main: generatorCard(ANY, false),
  health: {
    eyebrow: "Password health",
    headline: "How long would it take to guess?",
    sub: "See how fast a password falls, and whether it has leaked. Checked in your browser.",
    footer: FOOTER,
    alt: `${SITE.name}: how long would it take to guess? A weak password, found in leaks.`,
    banner: {
      color: ANY.color,
      eyebrow: "Password health",
      title: "Strength check",
      tags: ["Time to guess", "Advice", "Leak check"],
      art: { icon: "shield" },
    },
    sample: {
      label: "Password to check",
      password: "Summer2024!",
      bars: 2,
      tone: "weak",
      level: "Weak",
      detail: "11 characters",
      alert: "Found in leaks",
    },
  },
  ...Object.fromEntries(platforms.map((p) => [p.id, generatorCard(p, true)])),
};
