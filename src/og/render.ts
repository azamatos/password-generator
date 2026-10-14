import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { ANY } from "@/data/platforms";

/** Share images are 1200×630, rendered at build time from the same data as the pages. */
const WIDTH = 1200;
const HEIGHT = 630;

// Build-time only, run from the project root. The renderer needs TTF or WOFF, not WOFF2; all three
// families (Inter Tight, Boldonse, JetBrains Mono) are under the SIL Open Font License.
const file = (path: string) => readFileSync(resolve(process.cwd(), path));

const fonts = [
  { name: "Inter Tight", data: file("src/og/fonts/InterTight-Regular.woff"), weight: 400 as const },
  { name: "Inter Tight", data: file("src/og/fonts/InterTight-SemiBold.woff"), weight: 600 as const },
  { name: "Inter Tight", data: file("src/og/fonts/InterTight-Bold.woff"), weight: 700 as const },
  { name: "Boldonse", data: file("src/og/fonts/Boldonse-Regular.ttf"), weight: 400 as const },
  { name: "JetBrains Mono", data: file("src/og/fonts/JetBrainsMono-Medium.ttf"), weight: 500 as const },
];

// Light-theme colors from src/styles/global.css (satori can't read CSS variables); keep them in step.
const INK = "#1a1d2e";
const INK_2 = "#3d4163";
const CREAM = "#fdfaf3";
const BORDER = "#e2e3ec";
const TRACK = "#e2e3ec";
const FAINT = "#666a87";
const GOOD_TEXT = "#1f7556";
const CORAL = ANY.color;
const TONES = { good: "#2a8e6c", fair: "#c79b2e", weak: "#c4421f" };

/** Mixes two hex colors; t is the share of b. */
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

const svgUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const ICONS = {
  asterisk: (color: string) =>
    svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M8 2.5v11M3.2 5.25l9.6 5.5M12.8 5.25l-9.6 5.5" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    ),
  eye: (color: string) =>
    svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>`,
    ),
  check: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${TONES.good}"/><path d="M4.5 8.4l2.4 2.4 4.6-5.3" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  ),
  alert: svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="${TONES.weak}"/><path d="M8 4.2v4.6M8 11.4v.4" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`,
  ),
};

export interface ShareCard {
  /** Small line above the title. */
  eyebrow: string;
  title: string;
  tags: string[];
  /** A platform logo in public/icons, or a drawn icon. */
  art: { logo: string } | { icon: "asterisk" | "eye" };
  brand: string;
  sample: {
    text: string;
    /** 1 to 5 filled bars. */
    bars: number;
    tone: keyof typeof TONES;
    /** The line next to the check (or alert) mark. */
    status: string;
    alert?: boolean;
  };
}

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: { style: { display: "flex", ...style }, children },
});

function titleSize(title: string): number {
  if (title.length <= 7) return 118;
  if (title.length <= 10) return 100;
  if (title.length <= 14) return 82;
  return 70;
}

function tree(card: ShareCard): Node {
  const { brand, sample } = card;
  const tint = mix(CREAM, brand, 0.2);
  const tagBorder = mix(BORDER, brand, 0.35);
  const eyebrow = mix(brand, INK, 0.45);

  const art =
    "logo" in card.art
      ? {
          type: "img",
          props: { src: svgUri(file(`public/icons/${card.art.logo}.svg`).toString()), width: 124, height: 124 },
        }
      : { type: "img", props: { src: ICONS[card.art.icon](INK_2), width: 104, height: 104 } };

  const logo = h(
    "div",
    { alignItems: "center", gap: "10px", fontFamily: "JetBrains Mono", fontSize: "26px", color: INK },
    h("span", { color: CORAL }, "➜"),
    h("span", { color: FAINT }, "~"),
    h("span", {}, "pass.azamatos"),
    h("div", { width: "13px", height: "26px", borderRadius: "2px", background: INK }),
  );

  const hero = h(
    "div",
    { alignItems: "center", justifyContent: "space-between", gap: "40px" },
    h(
      "div",
      { flexDirection: "column", flex: 1 },
      h(
        "div",
        { fontSize: "20px", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: eyebrow },
        card.eyebrow,
      ),
      h(
        "div",
        {
          marginTop: "16px",
          fontFamily: "Boldonse",
          fontSize: `${titleSize(card.title)}px`,
          lineHeight: 1.2,
          color: INK,
          letterSpacing: "-1px",
        },
        card.title,
      ),
      h(
        "div",
        { gap: "10px", marginTop: "36px" },
        ...card.tags.slice(0, 3).map((tag) =>
          h(
            "div",
            {
              alignItems: "center",
              height: "40px",
              padding: "0 16px",
              borderRadius: "999px",
              border: `1.5px solid ${tagBorder}`,
              background: "rgba(255,255,255,0.8)",
              fontSize: "17px",
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: INK_2,
            },
            tag,
          ),
        ),
      ),
    ),
    h(
      "div",
      {
        alignItems: "center",
        justifyContent: "center",
        flex: "none",
        width: "196px",
        height: "196px",
        borderRadius: "46px",
        background: "#fff",
        border: `1.5px solid ${mix(BORDER, brand, 0.25)}`,
        boxShadow: `0 18px 40px ${brand}2e, 0 2px 6px rgba(26,29,46,0.06)`,
      },
      art as Node,
    ),
  );

  const bars = h(
    "div",
    { gap: "8px", marginTop: "16px" },
    ...[0, 1, 2, 3, 4].map((i) =>
      h("div", {
        width: "96px",
        height: "10px",
        borderRadius: "999px",
        background: i < sample.bars ? TONES[sample.tone] : TRACK,
      }),
    ),
  );

  const preview = h(
    "div",
    {
      alignItems: "center",
      justifyContent: "space-between",
      padding: "26px 34px",
      borderRadius: "26px",
      border: `1.5px solid ${BORDER}`,
      background: "#fff",
      boxShadow: "0 1px 2px rgba(26,29,46,0.04)",
    },
    h(
      "div",
      { flexDirection: "column" },
      h("div", { fontFamily: "JetBrains Mono", fontSize: "38px", color: INK, letterSpacing: "1px" }, sample.text),
      bars,
    ),
    h(
      "div",
      {
        alignItems: "center",
        gap: "12px",
        fontSize: "26px",
        fontWeight: 600,
        color: sample.alert ? TONES.weak : GOOD_TEXT,
      },
      { type: "img", props: { src: sample.alert ? ICONS.alert : ICONS.check, width: 28, height: 28 } },
      sample.status,
    ),
  );

  // The renderer adds padding to width and height, so size the box to fit inside 1200×630.
  const pad = { x: 64, top: 48, bottom: 52 };
  return h(
    "div",
    {
      width: `${WIDTH - pad.x * 2}px`,
      height: `${HEIGHT - pad.top - pad.bottom}px`,
      flexDirection: "column",
      justifyContent: "space-between",
      padding: `${pad.top}px ${pad.x}px ${pad.bottom}px`,
      backgroundColor: CREAM,
      backgroundImage: `linear-gradient(180deg, ${tint} 0%, ${CREAM} 72%)`,
      fontFamily: "Inter Tight",
    },
    logo,
    hero,
    preview,
  );
}

export async function renderShareImage(card: ShareCard): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(tree(card) as Parameters<typeof satori>[0], { width: WIDTH, height: HEIGHT, fonts });
  // A plain copy of the Node buffer, which Response accepts as a body.
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } }).render().asPng());
}
