/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-white', 'rounded-lg', 'shadow-md', 'text-center', 'text-gray-700', 'border', 'p-4', 'w-full', 'max-w-md',
    'mt-4', 'mb-4', 'px-4', 'py-2', 'text-xl', 'font-bold', 'block', 'hover:bg-blue-600', 'bg-blue-500', 'text-white',
  ],
} 