/** @type {import('tailwindcss').Config} */
const brand = require('../../packages/config/brand.json');

module.exports = {
  content: [
    './App.tsx',
    './index.js',
    './src/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: brand.colors,
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui'],
      },
      borderRadius: {
        card: brand.radius.card,
        pill: brand.radius.pill,
      },
    },
  },
  plugins: [],
};
