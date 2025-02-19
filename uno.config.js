// uno.config.ts
import { defineConfig, presetUno, presetTypography } from 'unocss';

export default defineConfig({

  rules: [
    ['smash-svg', {
      'min-height': '20em'
    }],

  ],
  shortcuts: {
    'nav-button':  'inline-block text-lg font-black p-4 z-100  relative rounded-full border',
    'container':   'max-w-3xl m-auto px-8',
    'bg-base':     'bg-white        dark:bg-[#1e1e20]',
    'color-base':  'text-[#181818]  dark:text-[#ddd]',

  },
  theme: {
    breakpoints: {
      'sm': '480px',
      'md': '480px',
      'lg': '960px',
    },
    colors: {
      'dark-pink': '#d5008f'
    }
  },
  presets: [
    presetTypography(),
    presetUno({ dark: 'media' }),
  ]
})
