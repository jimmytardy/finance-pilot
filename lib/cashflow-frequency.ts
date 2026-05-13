import type { CashflowFrequency } from '@/lib/types'

/** Équivalent mensuel pour agrégats (totaux, graphiques, gestion mensuelle). */
export function toMonthlyCashflowAmount(amount: number, frequency: CashflowFrequency): number {
  if (frequency === 'annual') return amount / 12
  if (frequency === 'quarterly') return amount / 3
  return amount
}

/** Jour du mois valide pour planification : vide ou invalide → 1. */
export function normalizeDayOfMonth(day: number): number {
  if (typeof day !== 'number' || !Number.isFinite(day)) return 1
  const d = Math.floor(day)
  if (d < 1 || d > 31) return 1
  return d
}
