/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization while keeping API routes dynamic
  output: 'standalone',
  
  // Ensure proper environment variable handling
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },

  // Disable static page generation for API routes
  experimental: {
    appDir: true,
  },

  // Optional: Add headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },

  // Webpack configuration for proper module resolution
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
};

export default nextConfig;
