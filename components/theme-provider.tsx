'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

const THEME_STORAGE_KEY = 'finance-pilot-theme'
const LEGACY_THEME_STORAGE_KEY = 'budget-theme'

/** Avant React : migre l’ancienne clé next-themes pour ne pas perdre le choix utilisateur. */
if (typeof window !== 'undefined') {
  try {
    if (!localStorage.getItem(THEME_STORAGE_KEY) && localStorage.getItem(LEGACY_THEME_STORAGE_KEY)) {
      const v = localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
      if (v) {
        localStorage.setItem(THEME_STORAGE_KEY, v)
        localStorage.removeItem(LEGACY_THEME_STORAGE_KEY)
      }
    }
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_STORAGE_KEY}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
