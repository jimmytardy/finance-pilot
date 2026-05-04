import { getCanonicalEnv } from '@/lib/env'

/** Serveur : OAuth Google utilisable (sans exposer les secrets). */
export function isGoogleOAuthConfiguredServer(): boolean {
  try {
    const e = getCanonicalEnv()
    return Boolean(e.GOOGLE_CLIENT_ID?.trim() && e.GOOGLE_CLIENT_SECRET?.trim())
  } catch {
    return false
  }
}
