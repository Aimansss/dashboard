/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant orange theme
        primary: {
          DEFAULT: '#F97316', // Orange
          dark: '#EA580C',
          light: '#FB923C',
        },
        accent: {
          gold: '#FFD700', // Real gold
          silver: '#C0C0C0',
          bronze: '#CD7F32',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          purple: '#8B5CF6',
        },
        light: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
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
