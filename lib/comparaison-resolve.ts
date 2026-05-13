import type { FinanceData, SavedProject } from '@/lib/types'
import { EMPTY_FINANCE_DATA } from '@/lib/finance-defaults'
import { getFinanceMetrics } from '@/lib/finance-metrics'
import { parseMonthKey, sortMonthKeysAsc } from '@/lib/schedule-utils'

export type CompareGranularity = 'month' | 'year'

export type CompareMetrics = ReturnType<typeof getFinanceMetrics>

/** Années calendaires pour lesquelles au moins un instantané mensuel existe. */
export function uniqueYearsFromMonthKeys(monthlySnapshots: Record<string, FinanceData>): number[] {
  const ys = new Set<number>()
  for (const k of Object.keys(monthlySnapshots)) {
    const p = parseMonthKey(k)
    if (p) ys.add(p.year)
  }
  return [...ys].sort((a, b) => a - b)
}

export function monthKeysInYear(
  monthlySnapshots: Record<string, FinanceData>,
  year: number,
): string[] {
  const prefix = `${year}-`
  return sortMonthKeysAsc(Object.keys(monthlySnapshots)).filter((k) => k.startsWith(prefix))
}

/** Données financières utilisées pour la projection investissements (un instantané). */
export function resolveCompareFinanceData(params: {
  sourceId: string
  draftToken: string
  granularity: CompareGranularity
  draftMonthKey: string
  draftYear: number
  monthlySnapshots: Record<string, FinanceData>
  projects: SavedProject[]
}): FinanceData {
  const { sourceId, draftToken, granularity, draftMonthKey, draftYear, monthlySnapshots, projects } = params
  if (sourceId !== draftToken) {
    return projects.find((p) => p.id === sourceId)?.data ?? EMPTY_FINANCE_DATA
  }
  if (granularity === 'month') {
    return monthlySnapshots[draftMonthKey] ?? EMPTY_FINANCE_DATA
  }
  const keys = monthKeysInYear(monthlySnapshots, draftYear)
  if (keys.length === 0) return EMPTY_FINANCE_DATA
  return monthlySnapshots[keys[keys.length - 1]!] ?? EMPTY_FINANCE_DATA
}

/** Indicateurs des cartes : pour une année du brouillon, cumuls (soldes / disponible / locatif) sur les mois présents. */
export function resolveCompareMetrics(params: {
  sourceId: string
  draftToken: string
  granularity: CompareGranularity
  draftMonthKey: string
  draftYear: number
  monthlySnapshots: Record<string, FinanceData>
  projects: SavedProject[]
}): CompareMetrics {
  const data = resolveCompareFinanceData(params)
  if (params.sourceId !== params.draftToken || params.granularity === 'month') {
    return getFinanceMetrics(data)
  }
  const keys = monthKeysInYear(params.monthlySnapshots, params.draftYear)
  if (keys.length === 0) return getFinanceMetrics(EMPTY_FINANCE_DATA)
  let monthlyBalance = 0
  let availableToInvest = 0
  let totalRentalNetResult = 0
  for (const k of keys) {
    const m = getFinanceMetrics(params.monthlySnapshots[k]!)
    monthlyBalance += m.monthlyBalance
    availableToInvest += m.availableToInvest
    totalRentalNetResult += m.totalRentalNetResult
  }
  const last = getFinanceMetrics(params.monthlySnapshots[keys[keys.length - 1]!]!)
  return {
    ...last,
    monthlyBalance,
    availableToInvest,
    totalRentalNetResult,
  }
}
