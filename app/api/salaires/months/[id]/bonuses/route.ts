import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryBonusBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeBonus } from '@/lib/salary-json'

type Ctx = { params: Promise<{ id: string }> }

async function assertMonth(userId: string, monthId: string) {
  const m = await prisma.salaryMonth.findFirst({
    where: { id: monthId, userId },
  })
  return m
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId } = await ctx.params
  const m = await assertMonth(userId, monthId)
  if (!m) return Response.json({ error: 'not_found' }, { status: 404 })

  const bonuses = await prisma.salaryBonus.findMany({
    where: { salaryMonthId: monthId },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(bonuses.map(serializeBonus))
}

export async function POST(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId } = await ctx.params
  const m = await assertMonth(userId, monthId)
  if (!m) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = salaryBonusBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const amt = toPrismaDecimalString(parsed.data.amount)
  const b = await prisma.salaryBonus.create({
    data: {
      salaryMonthId: monthId,
      category: parsed.data.category,
      description: parsed.data.description ?? '',
      amount: new Prisma.Decimal(amt),
      basis: parsed.data.basis,
      flow: parsed.data.flow,
    },
  })
  return Response.json(serializeBonus(b))
}
