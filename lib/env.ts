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
  })
  if (!parsed.success) {
    console.error('Variables d’environnement invalides :', parsed.error.flatten().fieldErrors)
    throw new Error('Configuration serveur invalide (voir lib/env.ts)')
  }
  cached = parsed.data
  return cached
}
