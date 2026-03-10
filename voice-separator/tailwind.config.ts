import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          light: "#6366F1",
          dark: "#3730A3",
        },
        accent: {
          DEFAULT: "#06B6D4",
          light: "#22D3EE",
          dark: "#0891B2",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
