/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Multigrain faceplate-inspired colors (lighter/brighter)
        panel: {
          light: '#f5f5f5',   // Very light gray/white panel
          DEFAULT: '#e8e8e8', // Light gray
          dark: '#d0d0d0',    // Medium gray for borders/dividers
        },
        knob: {
          dark: '#3a3a3a',    // Dark knob body
          ring: '#5a5a5a',    // Knob ring (lighter)
          indicator: '#ffffff', // White indicator line
        },
        button: {
          gray: '#9a9a9a',    // Gray buttons (lighter)
          dark: '#4a4a4a',    // Dark buttons (A, B)
          red: '#c41e3a',     // Red accent (OUT L/R)
        },
        label: {
          blue: '#2e5c8a',    // Blue text labels
          black: '#1a1a1a',   // Near black text
          gray: '#757575',    // Gray secondary text (lighter)
        },
        jack: '#2a2a2a',      // Jack socket black
      },
    },
  },
  plugins: [],
};
