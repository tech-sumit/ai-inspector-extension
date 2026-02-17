import { defineConfig } from "vite";
import { resolve } from "path";

/**
 * Build config for the MAIN world ai-interceptor content script (IIFE).
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "content/ai-interceptor.ts"),
      formats: ["iife"],
      name: "aiInterceptor",
      fileName: "ai-interceptor",
    },
    rollupOptions: {
      output: {
        entryFileNames: "ai-interceptor.js",
        extend: true,
      },
    },
    outDir: "dist/content",
    emptyOutDir: false,
  },
});
