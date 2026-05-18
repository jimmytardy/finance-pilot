import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { parseSalaryCsvBuffer } from '@/lib/salary-csv-import'
import { toPrismaDecimalString } from '@/lib/salary-schemas'
import { reconcileSalaryMonthsForUser } from '@/lib/salary-employer-period'
import { syncMonthNonInclusesSum } from '@/lib/salary-non-included-sync'

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  const dryRun = request.nextUrl.searchParams.get('dryRun') === '1' || request.nextUrl.searchParams.get('dryRun') === 'true'

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof Blob)) {
    return Response.json({ error: 'missing_file' }, { status: 400 })
  }

  const buf = await file.arrayBuffer()
  const { rows, errors } = parseSalaryCsvBuffer(buf)
  if (errors.length > 0) {
    return Response.json({ error: 'parse_csv', details: errors, rows: [] }, { status: 400 })
  }

  if (dryRun) {
    return Response.json({ ok: true, dryRun: true, count: rows.length, rows })
  }

  let imported = 0
  for (const r of rows) {
    const month = await prisma.salaryMonth.upsert({
      where: {
        userId_year_month: { userId, year: r.year, month: r.month },
      },
      create: {
        userId,
        year: r.year,
        month: r.month,
        brut: new Prisma.Decimal(toPrismaDecimalString(r.brut)),
        netImposable: new Prisma.Decimal(toPrismaDecimalString(r.netImposable)),
        netPaye: new Prisma.Decimal(toPrismaDecimalString(r.netPaye)),
        prelevementSource: new Prisma.Decimal(toPrismaDecimalString(r.prelevementSource)),
        ticketRestaurant: new Prisma.Decimal(toPrismaDecimalString(r.ticketRestaurant)),
        primesIndemnitesIncluses: new Prisma.Decimal(toPrismaDecimalString(r.primesIndemnitesIncluses)),
        primesIndemnitesNonIncluses: new Prisma.Decimal('0'),
        explanation: r.explanation,
      },
      update: {
        brut: new Prisma.Decimal(toPrismaDecimalString(r.brut)),
        netImposable: new Prisma.Decimal(toPrismaDecimalString(r.netImposable)),
        netPaye: new Prisma.Decimal(toPrismaDecimalString(r.netPaye)),
        prelevementSource: new Prisma.Decimal(toPrismaDecimalString(r.prelevementSource)),
        ticketRestaurant: new Prisma.Decimal(toPrismaDecimalString(r.ticketRestaurant)),
        primesIndemnitesIncluses: new Prisma.Decimal(toPrismaDecimalString(r.primesIndemnitesIncluses)),
        explanation: r.explanation,
      },
    })
    await prisma.salaryNonIncludedPrime.deleteMany({ where: { salaryMonthId: month.id } })
    const ni = Number(toPrismaDecimalString(r.primesIndemnitesNonIncluses))
    if (ni > 0) {
      await prisma.salaryNonIncludedPrime.create({
        data: {
          salaryMonthId: month.id,
          category: 'Import CSV',
          description: '',
          amount: new Prisma.Decimal(toPrismaDecimalString(r.primesIndemnitesNonIncluses)),
        },
      })
    }
    await syncMonthNonInclusesSum(month.id)
    imported += 1
  }

  await reconcileSalaryMonthsForUser(userId)

  return Response.json({ ok: true, imported, count: rows.length })
}
