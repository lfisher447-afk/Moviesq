import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          400: '#fb7185',
          DEFAULT: "#E50914",
          hover: "#B20710",
          glow: "rgba(229, 9, 20, 0.5)"
        },
        background: "#030508",
        surface: {
          DEFAULT: "#070709",
          light: "#101218",
          lighter: "#1A1D24",
          border: "rgba(255,255,255,0.08)"
        },
        popover: "#0a0a0f",
        "popover-foreground": "#ffffff",
        muted: "rgba(255,255,255,0.1)",
        "muted-foreground": "#aaaaaa",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Bebas Neue", "Oswald", "sans-serif"],
        nexus: ["Bebas Neue", "sans-serif"],
      },
      backgroundImage: {
        'nexus-gradient': "radial-gradient(circle at top center, rgba(229, 9, 20, 0.15) 0%, transparent 70%)",
      },
      boxShadow: {
        'brand-glow': "0 0 40px -10px rgba(229, 9, 20, 0.5)",
      },
      animation: {
        'niconico': 'slideLeft 8s linear forwards',
        'pulse-glow': 'pulseGlow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite linear',
        'reveal': 'reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideLeft: {
          '0%': { transform: 'translateX(100vw)' },
          '100%': { transform: 'translateX(-100vw)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
