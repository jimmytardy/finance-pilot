'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { FinanceDataProvider } from '@/hooks/use-finance-data'

/** Sur la page d’accueil marketing, on n’enveloppe pas l’arbre avec le contexte financier (localStorage, agrégats) pour alléger le JS initial. */
export function ConditionalFinanceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/') {
    return <>{children}</>
  }
  return <FinanceDataProvider>{children}</FinanceDataProvider>
}
