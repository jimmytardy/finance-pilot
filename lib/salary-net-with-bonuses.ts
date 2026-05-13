/**
 * Somme des lignes de prime saisies en base NET pour un mois (montants hors bulletin `netPaye`).
 * Les primes en BRUT ne sont pas converties ici : elles alimentent surtout le récap brut / variable brut.
 */
export function sumSerializedNetBonuses(bonuses: unknown): number {
  if (!Array.isArray(bonuses)) return 0
  let s = 0
  for (const raw of bonuses) {
    const b = raw as Record<string, unknown>
    if (String(b.basis) !== 'NET') continue
    const n = Number(b.amount)
    if (Number.isFinite(n)) s += n
  }
  return s
}
