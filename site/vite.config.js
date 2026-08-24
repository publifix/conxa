import { defineConfig } from "vite";

export default defineConfig({
  base: "/conxa/",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
  },
});
