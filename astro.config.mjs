// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { cspCheck } from "./src/integrations/csp-check";

// https://astro.build/config
export default defineConfig({
  site: "https://pass.azamatos.com",

  // src/scripts/pages.ts loads pages ahead itself. Astro's prefetch would download each one a second time.
  prefetch: false,

  integrations: [sitemap(), cspCheck()],

  // The CSS is small, so inline it instead of a render-blocking request.
  build: {
    inlineStylesheets: "always",
  },

  vite: {
    build: {
      // Astro inlines small scripts into the page, which the CSP in public/_headers would block. Keep them as files.
      assetsInlineLimit: (file) => (file.endsWith(".js") ? false : undefined),
    },
  },

  server: {
    port: 4001,
    open: true,
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: "Inter Tight",
      cssVariable: "--font-sans",
      fallbacks: ["sans-serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/InterTight-Regular.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/InterTight-Medium.woff2"], weight: 500, style: "normal" },
          { src: ["./src/assets/fonts/InterTight-SemiBold.woff2"], weight: 600, style: "normal" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "JetBrains Mono",
      cssVariable: "--font-mono",
      fallbacks: ["monospace"],
      options: {
        variants: [{ src: ["./src/assets/fonts/JetBrainsMono-Medium.woff2"], weight: 500, style: "normal" }],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Boldonse",
      cssVariable: "--font-display",
      fallbacks: ["sans-serif"],
      options: {
        variants: [{ src: ["./src/assets/fonts/Boldonse-Regular.woff2"], weight: 400, style: "normal" }],
      },
    },
  ],
});
