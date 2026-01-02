/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        navy: "#16213c",
        mist: "#eef2f7",
        cloud: "#f7f9fc",
        line: "#e2e8f0",
        accent: "#1f6feb",
        accentSoft: "#e6efff",
      },
      boxShadow: {
        card: "0 18px 45px rgba(15, 23, 42, 0.12)",
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
