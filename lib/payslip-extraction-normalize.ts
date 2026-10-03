import { reclassifyLine, TICKET_RESTAURANT_UNIT_EUR } from '@/lib/payslip-extraction-constants'
import {
  payslipExtractionLineSchema,
  type PayslipExtractionRaw,
} from '@/lib/payslip-extraction-schema'
import { checkPayslipConsistency, type PayslipWarning } from '@/lib/payslip-consistency'
import type { PayslipDraft, PayslipLineDto } from '@/lib/payslip-types'

export type { PayslipWarning }

function parseMoney(v: string | null | undefined): number {
  if (v == null) return 0
  const n = Number(String(v).replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

function toDecimalString(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}


function normalizeLine(raw: unknown): PayslipLineDto | null {
  const parsed = payslipExtractionLineSchema.safeParse(raw)
  if (!parsed.success) return null
  const l = parsed.data
  const { bloc, categorie } = reclassifyLine(l.bloc, l.categorie, l.libelle)
  const line: PayslipLineDto = {
    bloc,
    categorie,
    libelle: l.libelle.trim(),
    base: l.base,
    quantite: l.quantite,
    tauxSalarial: l.tauxSalarial,
    montantSalarial: l.montantSalarial,
    tauxPatronal: l.tauxPatronal,
    montantPatronal: l.montantPatronal,
    montant: l.montant,
    frequence: null,
    regimeSocial: null,
    imposable: null,
    exonerationIr: null,
    verseEnNumeraire: !(bloc === 'REMUNERATION' && categorie === 'avantage_nature'),
    modeEpargne: bloc === 'PARTAGE_VALEUR' ? (l.modeEpargne ?? 'INCONNU') : null,
    csgCrds: l.csgCrds,
    periodeRattachement: l.periodeRattachement,
  }

  // Titres-restaurant sans montants : repli nombre × valeur unitaire.
  if (
    categorie === 'titres_restaurant' &&
    line.montantSalarial == null &&
    line.montantPatronal == null &&
    line.quantite != null
  ) {
    line.montantPatronal = toDecimalString(parseMoney(line.quantite) * TICKET_RESTAURANT_UNIT_EUR)
  }

  return line
}

/** Transforme la réponse validée de l'IA en brouillon éditable + avertissements de cohérence. */
export function normalizePayslipExtraction(
  raw: PayslipExtractionRaw,
  extractedBy: string,
): { draft: PayslipDraft; warnings: PayslipWarning[] } {
  const lines = raw.lines.map(normalizeLine).filter((l): l is PayslipLineDto => l != null)
  const today = new Date()
  const cumuls = raw.cumuls
    ? Object.fromEntries(Object.entries(raw.cumuls).filter((e): e is [string, string] => e[1] != null))
    : null

  const draft: PayslipDraft = {
    kind: raw.kind,
    year: raw.year ?? today.getFullYear(),
    month: raw.month ?? today.getMonth() + 1,
    label: raw.label,
    brut: raw.brut,
    netAvantImpot: raw.netAvantImpot,
    netImposable: raw.netImposable,
    netSocial: raw.netSocial,
    netPaye: raw.netPaye,
    prelevementSource: raw.prelevementSource,
    tauxPas: raw.tauxPas,
    totalCotisationsSalariales: raw.totalCotisationsSalariales,
    totalCotisationsPatronales: raw.totalCotisationsPatronales,
    coutEmployeur: raw.coutEmployeur,
    heuresTravaillees: raw.heuresTravaillees,
    plafondSS: raw.plafondSS,
    cumuls: cumuls && Object.keys(cumuls).length > 0 ? cumuls : null,
    notes: raw.notes,
    extractedBy,
    lines,
  }

  return { draft, warnings: checkPayslipConsistency(draft) }
}
