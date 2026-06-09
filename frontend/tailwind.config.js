/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arc: {
          bg:      "var(--arc-bg)",
          card:    "var(--arc-card)",
          border:  "var(--arc-border)",
          pink:    "var(--arc-pink)",
          purple:  "var(--arc-purple)",
          text:    "var(--arc-text)",
          muted:   "var(--arc-muted)",
          warning: "#ff9901",
          error:   "#ff3b3b",
          success: "#40c080",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        mono: ["Space Grotesk", "monospace"],
      },
      animation: {
        bounce: "bounce 0.6s infinite",
      },
    },
  },
  plugins: [],
};
