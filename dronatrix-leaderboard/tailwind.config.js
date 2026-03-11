/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aggressive esports theme - neon and bold
        primary: {
          DEFAULT: '#00F0FF', // Cyan neon
          dark: '#00B8D4',
          light: '#64FFFF',
        },
        accent: {
          gold: '#FFD700', // Real gold
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          success: '#00FF88',
          danger: '#FF0055',
          warning: '#FFAA00',
          purple: '#BB00FF',
        },
        dark: {
          950: '#000000',
          900: '#0A0A0F',
          800: '#121218',
          700: '#1A1A24',
          600: '#252530',
          500: '#30303C',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      boxShadow: {}
    },
  },
  plugins: [],
}
