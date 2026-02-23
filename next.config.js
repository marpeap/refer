/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverComponentsExternalPackages: ['pg', 'pdf-lib']
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'pdfkit'];
    return config;
  }
}

module.exports = nextConfig
