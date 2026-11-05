/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: { fontFamily: { sans: ['DM Sans', 'sans-serif'], display: ['Manrope', 'sans-serif'] }, colors: { ink: '#17231d', muted: '#849087', mint: '#dff2e7', forest: '#1b6847', canvas: '#f7f8f6' } } },
  plugins: [],
}
