'use client'

import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import { I18nextProvider } from 'react-i18next'
import { ConditionalFinanceProvider } from '@/components/conditional-finance-provider'
import { SimulatorServerAuthProvider } from '@/contexts/simulator-server-auth-context'
import { SiteFooter } from '@/components/site-footer'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import i18n, { LOCALE_STORAGE_KEY, readStoredLocale } from '@/lib/i18n/i18n'

function I18nEffects() {
  useEffect(() => {
    const lang = readStoredLocale()
    if (i18n.language !== lang) {
      void i18n.changeLanguage(lang)
    }
  }, [])

  useEffect(() => {
    const applyHtmlLang = (lng: string) => {
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lng === 'en' ? 'en' : 'fr'
      }
    }
    applyHtmlLang(i18n.language)
    const onChanged = (lng: string) => {
      applyHtmlLang(lng)
      try {
        const normalized = lng.startsWith('en') ? 'en' : 'fr'
        localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
      } catch {
        /* ignore */
      }
    }
    i18n.on('languageChanged', onChanged)
    return () => {
      i18n.off('languageChanged', onChanged)
    }
  }, [])

  return null
}

export function Providers({
  children,
  googleOAuthConfigured,
}: {
  children: ReactNode
  googleOAuthConfigured: boolean
}) {
  return (
    <ThemeProvider>
      <SimulatorServerAuthProvider googleOAuthConfigured={googleOAuthConfigured}>
        <SessionProvider>
          <I18nextProvider i18n={i18n}>
            <I18nEffects />
            <ConditionalFinanceProvider>
              <div className="flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
                <SiteFooter />
              </div>
            </ConditionalFinanceProvider>
          </I18nextProvider>
        </SessionProvider>
      </SimulatorServerAuthProvider>
      <Toaster />
    </ThemeProvider>
  )
}
