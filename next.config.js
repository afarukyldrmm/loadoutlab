/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'community.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'community.cloudflare.steamstatic.com' },
    ],
  },
};
module.exports = nextConfig;
