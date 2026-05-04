import type { ReactNode } from 'react'
import { AuthenticatedNavigation } from '@/components/authenticated-navigation'
import { SimulatorPersistenceBanner } from '@/components/simulator-persistence-banner'

export default function SimulateurLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthenticatedNavigation />
      <SimulatorPersistenceBanner />
      {children}
    </>
  )
}
