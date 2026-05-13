import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryMonthBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeSalaryMonth } from '@/lib/salary-json'
import { reconcileSalaryMonthsForUser } from '@/lib/salary-employer-period'

type Ctx = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await ctx.params
  const existing = await prisma.salaryMonth.findFirst({
    where: { id, userId },
  })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const partial = salaryMonthBodySchema.partial().safeParse(body)
  if (!partial.success) {
    return Response.json({ error: 'Validation', details: partial.error.flatten() }, { status: 400 })
  }

  const data = partial.data

  const nextYear = data.year ?? existing.year
  const nextMonth = data.month ?? existing.month
  if ((data.year != null || data.month != null) && (nextYear !== existing.year || nextMonth !== existing.month)) {
    const clash = await prisma.salaryMonth.findFirst({
      where: { userId, year: nextYear, month: nextMonth, NOT: { id } },
    })
    if (clash) return Response.json({ error: 'duplicate_year_month' }, { status: 409 })
  }

  const decimals = {
    brut: toPrismaDecimalString(data.brut ?? existing.brut.toString()),
    netImposable: toPrismaDecimalString(data.netImposable ?? existing.netImposable.toString()),
    netPaye: toPrismaDecimalString(data.netPaye ?? existing.netPaye.toString()),
    prelevementSource: toPrismaDecimalString(data.prelevementSource ?? existing.prelevementSource.toString()),
    ticketRestaurant: toPrismaDecimalString(data.ticketRestaurant ?? existing.ticketRestaurant.toString()),
    primesIndemnitesIncluses: toPrismaDecimalString(
      data.primesIndemnitesIncluses ?? existing.primesIndemnitesIncluses.toString(),
    ),
    primesIndemnitesNonIncluses: toPrismaDecimalString(
      data.primesIndemnitesNonIncluses ?? existing.primesIndemnitesNonIncluses.toString(),
    ),
  }

  await prisma.salaryMonth.update({
    where: { id },
    data: {
      ...(data.year != null ? { year: data.year } : {}),
      ...(data.month != null ? { month: data.month } : {}),
      ...(data.explanation !== undefined ? { explanation: data.explanation } : {}),
      brut: new Prisma.Decimal(decimals.brut),
      netImposable: new Prisma.Decimal(decimals.netImposable),
      netPaye: new Prisma.Decimal(decimals.netPaye),
      prelevementSource: new Prisma.Decimal(decimals.prelevementSource),
      ticketRestaurant: new Prisma.Decimal(decimals.ticketRestaurant),
      primesIndemnitesIncluses: new Prisma.Decimal(decimals.primesIndemnitesIncluses),
      primesIndemnitesNonIncluses: new Prisma.Decimal(decimals.primesIndemnitesNonIncluses),
    },
    include: { bonuses: true },
  })

  await reconcileSalaryMonthsForUser(userId)

  const row = await prisma.salaryMonth.findFirstOrThrow({
    where: { id },
    include: { bonuses: true },
  })
  return Response.json(serializeSalaryMonth(row))
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const { id } = await ctx.params
  const existing = await prisma.salaryMonth.findFirst({
    where: { id, userId },
  })
  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 })

  await prisma.salaryMonth.delete({ where: { id } })
  return Response.json({ ok: true })
}
