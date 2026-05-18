import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/** Recalcule `primesIndemnitesNonIncluses` = somme des lignes du mois. */
export async function syncMonthNonInclusesSum(salaryMonthId: string): Promise<void> {
  const lines = await prisma.salaryNonIncludedPrime.findMany({
    where: { salaryMonthId },
    select: { amount: true },
  })
  const sum = lines.reduce((s, l) => s + Number(l.amount.toString()), 0)
  await prisma.salaryMonth.update({
    where: { id: salaryMonthId },
    data: { primesIndemnitesNonIncluses: new Prisma.Decimal(sum.toFixed(2)) },
  })
}
