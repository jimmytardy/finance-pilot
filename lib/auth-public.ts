/** Client : identifiant Google public (affiche le bouton de connexion). */
export function isGoogleAuthConfiguredPublic(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID === 'string' &&
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.trim().length > 0
  )
}
