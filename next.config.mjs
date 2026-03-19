/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['tw-animate-css'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
