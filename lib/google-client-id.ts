import { getCanonicalEnv } from '@/lib/env'

/** Identifiant OAuth Google — lu uniquement depuis le contrat `getCanonicalEnv()`. */
export function getGoogleClientId(): string {
  try {
    return getCanonicalEnv().GOOGLE_CLIENT_ID
  } catch {
    return ''
  }
}
