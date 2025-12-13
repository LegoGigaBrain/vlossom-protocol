// Shared Tailwind config for Vlossom packages
// Usage: preset: [require("@vlossom/config/tailwind")]

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        vlossom: {
          primary: "#8B5CF6",
          secondary: "#F9A8D4",
          accent: "#34D399",
          neutral: {
            50: "#FAFAFA",
            100: "#F4F4F5",
            200: "#E4E4E7",
            300: "#D4D4D8",
            400: "#A1A1AA",
            500: "#71717A",
            600: "#52525B",
            700: "#3F3F46",
            800: "#27272A",
            900: "#18181B",
          },
        },
      },
    },
  },
};
