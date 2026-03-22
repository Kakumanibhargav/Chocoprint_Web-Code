/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1B0E09',      // Deep Dark Chocolate
          darker: '#140A06',    // Very Deep Chocolate
          card: '#291811',      // Milk Chocolate
          accent: '#FBBF24',    // Gold/Yellow
          light: '#E6D5C3',     // Cream / Light Cocoa string
          border: '#452A1E',    // Medium Chocolate
          success: '#34D399',
          error: '#F87171',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
