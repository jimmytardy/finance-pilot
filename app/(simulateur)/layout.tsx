import type { ReactNode } from 'react'
import { SimulatorAppChrome } from '@/components/simulator-app-chrome'

export default function SimulateurLayout({ children }: { children: ReactNode }) {
  return <SimulatorAppChrome>{children}</SimulatorAppChrome>
}
