import { ANY, platforms } from "@/data/platforms";
import { shortName, type Platform } from "@/data/types";
import { shareTags } from "@/lib/describe";
import { DEFAULT_PASSWORD_OPTIONS, entropyBits, generate, plan, type PasswordRules } from "@/lib/password";
import { meterForBits } from "@/lib/strength";
import type { ShareCard } from "./render";

/** A real password for these rules, mostly masked: the image is public, so it only hints at one. */
function sample(rules: PasswordRules) {
  const p = plan(rules, DEFAULT_PASSWORD_OPTIONS);
  const password = generate(p);
  const { bars, tone } = meterForBits(entropyBits(p));
  return { text: password.slice(0, 4) + "•".repeat(password.length - 4), bars, tone };
}

function platformCard(p: Platform): ShareCard {
  return {
    eyebrow: "Password generator",
    title: p.name,
    tags: shareTags(p.rules),
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
    sample: { ...sample(ANY.rules), status: `Rules for ${platforms.length} sites` },
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
