import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { salaryMonthBodySchema, toPrismaDecimalString } from '@/lib/salary-schemas'
import { serializeSalaryMonth } from '@/lib/salary-json'
import { reconcileSalaryMonthsForUser } from '@/lib/salary-employer-period'

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const rows = await prisma.salaryMonth.findMany({
    where: { userId },
    orderBy: [{ year: 'asc' }, { month: 'asc' }],
    include: { bonuses: true, nonIncludedPrimes: true },
  })

  return Response.json(rows.map(serializeSalaryMonth))
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) {
    return Response.json({ error: 'Non authentifié' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const parsed = salaryMonthBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Validation', details: parsed.error.flatten() }, { status: 400 })
  }

  const d = parsed.data
  const clash = await prisma.salaryMonth.findFirst({
    where: { userId, year: d.year, month: d.month },
  })
  if (clash) {
    return Response.json({ error: 'duplicate_year_month' }, { status: 409 })
  }

  const decimals = {
    brut: toPrismaDecimalString(d.brut),
    netImposable: toPrismaDecimalString(d.netImposable),
    netPaye: toPrismaDecimalString(d.netPaye),
    prelevementSource: toPrismaDecimalString(d.prelevementSource),
    ticketRestaurant: toPrismaDecimalString(d.ticketRestaurant),
    primesIndemnitesIncluses: toPrismaDecimalString(d.primesIndemnitesIncluses ?? '0'),
    primesIndemnitesNonIncluses: toPrismaDecimalString(d.primesIndemnitesNonIncluses ?? '0'),
  }

  const created = await prisma.salaryMonth.create({
    data: {
      userId,
      year: d.year,
      month: d.month,
      employerId: null,
      brut: new Prisma.Decimal(decimals.brut),
      netImposable: new Prisma.Decimal(decimals.netImposable),
      netPaye: new Prisma.Decimal(decimals.netPaye),
      prelevementSource: new Prisma.Decimal(decimals.prelevementSource),
      ticketRestaurant: new Prisma.Decimal(decimals.ticketRestaurant),
      primesIndemnitesIncluses: new Prisma.Decimal(decimals.primesIndemnitesIncluses),
      primesIndemnitesNonIncluses: new Prisma.Decimal(decimals.primesIndemnitesNonIncluses),
      explanation: d.explanation ?? null,
    },
    include: { bonuses: true, nonIncludedPrimes: true },
  })

  await reconcileSalaryMonthsForUser(userId)

  const row = await prisma.salaryMonth.findFirstOrThrow({
    where: { id: created.id },
    include: { bonuses: true, nonIncludedPrimes: true },
  })
  return Response.json(serializeSalaryMonth(row))
}
