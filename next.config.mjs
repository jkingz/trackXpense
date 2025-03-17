/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        port: '',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
