/** @type {import('tailwindcss').Config} */
const brand = require('../../packages/config/brand.json');

module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: brand.colors,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: brand.radius.card,
        pill: brand.radius.pill,
      },
      backgroundImage: {
        'brand-gradient': `linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.secondary})`,
        'warm-gradient': `linear-gradient(135deg, ${brand.colors.pink}, ${brand.colors.orange})`,
      },
    },
  },
  plugins: [],
};
