import type { Config } from "tailwindcss";

const T = {
  bg: "#08080D",
  bgDot: "rgba(255,255,255,0.04)",
  surface: "#111118",
  surfaceHover: "#1A1A24",
  surfaceFloat: "#16161F",
  border: "#252535",
  borderActive: "#6C5CE7",
  accent: "#6C5CE7",
  accentMuted: "rgba(108,92,231,0.15)",
  accentGlow: "rgba(108,92,231,0.25)",
  text: "#E4E4EE",
  textSoft: "#9999B0",
  textDim: "#555568",
  green: "#00D68F",
  greenBg: "rgba(0,214,143,0.08)",
  orange: "#E8621A",
  orangeBg: "rgba(232,98,26,0.08)",
  red: "#FF4757",
  redBg: "rgba(255,71,87,0.06)",
  pink: "#FF6B9D",
  cyan: "#00D2FF",
  cyanBg: "rgba(0,210,255,0.06)",
  purple: "#2D0A4E",
  purpleBg: "rgba(45,10,78,0.15)",
  yellow: "#F5A623",
  yellowBg: "rgba(245,166,35,0.08)",
};

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ...T,
        background: T.bg,
        foreground: T.text,
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        space: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
