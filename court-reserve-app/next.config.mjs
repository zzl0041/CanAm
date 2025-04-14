/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static optimization while keeping API routes dynamic
  output: 'standalone',
  
  // Ensure proper environment variable handling
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
  },

  // Enable app directory
  experimental: {
    appDir: true,
  },

  // Optional: Add headers for security and CORS
  async headers() {
    return [
      {
        // Allow CORS for all API routes
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

  // Disable powered by header
  poweredByHeader: false,

  // Enable strict mode
  reactStrictMode: true,

  // Disable image optimization during development
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Rewrites to handle API routes properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
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
