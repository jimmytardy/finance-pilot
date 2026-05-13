import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { employerBodySchema } from '@/lib/salary-schemas'
import { serializeEmployer } from '@/lib/salary-json'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const rows = await prisma.employer.findMany({
    where: { userId },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
    orderBy: { name: 'asc' },
  })
  return Response.json(rows.map(serializeEmployer))
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = employerBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const e = await prisma.employer.create({
    data: { userId, name: parsed.data.name },
    include: { employmentPeriods: true },
  })
  return Response.json(serializeEmployer(e))
}
