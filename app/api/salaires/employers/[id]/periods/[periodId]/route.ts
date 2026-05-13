import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { employmentPeriodBodySchema } from '@/lib/salary-schemas'
import { serializeEmployer } from '@/lib/salary-json'
import {
  parseEmploymentPeriodEnd,
  parseEmploymentPeriodStart,
  reconcileSalaryMonthsForUser,
} from '@/lib/salary-employer-period'

type Ctx = { params: Promise<{ id: string; periodId: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: employerId, periodId } = await ctx.params

  const period = await prisma.employmentPeriod.findFirst({
    where: { id: periodId, userId, employerId },
  })
  if (!period) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = employmentPeriodBodySchema.partial().safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const start = d.startDate != null ? parseEmploymentPeriodStart(d.startDate) : period.startDate
  const end = d.endDate === undefined ? period.endDate : d.endDate ? parseEmploymentPeriodEnd(d.endDate) : null
  if (end && end < start) {
    return Response.json({ error: 'end_before_start' }, { status: 400 })
  }

  await prisma.employmentPeriod.update({
    where: { id: periodId },
    data: {
      ...(d.startDate != null ? { startDate: start } : {}),
      ...(d.endDate !== undefined ? { endDate: end } : {}),
      ...(d.notes !== undefined ? { notes: d.notes } : {}),
    },
  })

  await reconcileSalaryMonthsForUser(userId)

  const updated = await prisma.employer.findFirstOrThrow({
    where: { id: employerId },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
  })
  return Response.json(serializeEmployer(updated))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: employerId, periodId } = await ctx.params

  const period = await prisma.employmentPeriod.findFirst({
    where: { id: periodId, userId, employerId },
  })
  if (!period) return Response.json({ error: 'not_found' }, { status: 404 })

  await prisma.employmentPeriod.delete({ where: { id: periodId } })

  await reconcileSalaryMonthsForUser(userId)

  const updated = await prisma.employer.findFirstOrThrow({
    where: { id: employerId },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
  })
  return Response.json(serializeEmployer(updated))
}
