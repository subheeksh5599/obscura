/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#0F1729',
        paper: '#F7F8FA',
        muted: 'oklch(0.49 0.018 248)',
        grid: 'oklch(0.72 0.16 252 / 0.5)',
        orange: '#FF841F',
        mint: '#53DCA2',
        blue: '#5BA4FF',
        yellow: '#FFCC33',
        violet: '#9D72FF',
        lavender: '#D0A1FF',
        warm: 'oklch(0.925 0.025 82)',
      }
    }
  },
  plugins: []
}
