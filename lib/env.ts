import { z } from 'zod'

/**
 * Variables d’environnement utilisées côté serveur (build / runtime Node).
 * Les clés `NEXT_PUBLIC_*` sont inlinées au build par Next.js.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOSTNAME: z.string().min(1).default('127.0.0.1'),
  /** URL publique optionnelle (inlinée au build si utilisée côté client). */
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  /**
   * Matomo — URL de base de l’instance (sans slash final), ex. `https://analytics.jimmy-tardy-informatique.fr` ou `https://exemple.fr/matomo`.
   * Avec `NEXT_PUBLIC_MATOMO_SITE_ID`, active le suivi ; sinon aucun script Matomo.
   */
  NEXT_PUBLIC_MATOMO_URL: z.preprocess((v) => {
    if (typeof v !== 'string') return undefined
    const raw = v.trim()
    if (!raw) return undefined
    try {
      const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return undefined
      const pathname = u.pathname.replace(/\/+$/, '')
      return `${u.origin}${pathname}`
    } catch {
      console.warn('[env] NEXT_PUBLIC_MATOMO_URL ignoré (URL invalide).')
      return undefined
    }
  }, z.string().optional()),
  /** Matomo — identifiant du site (nombre, ex. `1`). */
  NEXT_PUBLIC_MATOMO_SITE_ID: z.preprocess((v) => {
    if (v === undefined || v === null) return undefined
    const t = String(v).trim()
    if (!t) return undefined
    if (!/^\d+$/.test(t)) {
      console.warn('[env] NEXT_PUBLIC_MATOMO_SITE_ID ignoré (entier attendu, ex. 1).')
      return undefined
    }
    return t
  }, z.string().optional()),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

/** Lecture validée une fois par process (hors navigateur). */
export function getServerEnv(): ServerEnv {
  if (cached) return cached
  const parsed = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_MATOMO_URL: process.env.NEXT_PUBLIC_MATOMO_URL,
    NEXT_PUBLIC_MATOMO_SITE_ID: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
  })
  if (!parsed.success) {
    console.error('Variables d’environnement invalides :', parsed.error.flatten().fieldErrors)
    throw new Error('Configuration serveur invalide (voir lib/env.ts)')
  }
  cached = parsed.data
  return cached
}

/** Configuration publique Matomo (les deux variables doivent être valides). */
export type MatomoPublicConfig = { baseUrl: string; siteId: string }

export function getMatomoPublicConfig(): MatomoPublicConfig | null {
  try {
    const e = getServerEnv()
    const baseUrl = e.NEXT_PUBLIC_MATOMO_URL
    const siteId = e.NEXT_PUBLIC_MATOMO_SITE_ID
    if (!baseUrl || !siteId) return null
    return { baseUrl, siteId }
  } catch {
    return null
  }
}
