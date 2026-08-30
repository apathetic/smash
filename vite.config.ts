import wasm from "vite-plugin-wasm";
import { defineConfig, type Plugin } from "vite";
import { solidStart } from "@solidjs/start/config";
import { nitro } from "nitro/vite";
import unoCSS from 'unocss/vite';


const RAPIER_IDS = new Set(['rapier', '@dimforge/rapier3d']);
const RAPIER_STUB_ID = '\0rapier-server-stub';
const RAPIER_EXPORTS = ['ActiveEvents', 'ColliderDesc', 'EventQueue', 'JointData', 'QueryFilterFlags', 'Quaternion', 'Ray', 'RigidBodyDesc', 'RigidBodyType', 'Vector3', 'World', 'version'];

/**
 * Server-side stand-in for `@dimforge/rapier3d`.
 *
 * The game only ever runs in the browser (`ssr: false`), but SolidStart still
 * pulls the app entry into its server bundle — `app.jsx` reaches rapier via
 * `~/system/world`. Nitro's `unwasm` can't parse rapier's binary, so it emits
 * an instantiation with an empty import object; the top-level await then throws.
 */
const stubRapierOnServer = (): Plugin => ({
  name: 'stub-rapier-on-server',
  enforce: 'pre',
  resolveId(source) {
    if (this.environment?.name === 'client') return null;
    return RAPIER_IDS.has(source) ? RAPIER_STUB_ID : null;
  },
  load(id) {
    if (id !== RAPIER_STUB_ID) return null;
    return `const noop = () => {};\n${RAPIER_EXPORTS.map((n) => `export const ${n} = noop;`).join('\n')}`;
  }
});


export default defineConfig({
  plugins: [
    stubRapierOnServer(),
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
      'rapier': '@dimforge/rapier3d'
    }
  },
  server: {
    port: 3000
  },
  nitro: {
    compatibilityDate: '2025-01-01'
  }
});
