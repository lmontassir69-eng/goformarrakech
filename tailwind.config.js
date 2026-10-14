/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf3f1',
          100: '#fbe4df',
          200: '#f6c9bf',
          300: '#efa58f',
          400: '#e5755c',
          500: '#e05a47',
          600: '#c84432',
          700: '#a73323',
          800: '#872b1f',
          900: '#6e271d',
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'pop': 'pop 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
