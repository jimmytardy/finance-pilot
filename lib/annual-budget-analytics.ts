import type { CashflowFrequency, FinanceData } from '@/lib/types'
import { toMonthlyCashflowAmount } from '@/lib/cashflow-frequency'
import { getFinanceMetrics } from '@/lib/finance-metrics'
import { monthKeyFromParts } from '@/lib/schedule-utils'

const UNCATEGORIZED = '__uncategorized__'

/** Clé de série pour le « reste à vivre » (courbes trimestrielles, hors noms de catégories). */
export const QUARTER_RESTE_A_VIVRE_DATA_KEY = '__reste_a_vivre__'

function toMonthlyAmount(e: { amount: number; frequency: CashflowFrequency }): number {
  return toMonthlyCashflowAmount(e.amount, e.frequency)
}

/** Montants mensuels par catégorie (charges + budgets annexes avec planification). */
export function scheduledCategoryMonthlyTotals(data: FinanceData): Map<string, number> {
  const map = new Map<string, number>()
  const add = (rawCat: string, amt: number) => {
    const k = rawCat.trim() || UNCATEGORIZED
    map.set(k, (map.get(k) ?? 0) + amt)
  }
  for (const e of data.fixedExpenses) {
    if (!e.schedule) continue
    add(e.schedule.category, toMonthlyAmount(e))
  }
  for (const b of data.annexBudgets) {
    if (!b.schedule) continue
    add(b.schedule.category, toMonthlyAmount(b))
  }
  return map
}

export function totalScheduledMonthlyExpenses(data: FinanceData): number {
  let s = 0
  for (const v of scheduledCategoryMonthlyTotals(data).values()) s += v
  return s
}

export type YearMonthSlice = {
  monthKey: string
  /** Libellé court pour axe X (ex. janv.) */
  shortLabel: string
  byCategory: Map<string, number>
  total: number
}

export function buildYearSlices(
  monthlySnapshots: Record<string, FinanceData>,
  year: number,
  locale: string,
): YearMonthSlice[] {
  const keys = Object.keys(monthlySnapshots)
    .filter((k) => k.startsWith(`${year}-`))
    .sort((a, b) => a.localeCompare(b))

  return keys.map((monthKey) => {
    const data = monthlySnapshots[monthKey]!
    const byCategory = scheduledCategoryMonthlyTotals(data)
    let total = 0
    for (const v of byCategory.values()) total += v
    const parts = monthKey.split('-').map(Number)
    const m = parts[1] ?? 1
    const d = new Date(year, m - 1, 1)
    const shortLabel = d.toLocaleDateString(locale, { month: 'short' })
    return { monthKey, shortLabel, byCategory, total }
  })
}

/** Totaux sur l’année (somme des mois pour lesquels un instantané existe). */
export function aggregateYearCategoryTotals(
  monthlySnapshots: Record<string, FinanceData>,
  year: number,
): Map<string, number> {
  const out = new Map<string, number>()
  for (let m = 1; m <= 12; m++) {
    const key = monthKeyFromParts(year, m)
    const data = monthlySnapshots[key]
    if (!data) continue
    for (const [cat, v] of scheduledCategoryMonthlyTotals(data)) {
      out.set(cat, (out.get(cat) ?? 0) + v)
    }
  }
  return out
}

export function categoryLabel(catKey: string, uncategorizedLabel: string): string {
  return catKey === UNCATEGORIZED || catKey === '' ? uncategorizedLabel : catKey
}

export type QuarterNumber = 1 | 2 | 3 | 4

const QUARTER_MONTHS: Record<QuarterNumber, number[]> = {
  1: [1, 2, 3],
  2: [4, 5, 6],
  3: [7, 8, 9],
  4: [10, 11, 12],
}

export type QuarterAggregate = {
  quarter: QuarterNumber
  /** Mois 1–12 ayant un instantané dans ce trimestre */
  monthsPresent: number[]
  byCategory: Map<string, number>
  /** Somme des totaux mensuels planifiés des mois présents */
  total: number
  /** Somme des soldes mensuels (`monthlyBalance`) sur les mois présents */
  resteAVivre: number
}

/** Agrège les dépenses planifiées par catégorie pour chaque trimestre d’une année. */
export function buildQuarterAggregates(
  monthlySnapshots: Record<string, FinanceData>,
  year: number,
): QuarterAggregate[] {
  const out: QuarterAggregate[] = []
  for (let q = 1; q <= 4; q++) {
    const quarter = q as QuarterNumber
    const months = QUARTER_MONTHS[quarter]
    const byCategory = new Map<string, number>()
    let total = 0
    let resteAVivre = 0
    const monthsPresent: number[] = []
    for (const m of months) {
      const key = monthKeyFromParts(year, m)
      const data = monthlySnapshots[key]
      if (!data) continue
      monthsPresent.push(m)
      resteAVivre += getFinanceMetrics(data).monthlyBalance
      const monthMap = scheduledCategoryMonthlyTotals(data)
      for (const [cat, v] of monthMap) {
        byCategory.set(cat, (byCategory.get(cat) ?? 0) + v)
      }
      total += totalScheduledMonthlyExpenses(data)
    }
    out.push({ quarter, monthsPresent, byCategory, total, resteAVivre })
  }
  return out
}
