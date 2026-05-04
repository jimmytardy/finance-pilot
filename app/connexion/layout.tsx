import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import fr from '@/locales/fr.json'
import { AuthenticatedNavigation } from '@/components/authenticated-navigation'

export const metadata: Metadata = {
  title: fr.auth.signInPageTitle,
  description: fr.auth.signInPageLead,
  robots: { index: false, follow: false },
}

export default function ConnexionLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthenticatedNavigation />
      {children}
    </>
  )
}
