'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { FinanceDataProvider } from '@/hooks/use-finance-data'

function isMarketingOnlyPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/guides') || pathname === '/strategies-patrimoine'
}

/** Hors simulateur et pages outils : pas de contexte financier (localStorage, agrégats) pour alléger le JS. */
export function ConditionalFinanceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isMarketingOnlyPath(pathname)) {
    return <>{children}</>
  }
  return <FinanceDataProvider>{children}</FinanceDataProvider>
}
