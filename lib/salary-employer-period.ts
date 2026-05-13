import { prisma } from '@/lib/prisma'

/** Indice monotone année-mois (pour comparer des périodes). */
export function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1)
}

/** Début de période : `YYYY-MM` → 1er jour du mois ; `YYYY-MM-DD` → 1er jour du mois d’origine (normalisation mois seul). */
export function parseEmploymentPeriodStart(input: string): Date {
  if (/^\d{4}-\d{2}$/.test(input)) {
    const [y, m] = input.split('-').map(Number)
    return new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
  }
  const [y, m] = input.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1, 12, 0, 0))
}

/** Fin de période : `YYYY-MM` → dernier jour du mois ; `YYYY-MM-DD` → dernier jour du même mois civil. */
export function parseEmploymentPeriodEnd(input: string): Date {
  if (/^\d{4}-\d{2}$/.test(input)) {
    const [y, m] = input.split('-').map(Number)
    return new Date(Date.UTC(y, m, 0, 12, 0, 0))
  }
  const [y, m] = input.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0, 12, 0, 0))
}

export function periodCoversMonth(
  period: { startDate: Date; endDate: Date | null },
  year: number,
  month: number,
): boolean {
  const k = monthIndex(year, month)
  const lo = monthIndex(period.startDate.getUTCFullYear(), period.startDate.getUTCMonth() + 1)
  if (k < lo) return false
  if (!period.endDate) return true
  const hi = monthIndex(period.endDate.getUTCFullYear(), period.endDate.getUTCMonth() + 1)
  return k <= hi
}

/** Rattache chaque bulletin au premier employeur dont une période couvre le mois (ordre employeur puis début de période). Sinon `employerId` = null. */
export async function reconcileSalaryMonthsForUser(userId: string): Promise<void> {
  const [months, periods] = await Promise.all([
    prisma.salaryMonth.findMany({
      where: { userId },
      select: { id: true, year: true, month: true, employerId: true },
    }),
    prisma.employmentPeriod.findMany({
      where: { userId },
      orderBy: [{ employerId: 'asc' }, { startDate: 'asc' }],
    }),
  ])

  const updates: { id: string; employerId: string | null }[] = []

  for (const sm of months) {
    let chosen: string | null = null
    for (const p of periods) {
      if (periodCoversMonth(p, sm.year, sm.month)) {
        chosen = p.employerId
        break
      }
    }
    if (sm.employerId !== chosen) {
      updates.push({ id: sm.id, employerId: chosen })
    }
  }

  if (updates.length === 0) return

  await prisma.$transaction(
    updates.map((u) =>
      prisma.salaryMonth.update({
        where: { id: u.id },
        data: { employerId: u.employerId },
      }),
    ),
  )
}
