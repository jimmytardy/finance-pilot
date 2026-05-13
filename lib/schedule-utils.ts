/** Jour calendaire effectif dans le mois (ex. 31 → 28 en février). */
export function effectiveDayInMonth(year: number, monthIndex: number, preferredDay: number): number {
  const dim = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(Math.max(1, Math.floor(preferredDay)), dim)
}

/** Prélèvement auto : la date d’échéance du mois n’est pas encore passée (jour courant < jour d’échéance). */
export function isAutomaticDebitStillAheadThisMonth(dayOfMonth: number, ref = new Date()): boolean {
  const due = effectiveDayInMonth(ref.getFullYear(), ref.getMonth(), dayOfMonth)
  return ref.getDate() < due
}

/** Échéance le jour même (prélèvement auto prévu aujourd’hui). */
export function isAutomaticDebitDueToday(dayOfMonth: number, ref = new Date()): boolean {
  const due = effectiveDayInMonth(ref.getFullYear(), ref.getMonth(), dayOfMonth)
  return ref.getDate() === due
}

/** Prélèvement auto déjà « passé » ce mois (jour courant > jour d’échéance). */
export function isAutomaticDebitPastThisMonth(dayOfMonth: number, ref = new Date()): boolean {
  const due = effectiveDayInMonth(ref.getFullYear(), ref.getMonth(), dayOfMonth)
  return ref.getDate() > due
}

export type ManualDueStatus = 'past' | 'today' | 'ahead'

/** Virement / paiement manuel : position par rapport à l’échéance du mois courant. */
export function manualTransferDueStatus(dayOfMonth: number, ref = new Date()): ManualDueStatus {
  const due = effectiveDayInMonth(ref.getFullYear(), ref.getMonth(), dayOfMonth)
  if (ref.getDate() > due) return 'past'
  if (ref.getDate() === due) return 'today'
  return 'ahead'
}

export function monthKeyFromDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_KEY_RE = /^(\d{4})-(\d{2})$/

export function parseMonthKey(key: string): { year: number; monthIndex: number } | null {
  const m = MONTH_KEY_RE.exec(key.trim())
  if (!m) return null
  const year = Number(m[1])
  const monthNum = Number(m[2])
  if (!Number.isFinite(year) || monthNum < 1 || monthNum > 12) return null
  return { year, monthIndex: monthNum - 1 }
}

export function monthKeyFromParts(year: number, month1to12: number): string {
  return `${year}-${String(month1to12).padStart(2, '0')}`
}

export function sortMonthKeysAsc(keys: string[]): string[] {
  return [...keys].filter((k) => parseMonthKey(k)).sort((a, b) => a.localeCompare(b))
}

/** Libellé localisé pour une clé mois `YYYY-MM` (ex. mars 2026). */
export function formatMonthKeyLabel(monthKey: string, locale: string): string {
  const p = parseMonthKey(monthKey)
  if (!p) return monthKey
  return new Date(p.year, p.monthIndex, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Date de référence pour classer échéances (gestion mensuelle) selon le mois budgétaire affiché :
 * mois courant réel si c’est le mois actif, sinon fin du mois passé ou début du mois futur.
 */
export function referenceDateForBudgetMonth(monthKey: string, today = new Date()): Date {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) return today
  const { year, monthIndex } = parsed
  if (year === today.getFullYear() && monthIndex === today.getMonth()) return today
  const startOfBudget = new Date(year, monthIndex, 1).getTime()
  if (startOfBudget < new Date(today.getFullYear(), today.getMonth(), 1).getTime()) {
    return new Date(year, monthIndex + 1, 0)
  }
  return new Date(year, monthIndex, 1)
}
