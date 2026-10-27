import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { inkFor, uiBrand } from "@/lib/color";

/**
 * Share images are 1200×630, rendered at build time from the same data as the pages. The layout is the share image
 * from the Claude Design project (og-source.html): the site's pitch on the cream, and the page's banner on the right
 * with a password card.
 */
const WIDTH = 1200;
const HEIGHT = 630;

// Build-time only, run from the project root. The renderer needs TTF or WOFF, not WOFF2, so these are the WOFF versions
// of the site's fonts (Latin subsets from @fontsource, SIL Open Font License).
const file = (path: string) => readFileSync(resolve(process.cwd(), path));

const fonts = [
  { name: "Geist", data: file("src/og/fonts/Geist-Regular.woff"), weight: 400 as const },
  { name: "Geist", data: file("src/og/fonts/Geist-Medium.woff"), weight: 500 as const },
  { name: "Geist", data: file("src/og/fonts/Geist-SemiBold.woff"), weight: 600 as const },
  { name: "Space Mono", data: file("src/og/fonts/SpaceMono-Regular.woff"), weight: 400 as const },
  { name: "Space Mono", data: file("src/og/fonts/SpaceMono-Bold.woff"), weight: 700 as const },
];

// The design's colours: the site's light theme (src/styles/global.css), a few tuned for a picture. Satori can't read
// CSS variables, so keep them in step by hand.
const CREAM = "#faf5ec";
const INK = "#1d1f2c";
const MUTED = "#5d6074";
const TILDE = "#7a7e9e";
const DOT = "#c9c4ba";
const EYEBROW = "#b23a24";
const CORAL = "#ff6b4d";
const DIGIT = "#2f55d4";
const SYM = "#e2462a";
const LINE = "#ece6da";
const TONES = {
  good: { bar: "#2b9468", text: "#217a55" },
  fair: { bar: "#c79b2e", text: "#86620e" },
  weak: { bar: "#d0405f", text: "#ae2a48", soft: "#fbdfe5" },
};

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const svg = (viewBox: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}">${body}</svg>`;

