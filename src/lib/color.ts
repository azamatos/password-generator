function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const DARK_INK = "#2a0e07";

/** White or dark text, whichever reads better on a brand-colored button. */
export function inkFor(background: string): string {
  return contrast(background, "#ffffff") >= contrast(background, DARK_INK) ? "#ffffff" : DARK_INK;
}
