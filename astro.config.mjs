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

  // Geist for text and Space Mono for passwords, values and the wordmark: Latin subsets from @fontsource (SIL Open Font
  // License), about 72 KB for all five.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "Geist",
      cssVariable: "--font-sans",
      fallbacks: ["system-ui", "sans-serif"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/Geist-Regular.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/Geist-Medium.woff2"], weight: 500, style: "normal" },
          { src: ["./src/assets/fonts/Geist-SemiBold.woff2"], weight: 600, style: "normal" },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: "Space Mono",
      cssVariable: "--font-mono",
      fallbacks: ["ui-monospace", "monospace"],
      options: {
        variants: [
          { src: ["./src/assets/fonts/SpaceMono-Regular.woff2"], weight: 400, style: "normal" },
          { src: ["./src/assets/fonts/SpaceMono-Bold.woff2"], weight: 700, style: "normal" },
        ],
      },
    },
  ],
});
