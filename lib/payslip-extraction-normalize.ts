import {
  isBaseSalaryElementCategory,
  isNonIncludedIndemnityCategory,
  normalizeNonIncludedIndemnityCategory,
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

/** Repli : nombre de titres × valeur unitaire entreprise. */
export function computeTicketRestaurantAmount(ticketCount: number): string {
  return toDecimalString(ticketCount * TICKET_RESTAURANT_UNIT_EUR)
}

type BonusLine = NonNullable<PayslipExtraction['bonuses']>[number]
type NonIncludedLine = NonNullable<PayslipExtraction['nonIncludedPrimes']>[number]

function mergeIndemnityLinesByCategory(lines: NonIncludedLine[]): NonIncludedLine[] {
  const byCategory = new Map<string, { amount: number; descriptions: string[] }>()
  for (const line of lines) {
    const prev = byCategory.get(line.category) ?? { amount: 0, descriptions: [] }
    prev.amount += parseMoney(line.amount)
    if (line.description?.trim()) prev.descriptions.push(line.description.trim())
    byCategory.set(line.category, prev)
  }
  return [...byCategory.entries()].map(([category, { amount, descriptions }]) => ({
    category,
    description: descriptions.join(' ; '),
    amount: toDecimalString(amount),
  }))
}

/**
 * Classe IK / DFS / congés mal placés en listes de primes.
 * Ne modifie pas brut / net : ces totaux viennent des libellés récap du bulletin (déjà hors IK).
 */
function processPrimeLists(bonuses: BonusLine[], nonIncluded: NonIncludedLine[]): {
  bonuses: BonusLine[]
  nonIncludedPrimes: NonIncludedLine[]
  addCongesToBrut: number
} {
  let addCongesToBrut = 0
  const keptBonuses: BonusLine[] = []
  const keptNonIncluded: NonIncludedLine[] = []
  const indemnityLines: NonIncludedLine[] = []

  const pushIndemnity = (category: string, amount: string, description: string) => {
    const n = parseMoney(amount)
    if (n <= 0) return
    indemnityLines.push({
      category,
      description,
      amount: toDecimalString(n),
    })
  }

  for (const b of bonuses) {
    const desc = b.description ?? ''
    if (isNonIncludedIndemnityCategory(b.category, desc)) {
      pushIndemnity(normalizeNonIncludedIndemnityCategory(b.category, desc)!, b.amount, desc)
    } else if (isBaseSalaryElementCategory(b.category, desc)) {
      addCongesToBrut += parseMoney(b.amount)
    } else {
      keptBonuses.push({
        ...b,
        category: normalizePrimeCategoryLabel(b.category, desc),
      })
    }
  }

  for (const p of nonIncluded) {
    const desc = p.description ?? ''
    if (isNonIncludedIndemnityCategory(p.category, desc)) {
      pushIndemnity(normalizeNonIncludedIndemnityCategory(p.category, desc)!, p.amount, desc)
    } else if (isBaseSalaryElementCategory(p.category, desc)) {
      addCongesToBrut += parseMoney(p.amount)
    } else {
      keptNonIncluded.push({
        ...p,
        category: normalizePrimeCategoryLabel(p.category, desc),
      })
    }
  }

  const mergedIndemnities = mergeIndemnityLinesByCategory(indemnityLines)
  const nonIncludedPrimes = [...keptNonIncluded, ...mergedIndemnities]

  return { bonuses: keptBonuses, nonIncludedPrimes, addCongesToBrut }
}

/**
 * Post-traitement léger : reclasse les lignes de primes, recalcule les tickets si besoin.
 * Les montants brut / net imposable / net payé renvoyés par Mistral ne sont pas retranchés (pas de double exclusion IK).
 */
export function normalizePayslipExtraction(raw: PayslipExtraction): PayslipExtraction {
  const ticketCount = parseCount(raw.ticketRestaurantCount)
  const fromAi = parseMoney(raw.ticketRestaurant)
  const ticketRestaurant =
    fromAi > 0
      ? toDecimalString(fromAi)
      : ticketCount != null
        ? computeTicketRestaurantAmount(ticketCount)
        : raw.ticketRestaurant

  const { bonuses, nonIncludedPrimes, addCongesToBrut } = processPrimeLists(
    raw.bonuses ?? [],
    raw.nonIncludedPrimes ?? [],
  )

  let primesIndemnitesIncluses = raw.primesIndemnitesIncluses
  if (primesIndemnitesIncluses != null && addCongesToBrut > 0) {
    const adjusted = Math.max(0, parseMoney(primesIndemnitesIncluses) - addCongesToBrut)
    primesIndemnitesIncluses = adjusted > 0 ? toDecimalString(adjusted) : undefined
  }

  let brut = raw.brut
  let netImposable = raw.netImposable
  let netPaye = raw.netPaye
  if (addCongesToBrut > 0) {
    brut = addMoneyField(brut, addCongesToBrut)
    netImposable = addMoneyField(netImposable, addCongesToBrut)
    netPaye = addMoneyField(netPaye, addCongesToBrut)
  }

  return {
    ...raw,
    brut,
    netImposable,
    netPaye,
    ticketRestaurant,
    bonuses,
    nonIncludedPrimes,
    primesIndemnitesIncluses,
  }
}
