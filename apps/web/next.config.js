/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-storage-domain.com'],
  },
  transpilePackages: ['@repo/shared'],
  outputFileTracing: false,
}

module.exports = nextConfig
