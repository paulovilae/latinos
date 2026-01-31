/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Removed blanket /api/:path* rewrite - API routes handle proxying with proper auth
      {
         source: '/docs',
         destination: 'http://127.0.0.1:8000/docs',
      },
       {
         source: '/openapi.json',
         destination: 'http://127.0.0.1:8000/openapi.json',
       }
    ];
  },
};

module.exports = nextConfig;
