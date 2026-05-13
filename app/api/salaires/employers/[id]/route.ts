import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { employerBodySchema } from '@/lib/salary-schemas'
import { serializeEmployer } from '@/lib/salary-json'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await ctx.params

  const existing = await prisma.employer.findFirst({ where: { id, userId } })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = employerBodySchema.partial().safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  if (parsed.data.name === undefined) {
    const e = await prisma.employer.findFirstOrThrow({
      where: { id, userId },
      include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
    })
    return Response.json(serializeEmployer(e))
  }

  const e = await prisma.employer.update({
    where: { id },
    data: { name: parsed.data.name },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
  })
  return Response.json(serializeEmployer(e))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await ctx.params

  const existing = await prisma.employer.findFirst({ where: { id, userId } })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  await prisma.employer.delete({ where: { id } })
  return Response.json({ ok: true })
}
