const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Fix workspace root detection when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname, './'),
  experimental: {
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'freedomaviationco.com',
      },
      {
        protocol: 'https',
        hostname: 'www.freedomaviationco.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/hangar-locations',
        destination: '/hangars',
        permanent: true,
      },
      {
        source: '/partners/sky-harbour',
        destination: '/hangars',
        permanent: true,
      },
      {
        source: '/partners/fa-hangar',
        destination: '/hangars',
        permanent: true,
      },
      {
        source: '/admin',
        destination: '/staff',
        permanent: true,
      },
      {
        source: '/admin/console',
        destination: '/staff/console',
        permanent: true,
      },
      {
        source: '/admin/manage',
        destination: '/staff',
        permanent: true,
      },
      {
        source: '/pricing-configurator',
        destination: '/pricing',
        permanent: true,
      },
    ];
  },
  // Webpack config for handling path aliases
  // webpack: (config) => {
  //   config.resolve.alias = {
  //     ...config.resolve.alias,
  //     '@': path.resolve(__dirname, './src'),
  //     '@shared': path.resolve(__dirname, './shared'),
  //     '@assets': path.resolve(__dirname, './attached_assets'),
  //   };
  //   return config;
  // },
};

module.exports = nextConfig;

