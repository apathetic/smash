// uno.config.ts
import { defineConfig, presetUno, presetTypography } from 'unocss';

export default defineConfig({

  rules: [
    ['font-lilita', {
      'font-family': '"Lilita One", sans-serif'
    }]
  ],
  shortcuts: {
    'bg-base':     'bg-white        dark:bg-[#1e1e20]',
    'color-base':  'text-[#181818]  dark:text-[#ddd]',
    'container':   'max-w-3xl m-auto px-8',

    'button-base': 'font-mono font-bold uppercase tracking-widest rounded transition-colors border-none',
    'button-action': 'button-base cursor-pointer',
    'modal-dialog': 'bg-zinc-900/90 m-auto max-w-3xl p-0 relative rounded-xl shadow-2xl w-full',
    'card-blur':   'relative backdrop-blur-md border border-white/50 rounded-2xl p-3 shadow-2xl transition-transform duration-200 hover:scale-110',
    'store-row':   'flex items-center justify-between bg-black/40 p-3 rounded border border-white/10',
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
