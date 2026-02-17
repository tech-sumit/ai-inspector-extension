import { defineConfig } from "vite";
import { resolve } from "path";

/**
 * Build config for the ISOLATED world bridge content script (IIFE).
 * The ai-interceptor is built separately via vite.config.interceptor.ts.
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "content/bridge.ts"),
      formats: ["iife"],
      name: "bridge",
      fileName: "bridge",
    },
    rollupOptions: {
      output: {
        entryFileNames: "bridge.js",
        extend: true,
      },
    },
    outDir: "dist/content",
    emptyOutDir: false,
  },
});
