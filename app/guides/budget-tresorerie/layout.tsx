import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { resolveHomeLocale } from '@/lib/resolve-home-locale'
import { buildRouteMetadata } from '@/lib/seo-metadata'

export async function generateMetadata(): Promise<Metadata> {
  const locale = resolveHomeLocale((await headers()).get('accept-language'))
  return buildRouteMetadata(locale, 'guidesBudgetTresorerie')
}

export default function BudgetTresorerieLayout({ children }: { children: ReactNode }) {
  return children
}
