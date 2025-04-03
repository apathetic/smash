import wasm from "npm:vite-plugin-wasm";
import topLevelAwait from "npm:vite-plugin-top-level-await";
import solid from "npm:vite-plugin-solid";
import { defineConfig } from "npm:vite";

export default defineConfig({
  plugins: [solid(), wasm(), topLevelAwait()],
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '~': '/src',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
});