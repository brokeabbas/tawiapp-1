import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      /**
       * PREMIUM TYPOGRAPHY
       * - Heading: Fraunces (agri-lux editorial feel)
       * - Body/UI: Manrope (modern SaaS clarity)
       */
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["Fraunces", "ui-serif", "Georgia", "serif"],
      },

      /**
       * YOUR BRAND COLORS (unchanged)
       */
      colors: {
        tawi: {
          primary: "#55631C", // Primary green
          dark: "#354207", // Dark olive
          sage: "#99A177", // Muted sage
          leaf: "#B7BE96", // Light leaf
          charcoal: "#494B31",
          charcoal2: "#4A4A4A",
          bg: "#F5F5F2",
          bg2: "#EFEFEF",
        },
      },

      /**
       * PREMIUM DEPTH / ELEVATION
       */
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.08)",
        glow: "0 0 0 6px rgba(85, 99, 28, 0.12)",

        // New: premium card shadows
        softLg: "0 18px 55px rgba(0,0,0,0.12)",
        lift: "0 24px 80px -40px rgba(0,0,0,0.45)",
        insetSoft: "inset 0 1px 0 rgba(255,255,255,0.55)",
      },

      /**
       * RADII
       */
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
        xl4: "2rem",
      },

      /**
       * BACKGROUND IMAGES (nice premium hero surfaces)
       */
      backgroundImage: {
        "tawi-hero":
          "radial-gradient(900px 520px at 20% 15%, rgba(85, 99, 28, 0.18), transparent 55%), radial-gradient(820px 520px at 80% 75%, rgba(153, 161, 119, 0.18), transparent 60%), linear-gradient(to bottom, rgba(245,245,242,0.95), rgba(255,255,255,0.92), rgba(255,255,255,0.98))",
        "tawi-terrain":
          "linear-gradient(135deg, rgba(0,0,0,.85) 0, rgba(0,0,0,.85) 1px, transparent 1px, transparent 14px)",
        "tawi-sheen": "linear-gradient(to top, rgba(255,255,255,0.75), transparent)",
      },

      /**
       * ANIMATIONS for the hero/map
       */
      keyframes: {
        tawiSweep: {
          "0%": { transform: "translateX(-30%)", opacity: "0.05" },
          "45%": { opacity: "0.12" },
          "100%": { transform: "translateX(140%)", opacity: "0.05" },
        },
        tawiDashDraw: {
          "0%": { strokeDashoffset: "120", opacity: "0.25" },
          "45%": { opacity: "0.55" },
          "100%": { strokeDashoffset: "0", opacity: "0.55" },
        },
        floatSoft: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.25)", opacity: "0.6" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)", filter: "blur(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0px)" },
        },
      },

      animation: {
        "tawi-sweep": "tawiSweep 4.5s ease-in-out infinite",
        "tawi-dash": "tawiDashDraw 1.6s ease-out both",
        "float-soft": "floatSoft 6.2s ease-in-out infinite",
        "pulse-soft": "pulseSoft 3.6s ease-in-out infinite",
        "fade-up": "fadeUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;