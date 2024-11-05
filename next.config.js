/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/astromech/:path*',
        destination: 'http://192.168.86.50:3030/api/:path*'  // Using direct IP instead of hostname
      }
    ]
  }
}

module.exports = nextConfig