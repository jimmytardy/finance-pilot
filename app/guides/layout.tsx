import type { ReactNode } from 'react'
import { Navigation } from '@/components/navigation'

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
