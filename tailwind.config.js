/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['TT Commons Pro', 'Inter', 'sans-serif'],
        mono: ['TT Commons Pro Mono', 'Inter', 'monospace'],
      },
    },
  },
  plugins: [],
}
