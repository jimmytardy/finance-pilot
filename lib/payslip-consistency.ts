import type { PayslipDraft, PayslipLineDto } from '@/lib/payslip-types'

/** Écart toléré (arrondis) pour les contrôles de cohérence, en euros. */
const TOLERANCE_EUR = 1

export type PayslipWarning = {
  code: 'brut_mismatch' | 'cotisations_mismatch' | 'net_paye_mismatch' | 'pas_mismatch'
  expected: number
  actual: number
}

function parseMoney(v: string | null | undefined): number {
  if (v == null) return 0
  const n = Number(String(v).replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

function differs(a: number, b: number): boolean {
  return Math.abs(a - b) > TOLERANCE_EUR
}

function sumLines(lines: PayslipLineDto[], pick: (l: PayslipLineDto) => string | null, filter: (l: PayslipLineDto) => boolean) {
  return lines.filter(filter).reduce((s, l) => s + parseMoney(pick(l)), 0)
}

/**
 * Contrôles de cohérence entre totaux recopiés et lignes extraites.
 * Purement informatifs : affichés à la relecture, jamais bloquants.
 */
export function checkPayslipConsistency(d: Pick<PayslipDraft, 'kind' | 'lines' | 'brut' | 'netAvantImpot' | 'netImposable' | 'netPaye' | 'prelevementSource' | 'tauxPas' | 'totalCotisationsSalariales'>): PayslipWarning[] {
  if (d.kind !== 'BULLETIN') return []
  const warnings: PayslipWarning[] = []
  const brut = parseMoney(d.brut)

  const remuneration = sumLines(d.lines, (l) => l.montant, (l) => l.bloc === 'REMUNERATION' || l.bloc === 'FIN_CONTRAT')
  if (remuneration !== 0) {
    // Selon les logiciels, la PPV est incluse ou non dans le « Salaire brut ».
    const withPv = remuneration + sumLines(d.lines, (l) => l.montant, (l) => l.bloc === 'PARTAGE_VALEUR')
    if (differs(remuneration, brut) && differs(withPv, brut)) {
      warnings.push({ code: 'brut_mismatch', expected: brut, actual: remuneration })
    }
  }

  const cotisations = sumLines(d.lines, (l) => l.montantSalarial, (l) => l.bloc === 'COTISATION')
  if (d.totalCotisationsSalariales != null && cotisations !== 0) {
    const total = parseMoney(d.totalCotisationsSalariales)
    if (differs(cotisations, total)) warnings.push({ code: 'cotisations_mismatch', expected: total, actual: cotisations })
  }

  const pas = parseMoney(d.prelevementSource)
  const netAvantImpot = parseMoney(d.netAvantImpot)
  const netPaye = parseMoney(d.netPaye)
  if (netAvantImpot > 0 && netPaye > 0) {
    // Selon les logiciels, les ajustements (titres-restaurant, IK…) sont placés avant ou après le PAS.
    const ajustements = sumLines(d.lines, (l) => l.montant, (l) => l.bloc === 'AJUSTEMENT_NET')
    const sansAjustements = netAvantImpot - pas
    if (differs(sansAjustements, netPaye) && differs(sansAjustements + ajustements, netPaye)) {
      warnings.push({ code: 'net_paye_mismatch', expected: netPaye, actual: sansAjustements })
    }
  }

  if (d.tauxPas != null) {
    const computed = (parseMoney(d.netImposable) * parseMoney(d.tauxPas)) / 100
    if (differs(computed, pas)) warnings.push({ code: 'pas_mismatch', expected: pas, actual: computed })
  }

  return warnings
}
