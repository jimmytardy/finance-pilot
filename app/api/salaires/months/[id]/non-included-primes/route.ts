import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryNonIncludedPrimeBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeNonIncludedPrime, serializeSalaryMonth } from '@/lib/salary-json'
import { syncMonthNonInclusesSum } from '@/lib/salary-non-included-sync'

type Ctx = { params: Promise<{ id: string }> }

async function assertMonth(userId: string, monthId: string) {
  return prisma.salaryMonth.findFirst({ where: { id: monthId, userId } })
}

export async function GET(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })
  const { id: monthId } = await ctx.params
  const m = await assertMonth(userId, monthId)
  if (!m) return Response.json({ error: 'not_found' }, { status: 404 })

  const lines = await prisma.salaryNonIncludedPrime.findMany({
    where: { salaryMonthId: monthId },
    orderBy: { createdAt: 'asc' },
  })
  return Response.json(lines.map(serializeNonIncludedPrime))
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

  const parsed = salaryNonIncludedPrimeBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const amt = toPrismaDecimalString(parsed.data.amount)
  await prisma.salaryNonIncludedPrime.create({
    data: {
      salaryMonthId: monthId,
      category: parsed.data.category,
      description: parsed.data.description ?? '',
      amount: new Prisma.Decimal(amt),
    },
  })
  await syncMonthNonInclusesSum(monthId)

  const row = await prisma.salaryMonth.findFirstOrThrow({
    where: { id: monthId },
    include: { bonuses: true, nonIncludedPrimes: true },
  })
  return Response.json(serializeSalaryMonth(row))
}
