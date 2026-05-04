'use client'

import type { ReactNode } from 'react'
import { FinanceDataProvider } from '@/hooks/use-finance-data'
import { SimulatorWorkspaceProvider } from '@/contexts/simulator-workspace-context'

export function ConditionalFinanceProvider({ children }: { children: ReactNode }) {
  return (
    <SimulatorWorkspaceProvider>
      <FinanceDataProvider>{children}</FinanceDataProvider>
    </SimulatorWorkspaceProvider>
  )
}
