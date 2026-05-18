import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#003F87",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2E7D32",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F4F6F9",
          foreground: "#64748B",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        accent: {
          blue: "#E3F0FF",
          green: "#E8F5E9",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        heading: ["var(--font-playfair)", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
