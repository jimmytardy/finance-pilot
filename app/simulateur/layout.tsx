import type { ReactNode } from 'react'
import { Navigation } from '@/components/navigation'
import { SimulatorPersistenceBanner } from '@/components/simulator-persistence-banner'

export default function SimulateurLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      <SimulatorPersistenceBanner />
      {children}
    </>
  )
}
