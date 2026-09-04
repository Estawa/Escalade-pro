/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        roche: {
          50: '#f5f3ee',
          100: '#e9e4d8',
          200: '#d3c9b0',
          300: '#b3a37e',
          400: '#8a7a56',
          500: '#5c5240',
          600: '#3a3f2e',
          700: '#2a3327',
          800: '#1a1f17',
          900: '#0d100b'
        },
        cendre: '#c8ba9a',
        alerte: '#b5482f'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: []
}
