import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TikTok-inspired palette
        tiktok: {
          black: "#010101",
          dark: "#121212",
          gray: "#161823",
          light: "#F1F1F2",
          white: "#FFFFFF",
          red: "#FE2C55",    // Primary Action
          cyan: "#25F4EE",   // Secondary / Accent
        },
        urgency: {
          low: "#25F4EE",
          medium: "#FE2C55",
          high: "#FF0050", // Intense red
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'], // We'll add Inter font next
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
