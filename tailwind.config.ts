import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#0A0B0D", // primary bg — near-black, blue-tinted
          900: "#101216",
          800: "#14161A", // surface
          700: "#1C1F24", // elevated surface
          600: "#2A2E35",
          border: "#23262C",
        },
        ink: {
          DEFAULT: "#F5F3EE", // warm off-white text
          muted: "#9A9FA8",
          faint: "#5C6169",
        },
        heat: {
          DEFAULT: "#FA5D19",
          soft: "#FF8A50",
          dim: "#7A2E0D",
        },
        volt: {
          DEFAULT: "#3DD9EB",
          soft: "#8FF0FA",
          dim: "#0D5A63",
        },
        signal: {
          DEFAULT: "#4ADE80",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(250,93,25,0.12), transparent)",
        "orb-glow":
          "radial-gradient(circle, rgba(61,217,235,0.25) 0%, rgba(250,93,25,0.15) 45%, transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        marquee: "marquee 30s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
