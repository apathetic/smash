import wasm from "vite-plugin-wasm";
import { defineConfig } from "vite";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import unoCSS from 'unocss/vite';


export default defineConfig({
  plugins: [
    solidStart({
      ssr: false, // render everything client-siiiiiiddeee

      // The overlay's error viewer imports @jridgewell/resolve-uri, whose
      // `browser` export condition points at a UMD file with no ESM default,
      // so it throws on load. Re-enable once that resolves upstream.
      devOverlay: false
    }),
    nitro(),
    unoCSS(),
    wasm()
  ],
  resolve: {
    alias: {
      'controls': 'three/examples/jsm/controls/OrbitControls',
      'rapier': '@dimforge/rapier3d' //-compat'
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: '.output/public'
  },
  nitro: {
    compatibilityDate: '2025-01-01'
  }
});
