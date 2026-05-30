import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "@solidjs/start/config";
import unoCSS from 'unocss/vite';


export default defineConfig({
  ssr: false, // render everything client-siiiiiiddeee
  // ssr: true, // render things server-side where possible. Requires that the code is isomorphic, etc
  vite: {
    plugins: [unoCSS(), wasm(), topLevelAwait()],
    resolve: {
      alias: {
        'controls': 'three/examples/jsm/controls/OrbitControls',
        'rapier': '@dimforge/rapier3d'
      }
    },
    ssr: {
      noExternal: ['@dimforge/rapier3d', 'three']
    }
  },
  server: {
    preset: 'static',
    compatibilityDate: '2025-01-01'
  }
});
