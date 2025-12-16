/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Vlossom Brand Colors (from design/tokens)
        // Primary: Deep Purple - main CTAs, headers, brand anchor
        primary: {
          DEFAULT: "#311E6B",
          soft: "#ADA5C4",
        },
        // Secondary: Cream - card backgrounds, soft containers
        secondary: {
          DEFAULT: "#EFE3D0",
        },
        // Accent: Orange - notifications, highlights, urgency
        accent: {
          DEFAULT: "#FF510D",
        },
        // Tertiary: Green - success states, confirmations, growth
        tertiary: {
          DEFAULT: "#A9D326",
        },
        // Background colors
        background: {
          DEFAULT: "var(--color-background)",
          primary: "#FFFFFF",
          dark: "#161616",
        },
        // Surface colors (cards, containers)
        surface: {
          DEFAULT: "var(--color-surface)",
          light: "#EFE3D0",
          dark: "#2A1F4D",
          elevated: {
            light: "#FFFFFF",
            dark: "#3D2C6B",
          },
        },
        // Status colors
        status: {
          success: "#A9D326",
          warning: "#FF510D",
          error: "#D0021B",
          info: "#ADA5C4",
        },
        // Text colors
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
        },
        // Border colors
        border: {
          subtle: "var(--color-border-subtle)",
          divider: "var(--color-divider)",
        },
        // Legacy aliases (for backwards compatibility during migration)
        brand: {
          purple: "#311E6B",
          orange: "#FF510D",
          cream: "#EFE3D0",
          green: "#A9D326",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Playfair Display", "Times New Roman", "serif"],
        mono: ["SF Mono", "Fira Code", "Consolas", "monospace"],
      },
      fontSize: {
        h1: ["28px", { lineHeight: "1.3", fontWeight: "300" }],
        h2: ["22px", { lineHeight: "1.3", fontWeight: "400" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "400" }],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "40px",
        "4xl": "48px",
        "5xl": "64px",
      },
      borderRadius: {
        none: "0",
        sm: "6px",
        md: "10px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        pill: "999px",
        card: "16px",
        button: "12px",
        input: "12px",
      },
      boxShadow: {
        none: "none",
        soft: "0 4px 16px rgba(0, 0, 0, 0.04)",
        card: "0 12px 30px rgba(0, 0, 0, 0.06)",
        elevated: "0 20px 40px rgba(0, 0, 0, 0.08)",
        modal: "0 24px 48px rgba(0, 0, 0, 0.12)",
        // Dark mode shadows (stronger opacity)
        "soft-dark": "0 4px 16px rgba(0, 0, 0, 0.15)",
        "card-dark": "0 12px 30px rgba(0, 0, 0, 0.25)",
        "elevated-dark": "0 20px 40px rgba(0, 0, 0, 0.35)",
        "modal-dark": "0 24px 48px rgba(0, 0, 0, 0.45)",
      },
      transitionDuration: {
        fast: "150ms",
        medium: "220ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        standard: "cubic-bezier(0.25, 0.1, 0.25, 1)",
        gentle: "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
      },
      zIndex: {
        dropdown: "100",
        sticky: "200",
        modal: "300",
        popover: "400",
        tooltip: "500",
        toast: "600",
      },
      keyframes: {
        // Dialog animations
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        fadeOut: {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        dialogIn: {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        dialogOut: {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
        },
        // Success checkmark animation
        checkmark: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        // Subtle pulse for loading states
        subtlePulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        // Slide in from bottom (for toasts, cards)
        slideInUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        // Skeleton loading shimmer
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // Spinner rotation
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 220ms ease-out",
        fadeOut: "fadeOut 150ms ease-in",
        dialogIn: "dialogIn 220ms ease-out",
        dialogOut: "dialogOut 150ms ease-in",
        checkmark: "checkmark 400ms ease-out",
        subtlePulse: "subtlePulse 2s ease-in-out infinite",
        slideInUp: "slideInUp 300ms ease-out",
        shimmer: "shimmer 2s linear infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};
