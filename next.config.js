/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    images: {
      unoptimized: true,
    },
    // Explicitly disable static export for Capacitor apps
    output: 'export',
    trailingSlash: false,
  };

module.exports = nextConfig;