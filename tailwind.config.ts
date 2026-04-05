import type { Config } from 'tailwindcss'

function withOpacity(variable: string) {
  return `rgb(var(${variable}) / <alpha-value>)`
}

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        bg: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-elevated)',
          border: 'var(--bg-border)',
        },
        accent: {
          mint: withOpacity('--accent-mint'),
          'mint-dim': withOpacity('--accent-mint-dim'),
          gold: withOpacity('--accent-gold'),
          red: withOpacity('--accent-red'),
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
    },
  },
  plugins: [],
}

export default config
