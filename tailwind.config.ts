import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        namora: {
          bg: "#141210",
          soft: "#1C1917",
          card: "#1E1B18",
          ink: "#F2EBDD",
          "ink-soft": "#D9CFBC",
          muted: "#9B8E7A",
          line: "#3A322A",
          "line-soft": "#2A241D",
          gold: "#D4AF6A",
          "gold-hover": "#E6C585",
          success: "#8FA878",
        },
      },
      fontFamily: {
        hero: ["var(--font-playfair)", "Georgia", "serif"],
        luxury: ["var(--font-cinzel)", "serif"],
        arabic: ["var(--font-amiri)", "serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        luxury: "0 12px 35px rgba(0, 0, 0, 0.5)",
        subtle: "0 4px 15px rgba(0, 0, 0, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
