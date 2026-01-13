/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: Fix pre-existing type errors in admin app
    // UI component API mismatches (Badge variants, DataTable props, etc.)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Run lint separately in CI
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
