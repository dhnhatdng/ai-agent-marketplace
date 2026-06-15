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
          green:   "var(--arc-green)",
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
        bounce:       "bounce 0.6s infinite",
        "float":      "float 5s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "spin-slow":  "spin 10s linear infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in":    "fade-in 0.4s ease-out forwards",
        "ping-slow":  "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":       { transform: "translateY(-12px)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

