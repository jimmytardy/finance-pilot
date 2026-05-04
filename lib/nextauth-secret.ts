/**
 * Middleware Edge : ne lire que `NEXTAUTH_SECRET` (pas tout le schéma canonique :
 * `DATABASE_URL` etc. ne sont pas forcément exposés au runtime Edge).
 */
export function getNextAuthSecret(): string | undefined {
  return process.env.NEXTAUTH_SECRET?.trim() || undefined
}
