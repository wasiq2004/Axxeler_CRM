/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#0079C1',
        'primary-dark': '#00629c',
        'secondary': '#f0483e',
        'background': '#F3F4F6',
        'sidebar': '#1F2937',
        'sidebar-hover': '#374151',
        'text-main': '#111827',
        'text-light': '#6B7280',
      },
      fontFamily: {
        sans: ['Quicksand', 'sans-serif'],
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
}