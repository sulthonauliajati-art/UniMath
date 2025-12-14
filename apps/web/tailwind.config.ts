import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'uni-bg': 'var(--bg-primary)',
        'uni-bg-secondary': 'var(--bg-secondary)',
        'uni-card': 'var(--bg-card)',
        'uni-primary': 'var(--primary)',
        'uni-accent': 'var(--accent)',
        'uni-success': 'var(--success)',
        'uni-error': 'var(--error)',
        'uni-warning': 'var(--warning)',
      },
      boxShadow: {
        'glow': '0 0 20px var(--primary-glow)',
        'glow-accent': '0 0 20px var(--accent-glow)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        'glass': '12px',
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '28px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px var(--primary-glow)' },
          '50%': { boxShadow: '0 0 40px var(--primary-glow)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
      },
    },
  },
  plugins: [],
}

export default config
