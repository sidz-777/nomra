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
          bg: "var(--bg)",
          soft: "var(--bg-soft)",
          card: "var(--card)",
          "card-muted": "var(--card-muted)",
          ink: "var(--ink)",
          "ink-soft": "var(--ink-soft)",
          muted: "var(--muted)",
          line: "var(--line)",
          "line-soft": "var(--line-soft)",
          gold: "var(--accent)",
          "gold-hover": "var(--accent-hover)",
          "gold-soft": "var(--accent-soft)",
          success: "var(--success)",
          warning: "var(--warning)",
          error: "var(--error)",
        },
      },
      fontFamily: {
        hero: ["var(--font-playfair)", "Georgia", "serif"],
        luxury: ["var(--font-cinzel)", "serif"],
        arabic: ["var(--font-amiri)", "serif"],
        "arabic-display": ["var(--font-reem-kufi)", "sans-serif"],
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        luxury: "var(--shadow-luxury)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
