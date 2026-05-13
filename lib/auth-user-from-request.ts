import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getNextAuthSecret } from '@/lib/nextauth-secret'

/** Identité JWT depuis la requête (aligné sur `app/api/simulator/state/route.ts`). */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const secret = getNextAuthSecret()
  if (!secret) return null
  try {
    const token = await getToken({ req: request, secret })
    const id = token?.sub
    return typeof id === 'string' ? id : null
  } catch {
    return null
  }
}
