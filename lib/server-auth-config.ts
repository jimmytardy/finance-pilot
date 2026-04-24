/** Serveur : OAuth Google utilisable (sans exposer les secrets). */
export function isGoogleOAuthConfiguredServer(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  )
}
