'use client'

import { Navigation } from '@/components/navigation'

/** Nav allégée pour la home (chunk séparé, sans menu projets / contexte financier). */
export default function LandingNavigation() {
  return <Navigation variant="marketing" />
}
