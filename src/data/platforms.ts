import { z } from "astro/zod";
import { CHAR_CLASSES, DEFAULT_SYMBOLS } from "@/lib/charsets";
import { ANY_SITE, type PasswordRules } from "@/lib/password";
import data from "./platforms.json";
import type { Platform } from "./types";

/**
 * Each site's password rules live in platforms.json, checked against its help pages and live sign-up form,
 * with Apple's password-manager-resources (MIT) filling gaps. Where sources disagree, the strictest
 * compatible rule is used, so a generated password passes both; `notes` says why when it isn't obvious.
 * Reddit was dropped: it publishes no password rules.
 *
 * The schema checks the file whenever the site builds or the tests run, so a typo fails loudly
 * instead of shipping a wrong rule. It runs at build time only: no client script imports this module.
 */

const charClass = z.enum(CHAR_CLASSES);
const count = z.int().min(1);

const rules = z
  .strictObject({
    minLength: count,
    maxLength: count.nullable(),
    required: z.array(z.array(charClass).nonempty()),
    minClasses: z.strictObject({ count, from: z.array(charClass).nonempty() }).optional(),
    // null for the default set, "" for none, or { "except": "#" } for the default set without some.
    // A letter, digit or repeat in the set would be drawn more often than the rest, and overstate the entropy.
    symbols: z.union([
      z
        .string()
        .regex(/^[^A-Za-z0-9\s]*$/, "symbols may only hold symbols")
        .refine((s) => new Set(s).size === s.length, "symbols lists a character twice"),
      z.null(),
      z
        .strictObject({ except: z.string().min(1) })
        .transform(({ except }) => [...DEFAULT_SYMBOLS].filter((c) => !except.includes(c)).join("")),
    ]),
    spaces: z.boolean().optional(),
    maxRepeat: count.optional(),
  })
  .refine((r) => r.maxLength === null || r.minLength <= r.maxLength, "minLength is above maxLength")
  .refine(
    (r) => !r.minClasses || r.minClasses.count <= r.minClasses.from.length,
    "minClasses.count is above its list",
  ) satisfies z.ZodType<PasswordRules>;

const platform = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/, "id must be a lowercase URL slug"),
  name: z.string().min(1),
  short: z.string().length(2),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "color must be a #rrggbb hex"),
  rules,
  notes: z.string().min(1).optional(),
  sources: z.array(z.strictObject({ label: z.string().min(1), url: z.url() })).nonempty(),
  checked: z.string().regex(/^\d{4}-\d{2}$/, "checked must be YYYY-MM"),
}) satisfies z.ZodType<Platform>;

export function parsePlatforms(input: unknown): Platform[] {
  const result = z.array(platform).safeParse(input);
  if (!result.success) throw new Error(`src/data/platforms.json is invalid:\n${z.prettifyError(result.error)}`);
  return result.data;
}

export const platforms = parsePlatforms(data);

/**
 * "Any site", at /: the generator's own rules, listed first. It has no logo or monogram. Its color is the site's
 * coral accent, also --coral in global.css and used by the share images; color.test.ts keeps the CSS in step.
 */
export const ANY = { id: "any", name: "Any site", color: "#ff6b4d", rules: ANY_SITE } as const;
