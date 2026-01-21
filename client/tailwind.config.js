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
        reddit: {
          orange: '#FF4500',
          orangeLight: '#FF5722',
          dark: '#1A1A1B',
          darker: '#0D0D0E',
          gray: '#272729',
          lightGray: '#343536',
          blue: '#0079D3',
        }
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}

