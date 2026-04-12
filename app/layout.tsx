import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import fr from '@/locales/fr.json'
import { Providers } from '@/app/providers'
import { getMatomoPublicConfig, getServerEnv } from '@/lib/env'
import './globals.css'

function rootMetadataBase(): URL | undefined {
  try {
    const raw = getServerEnv().NEXT_PUBLIC_APP_URL?.trim()
    if (!raw) return undefined
    return new URL(raw.endsWith('/') ? raw : `${raw}/`)
  } catch {
    return undefined
  }
}

const rootBase = rootMetadataBase()

export const metadata: Metadata = {
  ...(rootBase ? { metadataBase: rootBase } : {}),
  title: {
    default: 'Finance Pilot',
    template: '%s | Finance Pilot',
  },
  description: fr.meta.appDescription,
  keywords: [...fr.meta.siteKeywords],
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: fr.meta.appName,
    locale: 'fr_FR',
    title: fr.meta.appName,
    description: fr.meta.appDescription,
  },
  twitter: {
    card: 'summary',
    title: fr.meta.appName,
    description: fr.meta.appDescription,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const matomo = getMatomoPublicConfig()
  const matomoBaseWithSlash = matomo ? `${matomo.baseUrl.replace(/\/$/, '')}/` : ''

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {matomo ? (
          <Script id="matomo-finance-pilot" strategy="afterInteractive">
            {[
              'var _paq = window._paq = window._paq || [];',
              "_paq.push(['trackPageView']);",
              "_paq.push(['enableLinkTracking']);",
              '(function() {',
              `  var u=${JSON.stringify(matomoBaseWithSlash)};`,
              "  _paq.push(['setTrackerUrl', u + 'matomo.php']);",
              `  _paq.push(['setSiteId', ${JSON.stringify(matomo.siteId)}]);`,
              '  var d=document, g=d.createElement("script"), s=d.getElementsByTagName("script")[0];',
              '  g.async=true; g.src=u + "matomo.js";',
              '  s.parentNode.insertBefore(g,s);',
              '})();',
            ].join('\n')}
          </Script>
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
