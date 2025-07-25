/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'arial-rounded': ['Arial Rounded MT Bold', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 