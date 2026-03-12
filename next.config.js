/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Powered-By', value: 'NexCore-Server/4.2.1' },
          { key: 'Server', value: 'NexCore-Enterprise/2024' },
          { key: 'X-Security-Policy', value: 'enforce' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/wp-admin', destination: '/admin' },
      { source: '/wp-login.php', destination: '/admin' },
      { source: '/.env', destination: '/admin' },
      { source: '/backup', destination: '/admin' },
      { source: '/phpmyadmin', destination: '/admin' },
      { source: '/administrator', destination: '/admin' },
    ];
  },
};

module.exports = nextConfig;
