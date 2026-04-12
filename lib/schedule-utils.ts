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
