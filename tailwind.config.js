/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Inter", "sans-serif"] },
      colors: {
        brand: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c1d3fe",
          300: "#93b3fd",
          400: "#5f87fa",
          500: "#3b5ef6",
          600: "#2440eb",
          700: "#1c31d8",
          800: "#1d2cb0",
          900: "#1e2a8a",
        },
      },
    },
  },
  plugins: [],
};