const ICONS = {
  // The fonts' Latin subsets have no ➜, so the wordmark's arrow is drawn.
  arrow: svg(
    32,
    `<path d="M5 16h19M17 9l7 7-7 7" fill="none" stroke="${CORAL}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ),
  asterisk: (color: string, width: number) =>
    svg(
      32,
      `<path d="M16 6v20M7.34 11l17.32 10M7.34 21l17.32-10" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`,
    ),
  shield: (color: string, width: number) =>
    svg(
      24,
      `<g fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></g>`,
    ),
  copy: svg(
    24,
    `<g fill="none" stroke="#fff" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></g>`,
  ),
  // azamatos.com's mark, as on the portfolio.
  azamatos: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#010101"/><path fill="#f0f4f3" stroke="#f0f4f3" stroke-width="44" stroke-linejoin="round" transform="translate(6.06 22.5) scale(.02 -.02)" d="M279 -14Q214 -14 161.5 15.5Q109 45 78 101.5Q47 158 47 240L47 256Q47 337 78 394Q109 451 161.5 480.5Q214 510 277 510Q328 510 369.5 487.5Q411 465 435 418L447 418L447 496L525 496L525 102Q525 72 552 72L577 72L577 0L524 0Q493 0 470 20Q447 40 447 84L435 84Q411 35 368.5 10.5Q326 -14 279 -14ZM287 60Q357 60 402 110Q447 160 447 242L447 254Q447 307 426 348Q405 389 369 412.5Q333 436 287 436Q241 436 205 413.5Q169 391 148 350.5Q127 310 127 256L127 240Q127 156 172 108Q217 60 287 60Z"/><rect x="19" y="9" width="6" height="14" fill="#68edc0"/></svg>`,
};

/**
 * A logo in one colour, for the big faint copy behind the banner. The site turns it into a silhouette with a CSS filter;
 * the renderer has none, so every colour in the SVG is replaced, and anything left unfilled gets it too.
 */
function silhouette(logo: string, color: string): string {
  return logo
    .replace(/((?:fill|stroke|stop-color)\s*[:=]\s*"?)(#[0-9a-f]{3,8}\b|white\b|black\b)/gi, `$1${color}`)
    .replace(/(<svg\b[^>]*>)/, `$1<g fill="${color}">`)
    .replace(/<\/svg>\s*$/, "</g></svg>");
}

/** Mixes two hex colours; t is the share of b. */
function mix(a: string, b: string, t: number): string {
  const channels = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
  const [ca, cb] = [channels(a), channels(b)];
  return `#${ca
    .map((c, i) =>
      Math.round(c + (cb[i] - c) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * The colour a shade deeper: multiplied by itself at 25%, then 5% darker. On the design's coral it gives its #f2593b, a
 * richer shade than mixing in the dark text colour.
 */
function deepen(color: string): string {
  const channels = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16));
  return `#${channels
    .map((c) =>
      Math.round(c * (1 - 0.25 * (1 - c / 255)) * 0.95)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

export interface ShareCard {
  /** The left side: a line above the headline, the headline, and a sentence under it. */
  eyebrow: string;
  headline: string;
  sub: string;
  /** The line along the bottom, in parts. */
  footer: string[];
  /** The image in words, for og:image:alt. */
  alt: string;
  /** The right side, drawn like the page's banner. */
  banner: {
    color: string;
    eyebrow: string;
    title: string;
    tags: string[];
    /** A site's logo in public/icons, or a drawn icon. */
    art: { logo: string } | { icon: "asterisk" | "shield" };
  };
  /** The card on the banner. */
  sample: {
    label: string;
    password: string;
    /** 1 to 5 filled bars. */
    bars: number;
    tone: keyof typeof TONES;
    level: string;
    detail: string;
    /** In place of the Copy button, such as "Found in leaks". */
    alert?: string;
  };
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});
const img = (src: string, size: number, style: Record<string, unknown> = {}): Node => ({
  type: "img",
  props: { src: svgUri(src), width: size, height: size, style: { flex: "none", ...style } },
});

/** Digits blue and symbols red, as on the site. */
const charColor = (c: string) => (/\d/.test(c) ? DIGIT : /[a-z ]/i.test(c) ? INK : SYM);

function banner(card: ShareCard): Node {
  const { color, art } = card.banner;
  const ink = inkFor(color);
  const ui = uiBrand(color, "light");
  const shade = mix(color, "#000000", 0.6);
  const faint = ink === "#ffffff" ? mix(color, ink, 0.1) : deepen(color);
  let watermark: string;
  let tileArt: string;
  if ("icon" in art) {
    // The asterisk is drawn heavier than the shield, as on the site.
    const heavy = art.icon === "asterisk";
    watermark = ICONS[art.icon](faint, heavy ? 5.2 : 1.6);
    tileArt = ICONS[art.icon](color, heavy ? 4 : 2.2);
  } else {
    tileArt = file(`public/icons/${art.logo}.svg`).toString();
    watermark = silhouette(tileArt, faint);
  }

  const tag = (text: string) => {
    // "Symbols !#$%" shows the set in the mono font, as the page's banner does.
    const symbols = /^Symbols (.+)$/.exec(text);
    return h(
      "div",
      {
        alignItems: "center",
        gap: "6px",
        height: "32px",
        padding: "0 14px",
        borderRadius: "999px",
        background: `${ink}24`,
        color: ink,
        fontSize: "15px",
        fontWeight: 500,
        letterSpacing: "-0.01em",
      },
      ...(symbols ? ["Symbols", h("span", { fontFamily: "Space Mono" }, symbols[1])] : [text]),
    );
  };

  const { sample } = card;
  const tone = TONES[sample.tone];
  const action = sample.alert
    ? h(
        "div",
        {
          alignItems: "center",
          flex: "none",
          height: "46px",
          padding: "0 18px",
          borderRadius: "12px",
          background: TONES.weak.soft,
          color: TONES.weak.text,
          fontSize: "17px",
          fontWeight: 600,
        },
        sample.alert,
      )
    : h(
        "div",
        {
          alignItems: "center",
          flex: "none",
          gap: "8px",
          height: "46px",
          padding: "0 20px",
          borderRadius: "12px",
          background: ui,
          color: "#fff",
          fontSize: "17px",
          fontWeight: 600,
        },
        img(ICONS.copy, 18),
        "Copy",
      );

  const password = h(
    "div",
    {
      position: "absolute",
      left: "22px",
      right: "22px",
      bottom: "22px",
      flexDirection: "column",
      gap: "18px",
      padding: "26px 26px 22px",
      borderRadius: "22px",
      background: "#fff",
      boxShadow: `0 14px 34px ${shade}38`,
    },
    h("div", { fontSize: "15px", color: MUTED }, sample.label),
    h(
      "div",
      { fontFamily: "Space Mono", fontSize: "39px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em" },
      ...[...sample.password].map((c) => h("span", { color: charColor(c) }, c)),
    ),
    h("div", { height: "1px", background: LINE }),
    h(
      "div",
      { alignItems: "center", justifyContent: "space-between" },
      h(
        "div",
        { flexDirection: "column", gap: "10px" },
        h(
          "div",
          { gap: "6px" },
          ...[0, 1, 2, 3, 4].map((i) =>
            h("div", {
              width: "46px",
              height: "8px",
              borderRadius: "4px",
              background: i < sample.bars ? tone.bar : LINE,
            }),
          ),
        ),
        h(
          "div",
          { alignItems: "baseline", gap: "10px" },
          h("span", { fontSize: "18px", fontWeight: 600, color: tone.text }, sample.level),
          h("span", { fontFamily: "Space Mono", fontSize: "13px", color: MUTED }, sample.detail),
        ),
      ),
      action,
    ),
  );

  return h(
    "div",
    {
      position: "absolute",
      left: "604px",
      top: "122px",
      width: "532px",
      height: "458px",
      borderRadius: "30px",
      background: color,
      overflow: "hidden",
    },
    img(watermark, 380, { position: "absolute", right: "-86px", top: "-92px" }),
    h(
      "div",
      { position: "absolute", left: "30px", top: "30px", alignItems: "center", gap: "20px" },
      h(
        "div",
        {
          alignItems: "center",
          justifyContent: "center",
          width: "84px",
          height: "84px",
          borderRadius: "22px",
          background: "#fff",
          boxShadow: `0 6px 18px ${shade}2e`,
        },
        img(tileArt, 44),
      ),
      h(
        "div",
        { flexDirection: "column", gap: "4px", color: ink },
        h("span", { fontSize: "16px", opacity: 0.88 }, card.banner.eyebrow),
        h("span", { fontSize: "46px", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.04em" }, card.banner.title),
      ),
    ),
    h(
      "div",
      { position: "absolute", left: "30px", top: "136px", width: "472px", flexWrap: "wrap", gap: "8px" },
      ...card.banner.tags.map(tag),
    ),
    password,
  );
}

function tree(card: ShareCard): Node {
  const mono = { fontFamily: "Space Mono", color: MUTED };
  return h(
    "div",
    {
      position: "relative",
      width: `${WIDTH}px`,
      height: `${HEIGHT}px`,
      background: CREAM,
      color: INK,
      fontFamily: "Geist",
    },
    banner(card),
    h(
      "div",
      {
        position: "absolute",
        left: "64px",
        top: "50px",
        alignItems: "center",
        gap: "14px",
        fontFamily: "Space Mono",
        fontSize: "28px",
        lineHeight: 1,
        letterSpacing: "-0.01em",
      },
      img(ICONS.arrow, 26),
      h("span", { color: TILDE }, "~"),
      h("span", {}, "pass.azamatos"),
      h("div", { width: "16px", height: "32px", marginLeft: "-10px", background: CORAL }),
    ),
    h(
      "div",
      {
        ...mono,
        position: "absolute",
        right: "64px",
        top: "47px",
        alignItems: "center",
        gap: "12px",
        fontSize: "17px",
      },
      img(ICONS.azamatos, 34),
      "azamatos.com",
    ),
    h(
      "div",
      { position: "absolute", left: "64px", top: "150px", width: "496px", flexDirection: "column", gap: "22px" },
      h(
        "div",
        {
          fontFamily: "Space Mono",
          fontSize: "16px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: EYEBROW,
        },
        card.eyebrow,
      ),
      h("div", { fontSize: "64px", fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.045em" }, card.headline),
      h("div", { fontSize: "24px", lineHeight: 1.38, letterSpacing: "-0.015em", color: MUTED }, card.sub),
    ),
    h(
      "div",
      {
        ...mono,
        position: "absolute",
        left: "64px",
        bottom: "50px",
        alignItems: "center",
        gap: "14px",
        fontSize: "16px",
      },
      ...card.footer.flatMap((part, i) => (i === 0 ? [part] : [h("span", { color: DOT }, "·"), part])),
    ),
  );
}

export async function renderShareImage(card: ShareCard): Promise<Uint8Array<ArrayBuffer>> {
  const markup = await satori(tree(card) as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts });
  // A plain copy of the Node buffer, which Response accepts as a body.
  return new Uint8Array(new Resvg(markup, { fitTo: { mode: "width", value: WIDTH } }).render().asPng());
}
