const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Cache Google Fonts
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      // Cache images from Cloudinary
      urlPattern: /^https:\/\/.*\.cloudinary\.com/,
      handler: "CacheFirst",
      options: {
        cacheName: "cloudinary-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      // Network-first for API calls
      urlPattern: /\/api\/v1\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vlossom/ui", "@vlossom/types"],

  // Proxy API requests to the backend server
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },

  // V8.0.0: Security headers including Content Security Policy
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy - prevents XSS and data injection attacks
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Allow scripts from self and inline for Next.js
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // Allow styles from self, inline (Next.js), and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Allow fonts from self and Google Fonts
              "font-src 'self' https://fonts.gstatic.com data:",
              // Allow images from trusted sources
              "img-src 'self' data: blob: https://*.cloudinary.com https://res.cloudinary.com",
              // Allow API connections
              "connect-src 'self' https://api.cloudinary.com wss: ws:",
              // Prevent embedding in iframes (clickjacking protection)
              "frame-ancestors 'none'",
              // Only allow forms to submit to self
              "form-action 'self'",
              // Set base URI to self
              "base-uri 'self'",
              // Upgrade insecure requests in production
              process.env.NODE_ENV === "production" ? "upgrade-insecure-requests" : "",
            ].filter(Boolean).join("; "),
          },
          // Strict Transport Security - force HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // XSS Protection (legacy, but still useful for older browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer Policy - don't leak referrer info
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy - disable sensitive features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=(self)",
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
