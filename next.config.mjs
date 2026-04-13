/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Réduit le blocage bfcache côté navigateur quand la chaîne ne force pas autrement un no-store.
   * Les pages dynamiques (headers(), etc.) peuvent toujours imposer d’autres directives en amont (proxy).
   */
  async headers() {
    return [
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      { source: '/donnees', destination: '/simulateur/donnees', permanent: true },
      { source: '/gestion-finances', destination: '/simulateur/gestion-mensuel', permanent: true },
      { source: '/estimations', destination: '/simulateur/estimations', permanent: true },
      { source: '/comparaison', destination: '/simulateur/comparaison', permanent: true },
      { source: '/guides', destination: '/#guides', permanent: true },
    ]
  },
}

export default nextConfig
