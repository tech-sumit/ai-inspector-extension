import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        panel: resolve(__dirname, "panel/index.html"),
        devtools: resolve(__dirname, "devtools/devtools.html"),
        popup: resolve(__dirname, "popup/popup.html"),
      },
      output: {
        dir: "dist",
        entryFileNames: "[name]/[name].js",
        chunkFileNames: "shared/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
