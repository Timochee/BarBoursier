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
        // Root-level accent colors for easy access
        accent: {
          DEFAULT: '#e94560',
          hover: '#d63850',
          light: '#ff6b6b',
        },
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
