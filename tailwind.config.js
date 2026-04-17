/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tour:  '#E8A020',
        stay:  '#4A9EEB',
        food:  '#FF6B4A',
        cafe:  '#C47840',
        car:   '#60C860',
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
