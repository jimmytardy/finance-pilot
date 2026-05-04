import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getNextAuthSecret } from '@/lib/nextauth-secret'

/**
 * Accès réservé aux utilisateurs connectés (équivalent à `withAuth` + `authorized: !!token`).
 * `getToken` est enveloppé : un cookie JWT illisible (ex. après rotation de `NEXTAUTH_SECRET`)
 * ne doit pas faire planter le middleware Edge avec `Invalid Compact JWE`.
 */
export async function middleware(request: NextRequest) {
  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({
      req: request,
      secret: getNextAuthSecret(),
    })
  } catch {
    token = null
  }

  if (!token) {
    const signIn = new URL('/connexion', request.url)
    const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`
    signIn.searchParams.set('callbackUrl', callback)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/donnees',
    '/donnees/:path*',
    '/gestion-mensuel',
    '/gestion-mensuel/:path*',
    '/estimations',
    '/comparaison',
    '/gestion-finances',
    '/gestion-finances/:path*',
    '/guides',
    '/guides/:path*',
    '/strategies-patrimoine',
    '/simulateur',
    '/simulateur/:path*',
  ],
}
