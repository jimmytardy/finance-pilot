import {
  isBaseSalaryElementCategory,
  normalizePrimeCategoryLabel,
  TICKET_RESTAURANT_UNIT_EUR,
} from '@/lib/payslip-extraction-constants'
import type { PayslipExtraction } from '@/lib/payslip-extraction-schema'

function toDecimalString(n: number): string {
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

function parseMoney(v: string): number {
  const n = Number(String(v).replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

function addMoneyField(field: string, add: number): string {
  if (add <= 0) return field
  return toDecimalString(parseMoney(field) + add)
}

function parseCount(v: unknown): number | null {
  if (v == null) return null
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim())
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n)
}

/** Tickets restaurant = valeur unitaire entreprise × nombre indiqué sur le bulletin. */
export function computeTicketRestaurantAmount(ticketCount: number): string {
  return toDecimalString(ticketCount * TICKET_RESTAURANT_UNIT_EUR)
}

type BonusLine = NonNullable<PayslipExtraction['bonuses']>[number]
type NonIncludedLine = NonNullable<PayslipExtraction['nonIncludedPrimes']>[number]

/**
 * Retire congés payés / IK des listes de primes.
 * Si l'IA les a isolés par erreur, leurs montants sont réintégrés au brut (salaire de base).
 */
function stripBaseSalaryFromPrimeLists(bonuses: BonusLine[], nonIncluded: NonIncludedLine[]): {
  bonuses: BonusLine[]
  nonIncludedPrimes: NonIncludedLine[]
  addToBrut: number
} {
  let addToBrut = 0
  const keptBonuses: BonusLine[] = []
  const keptNonIncluded: NonIncludedLine[] = []

  for (const b of bonuses) {
    if (isBaseSalaryElementCategory(b.category, b.description ?? '')) {
      addToBrut += parseMoney(b.amount)
    } else {
      keptBonuses.push({
        ...b,
        category: normalizePrimeCategoryLabel(b.category, b.description ?? ''),
      })
    }
  }

  for (const p of nonIncluded) {
    if (isBaseSalaryElementCategory(p.category, p.description ?? '')) {
      addToBrut += parseMoney(p.amount)
    } else {
      keptNonIncluded.push({
        ...p,
        category: normalizePrimeCategoryLabel(p.category, p.description ?? ''),
      })
    }
  }

  return { bonuses: keptBonuses, nonIncludedPrimes: keptNonIncluded, addToBrut }
}

/**
 * Applique les règles métier après extraction Mistral :
 * - tickets = 8,60 € × nombre sur le bulletin ;
 * - congés payés / IK = salaire de base (dans brut/net), jamais en primes.
 */
export function normalizePayslipExtraction(raw: PayslipExtraction): PayslipExtraction {
  const ticketCount = parseCount(raw.ticketRestaurantCount)
  const ticketRestaurant =
    ticketCount != null
      ? computeTicketRestaurantAmount(ticketCount)
      : raw.ticketRestaurant

  const { bonuses, nonIncludedPrimes, addToBrut } = stripBaseSalaryFromPrimeLists(
    raw.bonuses ?? [],
    raw.nonIncludedPrimes ?? [],
  )

  let primesIndemnitesIncluses = raw.primesIndemnitesIncluses
  if (primesIndemnitesIncluses != null && addToBrut > 0) {
    const adjusted = Math.max(0, parseMoney(primesIndemnitesIncluses) - addToBrut)
    primesIndemnitesIncluses = adjusted > 0 ? toDecimalString(adjusted) : undefined
  }

  return {
    ...raw,
    brut: addMoneyField(raw.brut, addToBrut),
    ticketRestaurant,
    bonuses,
    nonIncludedPrimes,
    primesIndemnitesIncluses,
  }
}
