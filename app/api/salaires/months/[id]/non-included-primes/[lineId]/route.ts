import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryNonIncludedPrimeBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeNonIncludedPrime } from '@/lib/salary-json'
import { syncMonthNonInclusesSum } from '@/lib/salary-non-included-sync'

type Ctx = { params: Promise<{ id: string; lineId: string }> }

async function assertLine(userId: string, monthId: string, lineId: string) {
  const line = await prisma.salaryNonIncludedPrime.findFirst({
    where: { id: lineId, salaryMonthId: monthId },
    include: { salaryMonth: true },
  })
  if (!line || line.salaryMonth.userId !== userId) return null
  return line
}

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId, lineId } = await ctx.params

  const existing = await assertLine(userId, monthId, lineId)
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const partial = salaryNonIncludedPrimeBodySchema.partial().safeParse(body)
  if (!partial.success) {
    return Response.json({ error: 'Validation', details: partial.error.flatten() }, { status: 400 })
  }

  const d = partial.data
  const amt = d.amount != null ? toPrismaDecimalString(d.amount) : existing.amount.toString()

  const line = await prisma.salaryNonIncludedPrime.update({
    where: { id: lineId },
    data: {
      ...(d.category != null ? { category: d.category } : {}),
      ...(d.description != null ? { description: d.description } : {}),
      ...(d.amount != null ? { amount: new Prisma.Decimal(amt) } : {}),
    },
  })
  await syncMonthNonInclusesSum(monthId)
  return Response.json(serializeNonIncludedPrime(line))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId, lineId } = await ctx.params

  const existing = await assertLine(userId, monthId, lineId)
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  await prisma.salaryNonIncludedPrime.delete({ where: { id: lineId } })
  await syncMonthNonInclusesSum(monthId)
  return Response.json({ ok: true })
}
