import { isGoogleOAuthConfiguredServer } from '@/lib/server-auth-config'

/** Indique si le backend OAuth Google est prêt (sans secrets). */
export async function GET() {
  return Response.json({
    googleOAuthConfigured: isGoogleOAuthConfiguredServer(),
  })
}
