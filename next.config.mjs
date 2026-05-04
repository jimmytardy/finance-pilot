/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Bundle minimal pour l’image Docker (voir Dockerfile). */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: '/', destination: '/donnees', permanent: true },
      { source: '/simulateur', destination: '/donnees', permanent: true },
      { source: '/simulateur/:path*', destination: '/:path*', permanent: true },
      { source: '/guides', destination: '/donnees', permanent: true },
      { source: '/guides/:path*', destination: '/donnees', permanent: true },
      { source: '/strategies-patrimoine', destination: '/donnees', permanent: true },
    ]
  },
}

export default nextConfig
