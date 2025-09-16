import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'controls': 'three/examples/jsm/controls/OrbitControls',
      'rapier': '@dimforge/rapier3d-compat',
      '~': resolve(__dirname, './src')
    }
  },
  test: {
    setupFiles: ['./src/test-mocks.ts'],
    environment: 'jsdom'
  },
});
