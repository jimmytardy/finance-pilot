'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { FinanceDataProvider } from '@/hooks/use-finance-data'
import { SimulatorWorkspaceProvider } from '@/contexts/simulator-workspace-context'

function isMarketingOnlyPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/guides') || pathname === '/strategies-patrimoine'
}

/** Hors simulateur et pages outils : pas de contexte financier pour alléger le JS. */
export function ConditionalFinanceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (isMarketingOnlyPath(pathname)) {
    return <>{children}</>
  }
  return (
    <SimulatorWorkspaceProvider>
      <FinanceDataProvider>{children}</FinanceDataProvider>
    </SimulatorWorkspaceProvider>
  )
}
