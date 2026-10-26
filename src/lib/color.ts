const channels = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

function luminance(hex: string): number {
  const [r, g, b] = channels(hex)
    .map((c) => c / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Mixes two hex colours; t is the share of b. */
function mix(a: string, b: string, t: number): string {
  const [ca, cb] = [channels(a), channels(b)];
  return `#${ca
    .map((c, i) =>
      Math.round(c + (cb[i] - c) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const DARK_INK = "#2a0e07";

/** White or dark text, whichever reads better on a brand-coloured background. */
export function inkFor(background: string): string {
  return contrast(background, "#ffffff") >= contrast(background, DARK_INK) ? "#ffffff" : DARK_INK;
}

/** The card's colour in each theme (--surface in global.css). */
export const SURFACE = { light: "#ffffff", dark: "#1f1c17" } as const;

/**
 * A brand colour for buttons, sliders and switches: moved toward black on the light card, or toward white on the dark
 * one, until it holds 3:1 against the card. The banner keeps the colour as it is.
 */
export function uiBrand(color: string, theme: keyof typeof SURFACE): string {
  let ui = color;
  for (let i = 0; i < 12 && contrast(ui, SURFACE[theme]) < 3; i++)
    ui = mix(ui, theme === "dark" ? "#ffffff" : "#000000", 0.12);
  return ui;
}

/** The custom properties global.css expects on <main> for a site's colour. */
export function brandStyle(color: string): string {
  const [light, dark] = [uiBrand(color, "light"), uiBrand(color, "dark")];
  const ink = inkFor(color);
  return Object.entries({
    "--brand": color,
    "--brand-ink": ink,
    "--brand-ui-light": light,
    "--brand-ui-ink-light": inkFor(light),
    "--brand-ui-dark": dark,
    "--brand-ui-ink-dark": inkFor(dark),
    // The big logo behind the banner is drawn in the banner's text colour.
    "--watermark-invert": ink === "#ffffff" ? 1 : 0,
  })
    .map(([name, value]) => `${name}: ${value}`)
    .join("; ");
}
