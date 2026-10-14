import type { PasswordRules } from "@/lib/password";

interface Source {
  label: string;
  url: string;
}

/** "X (Twitter)" → "X", for possessives like "Meets X's rules". */
export const shortName = (name: string) => name.replace(/\s*\(.*\)$/, "");

export interface Platform {
  /** URL slug, also the logo file name in public/icons. */
  id: string;
  name: string;
  /** Two-letter monogram for the platform list. */
  short: string;
  /** Brand color for the banner, buttons and slider. */
  color: string;
  rules: PasswordRules;
  /** Why a rule is what it is, when the sources don't make it obvious. Not shown on the site. */
  notes?: string;
  /** Where the rules come from. Not shown on the site; kept so they can be re-checked. */
  sources: Source[];
  /** When the rules were last checked against the sources, as YYYY-MM. */
  checked: string;
}
