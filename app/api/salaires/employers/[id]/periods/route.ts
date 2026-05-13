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

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: employerId } = await ctx.params

  const emp = await prisma.employer.findFirst({
    where: { id: employerId, userId },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
  })
  if (!emp) return Response.json({ error: 'not_found' }, { status: 404 })
  return Response.json(serializeEmployer(emp))
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: employerId } = await ctx.params

  const emp = await prisma.employer.findFirst({ where: { id: employerId, userId } })
  if (!emp) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = employmentPeriodBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const start = parseEmploymentPeriodStart(parsed.data.startDate)
  const end = parsed.data.endDate ? parseEmploymentPeriodEnd(parsed.data.endDate) : null
  if (end && end < start) {
    return Response.json({ error: 'end_before_start' }, { status: 400 })
  }

  await prisma.employmentPeriod.create({
    data: {
      userId,
      employerId,
      startDate: start,
      endDate: end,
      notes: parsed.data.notes ?? null,
    },
  })

  await reconcileSalaryMonthsForUser(userId)

  const updated = await prisma.employer.findFirstOrThrow({
    where: { id: employerId },
    include: { employmentPeriods: { orderBy: { startDate: 'asc' } } },
  })
  return Response.json(serializeEmployer(updated))
}
