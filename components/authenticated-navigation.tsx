'use client'

import { useSession } from 'next-auth/react'
import { Navigation } from '@/components/navigation'

/** Barre de navigation réservée aux utilisateurs connectés. */
export function AuthenticatedNavigation() {
  const { status } = useSession()
  if (status !== 'authenticated') {
    return null
  }
  return <Navigation />
}
