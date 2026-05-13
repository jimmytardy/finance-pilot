import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryBonusBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeBonus } from '@/lib/salary-json'

type Ctx = { params: Promise<{ id: string; bonusId: string }> }

async function assertBonus(userId: string, monthId: string, bonusId: string) {
  const bonus = await prisma.salaryBonus.findFirst({
    where: { id: bonusId, salaryMonthId: monthId },
    include: { salaryMonth: true },
  })
  if (!bonus || bonus.salaryMonth.userId !== userId) return null
  return bonus
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId, bonusId } = await ctx.params

  const existing = await assertBonus(userId, monthId, bonusId)
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const partial = salaryBonusBodySchema.partial().safeParse(body)
  if (!partial.success) {
    return Response.json({ error: 'Validation', details: partial.error.flatten() }, { status: 400 })
  }

  const d = partial.data
  const amt =
    d.amount != null ? toPrismaDecimalString(d.amount) : existing.amount.toString()

  const b = await prisma.salaryBonus.update({
    where: { id: bonusId },
    data: {
      ...(d.category != null ? { category: d.category } : {}),
      ...(d.description != null ? { description: d.description } : {}),
      ...(d.amount != null ? { amount: new Prisma.Decimal(amt) } : {}),
      ...(d.basis != null ? { basis: d.basis } : {}),
      ...(d.flow != null ? { flow: d.flow } : {}),
    },
  })
  return Response.json(serializeBonus(b))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId, bonusId } = await ctx.params

  const existing = await assertBonus(userId, monthId, bonusId)
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  await prisma.salaryBonus.delete({ where: { id: bonusId } })
  return Response.json({ ok: true })
}
