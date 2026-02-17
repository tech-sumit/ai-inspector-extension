import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "background/index.ts"),
      formats: ["iife"],
      name: "background",
      fileName: "index",
    },
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
        extend: true,
      },
    },
    outDir: "dist/background",
    emptyOutDir: false,
  },
});
