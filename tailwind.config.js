/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc4fb',
          400: '#36a5f7',
          500: '#0c87eb',
          600: '#006bc9',
          700: '#0155a3',
          800: '#054885',
          900: '#0a3d6f',
          950: '#07274a',
        },
        cyanAccent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        }
      }
    },
  },
  plugins: [],
}
