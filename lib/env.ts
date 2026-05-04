import { z } from 'zod'

/**
 * Contrat d’environnement unique (runtime Docker / app).
 *
 * Clés autorisées côté applicatif :
 * - NODE_ENV, PORT, HOSTNAME
 * - NEXTAUTH_URL (URL publique de l’app : OAuth + métadonnées / URL absolues)
 * - NEXT_PUBLIC_MATOMO_URL, NEXT_PUBLIC_MATOMO_SITE_ID
 * - DATABASE_URL, NEXTAUTH_SECRET
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *
 * Le code serveur ne doit lire que ces valeurs via `getCanonicalEnv()` (les handlers Edge
 * comme le middleware ne lisent que `NEXTAUTH_SECRET` via `getNextAuthSecret()`).
 *
 * Build Docker / `next build` : définir `SKIP_ENV_VALIDATION=1` pour injecter un jeu factice
 * (voir Dockerfile builder).
 */
const matomoUrl = z.preprocess((v) => {
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
}, z.string().optional())

const matomoSiteId = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined
  const t = String(v).trim()
  if (!t) return undefined
  if (!/^\d+$/.test(t)) {
    console.warn('[env] NEXT_PUBLIC_MATOMO_SITE_ID ignoré (entier attendu, ex. 1).')
    return undefined
  }
  return t
}, z.string().optional())

export const canonicalEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOSTNAME: z.string().min(1).default('0.0.0.0'),
  NEXT_PUBLIC_MATOMO_URL: matomoUrl,
  NEXT_PUBLIC_MATOMO_SITE_ID: matomoSiteId,
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requis'),
  NEXTAUTH_URL: z
    .string()
    .min(1, 'NEXTAUTH_URL requis')
    .transform((s) => s.trim().replace(/\/+$/, '')),
  NEXTAUTH_SECRET: z
    .preprocess((v) => (typeof v === 'string' ? v.trim() : v), z.string().min(1, 'NEXTAUTH_SECRET requis (signature JWT / cookies NextAuth)')),
  GOOGLE_CLIENT_ID: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string().min(1, 'GOOGLE_CLIENT_ID requis'),
  ),
  GOOGLE_CLIENT_SECRET: z.preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string().min(1, 'GOOGLE_CLIENT_SECRET requis'),
  ),
})

export type CanonicalEnv = z.infer<typeof canonicalEnvSchema>

function readCanonicalEnvFromProcess(): unknown {
  return {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOSTNAME: process.env.HOSTNAME,
    NEXT_PUBLIC_MATOMO_URL: process.env.NEXT_PUBLIC_MATOMO_URL,
    NEXT_PUBLIC_MATOMO_SITE_ID: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  }
}

/** Jeu minimal pour `SKIP_ENV_VALIDATION=1` (étape `pnpm build` dans l’image Docker uniquement). */
function stubCanonicalEnvForBuild(): CanonicalEnv {
  return {
    NODE_ENV: 'production',
    PORT: 3000,
    HOSTNAME: '0.0.0.0',
    NEXT_PUBLIC_MATOMO_URL: 'https://build.invalid',
    NEXT_PUBLIC_MATOMO_SITE_ID: '1',
    DATABASE_URL: 'postgresql://build:build@127.0.0.1:5432/build',
    NEXTAUTH_URL: 'https://build.invalid',
    NEXTAUTH_SECRET: 'build-skip-env-validation-placeholder-32chars',
    GOOGLE_CLIENT_ID: 'build',
    GOOGLE_CLIENT_SECRET: 'build',
  }
}

let cached: CanonicalEnv | null = null

export function getCanonicalEnv(): CanonicalEnv {
  if (cached) return cached
  if (process.env.SKIP_ENV_VALIDATION === '1') {
    cached = stubCanonicalEnvForBuild()
    return cached
  }
  const parsed = canonicalEnvSchema.safeParse(readCanonicalEnvFromProcess())
  if (!parsed.success) {
    console.error('[env]', parsed.error.flatten().fieldErrors)
    throw new Error(
      'Variables d’environnement invalides ou incomplètes. Contrat : voir commentaire en tête de lib/env.ts et `.env.example`.',
    )
  }
  cached = parsed.data
  process.env.NEXTAUTH_URL = cached.NEXTAUTH_URL
  process.env.DATABASE_URL = cached.DATABASE_URL
  return cached
}

/** @deprecated utiliser `getCanonicalEnv` */
export const getServerEnv = getCanonicalEnv

export type ServerEnv = CanonicalEnv

/** Configuration publique Matomo (les deux variables doivent être valides). */
export type MatomoPublicConfig = { baseUrl: string; siteId: string }

export function getMatomoPublicConfig(): MatomoPublicConfig | null {
  try {
    const e = getCanonicalEnv()
    const baseUrl = e.NEXT_PUBLIC_MATOMO_URL
    const siteId = e.NEXT_PUBLIC_MATOMO_SITE_ID
    if (!baseUrl || !siteId) return null
    return { baseUrl, siteId }
  } catch {
    return null
  }
}
