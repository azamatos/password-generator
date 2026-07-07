import { readFileSync, writeFileSync, mkdirSync } from "fs";
import satori from "satori";
import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// utils
import { getPlatformById, platforms } from "../src/utils/platforms";
import { PLATFORM_COLORS } from "../src/utils/constants";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");

const fontRegular = await readFileSync(resolve(root, "public/fonts/inter-tight-v9-latin-regular.woff"));
const fontMedium = await readFileSync(resolve(root, "public/fonts/inter-tight-v9-latin-500.woff"));
const fontSemi = await readFileSync(resolve(root, "public/fonts/inter-tight-v9-latin-600.woff"));
const fontBold = await readFileSync(resolve(root, "public/fonts/inter-tight-v9-latin-700.woff"));

const fonts = [
  { name: "Inter Tight", data: fontRegular, weight: 400, style: "normal" },
  { name: "Inter Tight", data: fontMedium, weight: 500, style: "normal" },
  { name: "Inter Tight", data: fontSemi, weight: 600, style: "normal" },
  { name: "Inter Tight", data: fontBold, weight: 700, style: "normal" },
];

// ── SVG logo → PNG base64 ─────────────────────────────────────────────────────
async function loadLogo(platformId) {
  try {
    const svgBuffer = readFileSync(resolve(root, `public/icons/${platformId}.svg`));
    const pngBuffer = await sharp(svgBuffer)
      .resize(120, 120, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    return `data:image/png;base64,${pngBuffer.toString("base64")}`;
  } catch {
    return null;
  }
}

mkdirSync(resolve(root, "public/og"), { recursive: true });

for (const platform of platforms) {
  const color = PLATFORM_COLORS[platform.id] ?? "#1a1d2e";
  const short = platform.short ?? platform.name.slice(0, 2);
  const pills = platform.summary
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const logo = await loadLogo(platform.id);

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 80px 60px",
          background: `radial-gradient(ellipse 70% 90% at 100% 0%, ${color}28 0%, #fdfaf3 58%)`,
          fontFamily: "Inter Tight",
        },
        children: [
          // ── Top: logo + name ──────────────────────────────────────────────
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", gap: "28px" },
              children: [
                // Logo box
                {
                  type: "div",
                  props: {
                    style: {
                      width: "160px",
                      height: "160px",
                      borderRadius: "38px",
                      background: "white",
                      border: `1.5px solid ${color}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: `0 12px 40px ${color}28, 0 2px 8px rgba(26,29,46,0.06)`,
                    },
                    children: logo
                      ? [{ type: "img", props: { src: logo, width: 96, height: 96, style: { objectFit: "contain" } } }]
                      : [
                          {
                            type: "span",
                            props: { style: { fontSize: "60px", fontWeight: "700", color }, children: short },
                          },
                        ],
                  },
                },

                // Eyebrow + platform name
                {
                  type: "div",
                  props: {
                    style: { display: "flex", flexDirection: "column", gap: "6px" },
                    children: [
                      {
                        type: "span",
                        props: {
                          style: {
                            fontSize: "13px",
                            fontWeight: "600",
                            color: color,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          },
                          children: "Password Generator",
                        },
                      },
                      {
                        type: "span",
                        props: {
                          style: {
                            fontSize: "88px",
                            fontWeight: "700",
                            color: "#1a1d2e",
                            lineHeight: "1",
                            letterSpacing: "-0.04em",
                          },
                          children: platform.name,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // ── Bottom: description + pills + domain ──────────────────────────
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", gap: "20px" },
              children: [
                // Description
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: "22px",
                      fontWeight: "400",
                      color: "#565a7e",
                      letterSpacing: "-0.01em",
                      lineHeight: "1.4",
                      maxWidth: "780px",
                    },
                    children: platform.description.split(".")[0] + ".",
                  },
                },

                // Pills row + domain
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    },
                    children: [
                      // Pills
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", gap: "8px" },
                          children: [
                            ...pills.map((p) => ({
                              type: "div",
                              props: {
                                style: {
                                  padding: "8px 18px",
                                  borderRadius: "999px",
                                  background: "#1a1d2e",
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: "#fdfaf3",
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                },
                                children: p,
                              },
                            })),
                            {
                              type: "div",
                              props: {
                                style: {
                                  padding: "8px 18px",
                                  borderRadius: "999px",
                                  background: `${color}18`,
                                  border: `1.5px solid ${color}55`,
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  color: color,
                                  letterSpacing: "0.04em",
                                  textTransform: "uppercase",
                                },
                                children: "Cryptographic RNG",
                              },
                            },
                          ],
                        },
                      },

                      // Domain pill
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "10px 20px",
                            background: "white",
                            borderRadius: "999px",
                            border: "1px solid #e2e3ec",
                            boxShadow: "0 1px 4px rgba(26,29,46,0.06)",
                          },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: {
                                  fontSize: "15px",
                                  fontWeight: "600",
                                  color: "#1a1d2e",
                                  letterSpacing: "-0.01em",
                                },
                                children: "pass.azamatos.com",
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: { fontSize: "15px", color: "#ff6b4d", fontWeight: "700" },
                                children: "/",
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: { fontSize: "15px", fontWeight: "600", color: color },
                                children: platform.id,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: 1200, height: 630, fonts },
  );

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(resolve(root, `public/og/${platform.id}.png`), png);
  console.log(`✓  ${platform.id}`);
}

console.log(`\n✓  ${platforms.length} OG images → public/og/`);

// ── Main page OG ─────────────────────────────────────────────────────────────
// ── Main page OG ─────────────────────────────────────────────────────────────

const mainLogos = await Promise.all(platforms.slice(0, 12).map((p) => loadLogo(p.id)));

const GRID = platforms.slice(0, 12);

function makeIconRow(items, logos, offset) {
  return {
    type: "div",
    props: {
      style: { display: "flex", gap: "10px" },
      children: items.map((p, i) => ({
        type: "div",
        props: {
          style: {
            width: "96px",
            height: "96px",
            borderRadius: "22px",
            background: "white",
            border: `1.5px solid ${PLATFORM_COLORS[p.id]}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 20px ${PLATFORM_COLORS[p.id]}22, 0 1px 4px rgba(26,29,46,0.05)`,
          },
          children: logos[i + offset]
            ? [
                {
                  type: "img",
                  props: { src: logos[i + offset], width: 56, height: 56, style: { objectFit: "contain" } },
                },
              ]
            : [
                {
                  type: "span",
                  props: {
                    style: { fontSize: "26px", fontWeight: "700", color: PLATFORM_COLORS[p.id] },
                    children: p.short ?? p.name.slice(0, 2),
                  },
                },
              ],
        },
      })),
    },
  };
}

const iconGrid = {
  type: "div",
  props: {
    style: { display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0 },
    children: [
      makeIconRow(GRID.slice(0, 4), mainLogos, 0),
      makeIconRow(GRID.slice(4, 8), mainLogos, 4),
      makeIconRow(GRID.slice(8, 12), mainLogos, 8),
    ],
  },
};

const mainSvg = await satori(
  {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        padding: "64px 72px",
        background: `radial-gradient(ellipse 55% 80% at 95% 50%, #ff6b4d1a 0%, #fdfaf3 55%)`,
        fontFamily: "Inter Tight",
        gap: "64px",
        alignItems: "center",
      },
      children: [
        // ── Left column ───────────────────────────────────────────────────────
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              height: "100%",
            },
            children: [
              // Spacer — pushes headline to vertical center
              { type: "div", props: { style: { height: "1px" } } },

              // Headline block
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: "14px" },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "64px",
                          fontWeight: "700",
                          color: "#1a1d2e",
                          lineHeight: "1.02",
                          letterSpacing: "-0.04em",
                        },
                        children: "Password Generator for Every Platform",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: "400",
                          color: "#3d4163",
                          letterSpacing: "-0.01em",
                          lineHeight: "1.4",
                        },
                        children: `Secure passwords for ${platforms.length} platforms. Cryptographic RNG. Free.`,
                      },
                    },
                  ],
                },
              },

              // Pills + domain on one row
              {
                type: "div",
                props: {
                  style: { display: "flex", alignItems: "center", gap: "8px" },
                  children: [
                    ...["Cryptographic RNG", "No tracking", "Free"].map((label) => ({
                      type: "div",
                      props: {
                        style: {
                          padding: "8px 16px",
                          borderRadius: "999px",
                          background: "white",
                          border: "1px solid #c8cad9",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1a1d2e",
                          letterSpacing: "-0.01em",
                          boxShadow: "0 1px 3px rgba(26,29,46,0.06)",
                        },
                        children: label,
                      },
                    })),
                    {
                      type: "span",
                      props: { style: { fontSize: "14px", color: "#c8cad9" }, children: "·" },
                    },
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "14px", fontWeight: "600", color: "#a4a7c1", letterSpacing: "-0.01em" },
                        children: "pass.azamatos.com",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── Right: icon grid ──────────────────────────────────────────────────
        iconGrid,
      ],
    },
  },
  { width: 1200, height: 630, fonts },
);

const mainPng = await sharp(Buffer.from(mainSvg)).png().toBuffer();
writeFileSync(resolve(root, "public/og/main.png"), mainPng);
console.log("✓  main");
