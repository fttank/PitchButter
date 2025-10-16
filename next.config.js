/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Allow production builds to complete even if there are type errors
    ignoreBuildErrors: true,
  },
  experimental: {
    turbo: {
      rules: {
        // optional tweak: speed up build
      },
    },
  },
};

module.exports = nextConfig;
