import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "@solidjs/start/config";
import unoCSS from 'unocss/vite';


export default defineConfig({
  ssr: false, // render everything client-siiiiiiddeee
  // ssr: true, // render things server-side where possible. Requires that the code is isomorphic, etc
  vite: {
    plugins: [unoCSS(), wasm(), topLevelAwait()],
    // NOTE: this is already a built-in alias:
    // resolve: {
    //   alias: {
    //     "~/*": "./src/"
    //   }
    // },
  },
  server: {
  //   preset: 'vercel',
    compatibilityDate: '2025-01-01'
  }
});
