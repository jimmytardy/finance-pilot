import { sumSerializedNetBonuses } from '@/lib/salary-net-with-bonuses'

function amount(v: unknown): number {
  const n = Number(String(v ?? 0).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Montants mensuels dérivés d’un bulletin API (sérialisé). */
export function monthIncomeAmounts(raw: Record<string, unknown>) {
  const netBulletin = amount(raw.netPaye)
  const prelevement = amount(raw.prelevementSource)
  const ticket = amount(raw.ticketRestaurant)
  const netPrimes = sumSerializedNetBonuses(raw.bonuses)

  return {
    /** Net bulletin + PAS + tickets (hors primes net saisies). */
    horsImpotsSansPrimes: netBulletin + prelevement + ticket,
    /** Net + PAS + primes net + tickets restaurant. */
    horsImpotsAvecPrimes: netBulletin + prelevement + netPrimes + ticket,
    /** Net bulletin + tickets (après PAS, hors primes net saisies). */
    avecImpotsSansPrimes: netBulletin + ticket,
    /** Net bulletin + primes net + tickets. */
    avecImpotsAvecPrimes: netBulletin + netPrimes + ticket,
  }
}

export type YearlyIncomeRecapRow = {
  year: number
  monthsWorked: number
  avgHorsImpotsSansPrimes: number
  avgHorsImpotsAvecPrimes: number
  avgAvecImpotsSansPrimes: number
  avgAvecImpotsAvecPrimes: number
}

export function yearlyIncomeRecapFromApiMonths(json: unknown): YearlyIncomeRecapRow[] {
  if (!Array.isArray(json)) return []

  const byYear = new Map<number, ReturnType<typeof monthIncomeAmounts>[]>()
  for (const raw of json) {
    const r = raw as Record<string, unknown>
    const year = Number(r.year)
    if (!Number.isFinite(year)) continue
    const list = byYear.get(year) ?? []
    list.push(monthIncomeAmounts(r))
    byYear.set(year, list)
  }

  const years = [...byYear.keys()].sort((a, b) => a - b)
  return years.map((year) => {
    const list = byYear.get(year) ?? []
    const n = list.length
    const sum = (pick: (m: ReturnType<typeof monthIncomeAmounts>) => number) =>
      list.reduce((s, m) => s + pick(m), 0)
    const avg = (pick: (m: ReturnType<typeof monthIncomeAmounts>) => number) => (n > 0 ? sum(pick) / n : 0)

    return {
      year,
      monthsWorked: n,
      avgHorsImpotsSansPrimes: avg((m) => m.horsImpotsSansPrimes),
      avgHorsImpotsAvecPrimes: avg((m) => m.horsImpotsAvecPrimes),
      avgAvecImpotsSansPrimes: avg((m) => m.avecImpotsSansPrimes),
      avgAvecImpotsAvecPrimes: avg((m) => m.avecImpotsAvecPrimes),
    }
  })
}
