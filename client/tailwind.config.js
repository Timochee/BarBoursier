/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#1f2940',
          header: '#16213e',
          text: '#ffffff',
          secondary: '#a0aec0',
          accent: '#e94560',
        },
        light: {
          bg: '#ffffff',
          header: '#f5f7fa',
          text: '#1a1a2e',
          secondary: '#4a5568',
          accent: '#e94560',
        },
      },
    },
  },
  plugins: [],
};
