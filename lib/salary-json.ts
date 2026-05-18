import type { Prisma } from '@prisma/client'
import type { SalaryBonus, SalaryMonth, SalaryNonIncludedPrime } from '@prisma/client'

export function dec(v: Prisma.Decimal | null | undefined): string {
  if (v == null) return '0'
  return v.toString()
}

export function serializeBonus(b: SalaryBonus) {
  return {
    id: b.id,
    salaryMonthId: b.salaryMonthId,
    category: b.category,
    description: b.description,
    amount: dec(b.amount),
    basis: b.basis,
    flow: b.flow,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }
}

export function serializeNonIncludedPrime(p: SalaryNonIncludedPrime) {
  return {
    id: p.id,
    salaryMonthId: p.salaryMonthId,
    category: p.category,
    description: p.description,
    amount: dec(p.amount),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

export function serializeSalaryMonth(
  m: SalaryMonth & { bonuses?: SalaryBonus[]; nonIncludedPrimes?: SalaryNonIncludedPrime[] },
) {
  return {
    id: m.id,
    userId: m.userId,
    employerId: m.employerId,
    year: m.year,
    month: m.month,
    brut: dec(m.brut),
    netImposable: dec(m.netImposable),
    netPaye: dec(m.netPaye),
    prelevementSource: dec(m.prelevementSource),
    ticketRestaurant: dec(m.ticketRestaurant),
    primesIndemnitesIncluses: dec(m.primesIndemnitesIncluses),
    primesIndemnitesNonIncluses: dec(m.primesIndemnitesNonIncluses),
    explanation: m.explanation,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    bonuses: (m.bonuses ?? []).map(serializeBonus),
    nonIncludedPrimes: (m.nonIncludedPrimes ?? []).map(serializeNonIncludedPrime),
  }
}

export function serializeEmployer(
  e: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    employmentPeriods?: {
      id: string
      startDate: Date
      endDate: Date | null
      notes: string | null
    }[]
  },
) {
  return {
    id: e.id,
    name: e.name,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    employmentPeriods: (e.employmentPeriods ?? []).map((p) => ({
      id: p.id,
      startDate: formatYearMonthUtc(p.startDate),
      endDate: p.endDate ? formatYearMonthUtc(p.endDate) : null,
      notes: p.notes,
    })),
  }
}

/** Mois civil uniquement (`YYYY-MM`), sans jour. */
function formatYearMonthUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
