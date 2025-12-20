/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom colors for audio/music app aesthetic
        grain: {
          50: '#f8f7f4',
          100: '#eeebe3',
          200: '#ddd7c7',
          300: '#c7bda3',
          400: '#b1a07e',
          500: '#9f8965',
          600: '#927859',
          700: '#79624a',
          800: '#645141',
          900: '#534437',
          950: '#2d231c',
        },
      },
    },
  },
  plugins: [],
};
