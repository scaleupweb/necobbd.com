import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-outfit)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        pitch: {
          abyss: "#f8fafc",
          surface: "#ffffff",
          card: "#ffffff",
          cardHover: "#f1f5f9",
          border: "#e2e8f0",
          borderActive: "#09090b",
        },
        brand: {
          blue: "#0284c7",
          blueDark: "#0369a1",
          cyan: "#0ea5e9",
          sky: "#38bdf8",
          gold: "#d97706",
          live: "#dc2626",
          emerald: "#16a34a",
          black: "#09090b",
        },
        stadium: {
          white: "#ffffff",
          gray: "#64748b",
          darkGray: "#334155",
        },
      },
      backgroundImage: {
        "gradient-electric": "linear-gradient(135deg, #09090b 0%, #1e293b 50%, #334155 100%)",
        "gradient-electric-subtle": "linear-gradient(135deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.02) 100%)",
        "gradient-gold": "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
        "gradient-live": "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
        "radial-glow": "radial-gradient(circle at 50% 0%, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.01) 45%, transparent 70%)",
      },
      boxShadow: {
        "glow-cyan": "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
        "glow-blue": "0 4px 20px -2px rgba(2, 132, 199, 0.15)",
        "glow-gold": "0 4px 20px -2px rgba(217, 119, 6, 0.15)",
        "glow-live": "0 4px 15px -2px rgba(220, 38, 38, 0.2)",
      },
      animation: {
        "pulse-glow": "pulseGlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.03)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "from": { backgroundPosition: "0 0" },
          "to": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
