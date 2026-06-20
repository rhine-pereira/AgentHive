/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack config
  turbopack: {},
  // Webpack fallback for production build edge cases
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, net: false, tls: false };
    return config;
  },
}

export default nextConfig



