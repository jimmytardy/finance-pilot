import {
  foldAccents,
  isIgnoredLabel,
  reclassifyLine,
  TICKET_RESTAURANT_UNIT_EUR,
} from '@/lib/payslip-extraction-constants'
import {
  payslipExtractionLineSchema,
  type PayslipExtractionRaw,
} from '@/lib/payslip-extraction-schema'
import { checkPayslipConsistency, type PayslipWarning } from '@/lib/payslip-consistency'
import type { PayslipBlocId } from '@/lib/payslip-categories'
import type { PayslipDraft, PayslipLineDto } from '@/lib/payslip-types'

export type { PayslipWarning }

/** Écart toléré (arrondis) pour les corrections de signe, en euros. */
const TOLERANCE_EUR = 1

/** Blocs dont le montant est un gain, à lire dans `montant`. */
const GAIN_BLOCS: PayslipBlocId[] = ['REMUNERATION', 'FIN_CONTRAT', 'PARTAGE_VALEUR']

/** Ajustements après le net toujours ajoutés au net (remboursements, indemnités). */
const AJUSTEMENTS_POSITIFS = new Set(['frais_pro', 'transport', 'ijss'])
/** Ajustements après le net toujours retenus. */
const AJUSTEMENTS_NEGATIFS = new Set([
  'acompte',
  'verse_hors_bulletin',
  'saisie',
  'versement_volontaire_pee',
  'reprise_avantage_nature',
])

function parseMoney(v: string | null | undefined): number {
  if (v == null) return 0
  const n = Number(String(v).replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

function toDecimalString(n: number): string {
  return Number.isFinite(n) ? n.toFixed(2) : '0.00'
}

function abs(v: string | null): string | null {
  return v == null ? null : toDecimalString(Math.abs(parseMoney(v)))
}

function negate(v: string | null): string | null {
  return v == null ? null : toDecimalString(-parseMoney(v))
}

/** Élément du brut retenu (congés pris, absence) : quantité ou base négative, ou libellé explicite. */
function isRetenueSurBrut(l: PayslipLineDto): boolean {
  if (l.categorie === 'salaire_base') return false
  if (parseMoney(l.quantite) < 0 || parseMoney(l.base) < 0) return true
  return /\b(pris|absence|absences|retenue|deduction)\b/.test(foldAccents(l.libelle))
}

function hasAmount(l: PayslipLineDto): boolean {
  return [l.montant, l.montantSalarial, l.montantPatronal].some((v) => v != null && parseMoney(v) !== 0)
}

function sum(lines: PayslipLineDto[], pick: (l: PayslipLineDto) => string | null): number {
  return lines.reduce((s, l) => s + parseMoney(pick(l)), 0)
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE_EUR
}

/**
 * Remet chaque montant dans la bonne colonne avec le bon signe, quel que soit le format du logiciel
 * de paie (certains impriment les gains dans la colonne « part salarié », ou les retenues en négatif).
 */
function fixLineAmounts(line: PayslipLineDto): PayslipLineDto {
  const l = { ...line }

  if (GAIN_BLOCS.includes(l.bloc)) {
    if (l.montant == null) l.montant = l.montantSalarial
    l.montantSalarial = null
    l.montantPatronal = null
    // Une retenue sur brut peut être imprimée en positif dans la colonne « À déduire ».
    if (l.bloc === 'REMUNERATION' && isRetenueSurBrut(l)) l.montant = negate(abs(l.montant))
    return l
  }

  if (l.bloc === 'IMPOT') {
    l.montantSalarial = abs(l.montantSalarial ?? l.montant)
    l.montant = null
    return l
  }

  if (l.bloc === 'AJUSTEMENT_NET') {
    if (l.categorie === 'titres_restaurant') {
      l.montantSalarial = abs(l.montantSalarial)
      l.montantPatronal = abs(l.montantPatronal)
      l.montant = l.montantSalarial == null ? null : negate(l.montantSalarial)
      return l
    }
    if (l.montant == null) l.montant = l.montantSalarial
    l.montantSalarial = null
    l.montantPatronal = null
    if (AJUSTEMENTS_POSITIFS.has(l.categorie)) l.montant = abs(l.montant)
    else if (AJUSTEMENTS_NEGATIFS.has(l.categorie)) l.montant = negate(abs(l.montant))
  }

  return l
}

/**
 * Logiciels qui impriment les cotisations en négatif : si la somme des parts salariales vaut
 * l'opposé du total imprimé, toutes les cotisations sont inversées (idem côté employeur).
 */
function fixCotisationSigns(lines: PayslipLineDto[], totalSal: string | null, totalPat: string | null) {
  const cot = lines.filter((l) => l.bloc === 'COTISATION')
  const sal = sum(cot, (l) => l.montantSalarial)
  const pat = sum(cot, (l) => l.montantPatronal)
  const flipSal = sal < 0 && (totalSal == null || close(-sal, Math.abs(parseMoney(totalSal))))
  const flipPat = pat < 0 && (totalPat == null || close(-pat, Math.abs(parseMoney(totalPat))))
  if (!flipSal && !flipPat) return
  for (const l of cot) {
    if (flipSal) l.montantSalarial = negate(l.montantSalarial)
    if (flipPat) l.montantPatronal = negate(l.montantPatronal)
  }
}

const COTISATION_FIELDS = ['base', 'tauxSalarial', 'montantSalarial', 'tauxPatronal', 'montantPatronal'] as const

/**
 * Une ligne imprimée « Mutuelle | Forfait » est parfois découpée en deux lignes consécutives de même
 * libellé, chacune portant une partie des colonnes : on les refusionne quand leurs champs ne se recouvrent pas.
 */
function mergeSplitCotisations(lines: PayslipLineDto[]): PayslipLineDto[] {
  const out: PayslipLineDto[] = []
  for (const l of lines) {
    const prev = out[out.length - 1]
    const mergeable =
      prev != null &&
      prev.bloc === 'COTISATION' &&
      l.bloc === 'COTISATION' &&
      foldAccents(prev.libelle) === foldAccents(l.libelle) &&
      COTISATION_FIELDS.every((f) => prev[f] == null || l[f] == null)
    if (mergeable) {
      for (const f of COTISATION_FIELDS) prev[f] = prev[f] ?? l[f]
    } else {
      out.push(l)
    }
  }
  return out
}

/**
 * Variante de découpage où les deux montants d'une ligne (« Mutuelle | Forfait 48,92 48,93 ») sont tous
 * deux rangés côté employeur, sur deux lignes consécutives de même libellé. Si reprendre le premier
 * comme part salarié fait tomber la somme salariale exactement sur le total imprimé, on fusionne.
 */
function fixSplitPatronalPairs(lines: PayslipLineDto[], totalSal: string | null): PayslipLineDto[] {
  if (totalSal == null) return lines
  const total = Math.abs(parseMoney(totalSal))
  const out = [...lines]
  for (let i = 0; i < out.length - 1; i++) {
    const sal = sum(out.filter((l) => l.bloc === 'COTISATION'), (l) => l.montantSalarial)
    if (close(sal, total)) break
    const a = out[i]
    const b = out[i + 1]
    const pair =
      a.bloc === 'COTISATION' &&
      b.bloc === 'COTISATION' &&
      foldAccents(a.libelle) === foldAccents(b.libelle) &&
      a.montantSalarial == null &&
      b.montantSalarial == null &&
      a.montantPatronal != null &&
      b.montantPatronal != null
    if (pair && close(sal + parseMoney(a.montantPatronal), total)) {
      out[i] = { ...a, montantSalarial: a.montantPatronal, montantPatronal: b.montantPatronal, base: a.base ?? b.base }
      out.splice(i + 1, 1)
    }
  }
  return out
}

/**
 * L'IA recopie parfois la part employeur dans la part salarié sur une ligne qui n'a qu'une part.
 * Correction guidée par le total imprimé : on retire ces doublons seulement si la somme des parts
 * salariales retombe alors exactement sur le « Total des cotisations ».
 */
function fixDuplicatedSalarial(lines: PayslipLineDto[], totalSal: string | null) {
  if (totalSal == null) return
  const total = Math.abs(parseMoney(totalSal))
  const cot = lines.filter((l) => l.bloc === 'COTISATION')
  const sal = sum(cot, (l) => l.montantSalarial)
  if (close(sal, total)) return
  const doublons = cot.filter(
    (l) =>
      l.montantSalarial != null &&
      l.tauxSalarial == null &&
      l.tauxPatronal != null &&
      close(parseMoney(l.montantSalarial), parseMoney(l.montantPatronal)),
  )
  if (close(sal - sum(doublons, (l) => l.montantSalarial), total)) {
    for (const l of doublons) l.montantSalarial = null
  }
}

/**
 * Partage de la valeur versé hors bulletin : le bulletin imprime le brut (+) et sa contrepartie
 * nette (−). On garde une ligne de partage de la valeur (brut, CSG/CRDS = brut − net) et la
 * contrepartie en ajustement « versé hors bulletin ».
 */
function linkHorsBulletin(lines: PayslipLineDto[]) {
  const offsets = lines.filter((l) => l.categorie === 'verse_hors_bulletin')
  for (const offset of offsets) {
    const net = Math.abs(parseMoney(offset.montant))
    const brutLine = lines.find(
      (l) => l.bloc === 'PARTAGE_VALEUR' && foldAccents(l.libelle).includes('hors bulletin') && parseMoney(l.montant) >= net,
    )
    if (brutLine && brutLine.csgCrds == null) {
      brutLine.csgCrds = toDecimalString(parseMoney(brutLine.montant) - net)
    }
  }
}

function normalizeLine(raw: unknown): PayslipLineDto | null {
  const parsed = payslipExtractionLineSchema.safeParse(raw)
  if (!parsed.success) return null
  const l = parsed.data
  if (isIgnoredLabel(l.libelle)) return null
  const { bloc, categorie } = reclassifyLine(l.bloc, l.categorie, l.libelle)
  const line = fixLineAmounts({
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
    csgCrds: bloc === 'PARTAGE_VALEUR' ? abs(l.csgCrds) : null,
    periodeRattachement: l.periodeRattachement,
  })

  // Titres-restaurant sans montants : repli nombre × valeur unitaire.
  if (
    categorie === 'titres_restaurant' &&
    line.montantSalarial == null &&
    line.montantPatronal == null &&
    line.quantite != null
  ) {
    line.montantPatronal = toDecimalString(parseMoney(line.quantite) * TICKET_RESTAURANT_UNIT_EUR)
  }

  // Lignes de texte ou d'information sans montant (ex. « 2 jours de RTT les 24 et 31 déc »).
  if (!hasAmount(line) && categorie !== 'titres_restaurant') return null
  return line
}

/** Transforme la réponse validée de l'IA en brouillon éditable + avertissements de cohérence. */
export function normalizePayslipExtraction(
  raw: PayslipExtractionRaw,
  extractedBy: string,
): { draft: PayslipDraft; warnings: PayslipWarning[] } {
  const lines = mergeSplitCotisations(raw.lines.map(normalizeLine).filter((l): l is PayslipLineDto => l != null))
  fixCotisationSigns(lines, raw.totalCotisationsSalariales, raw.totalCotisationsPatronales)
  fixDuplicatedSalarial(lines, raw.totalCotisationsSalariales)
  const fixedLines = fixSplitPatronalPairs(lines, raw.totalCotisationsSalariales)
  linkHorsBulletin(fixedLines)

  const today = new Date()
  const cumuls = raw.cumuls
    ? Object.fromEntries(Object.entries(raw.cumuls).filter((e): e is [string, string] => e[1] != null))
    : null

  const abs2 = (v: string) => toDecimalString(Math.abs(parseMoney(v)))
  const absOrNull = (v: string | null) => (v == null ? null : abs2(v))
  const prelevementSource = abs2(raw.prelevementSource)

  // Bulletins sans ligne « Net à payer avant impôt » : il vaut net payé + PAS, à ajustements près.
  let netAvantImpot = raw.netAvantImpot
  const pas = parseMoney(prelevementSource)
  const netPaye = parseMoney(raw.netPaye)
  const ajustements = sum(fixedLines.filter((l) => l.bloc === 'AJUSTEMENT_NET'), (l) => l.montant)
  const nai = parseMoney(netAvantImpot)
  if (raw.kind === 'BULLETIN' && netPaye > 0 && !close(nai - pas, netPaye) && !close(nai - pas + ajustements, netPaye)) {
    netAvantImpot = toDecimalString(netPaye + pas)
  }

  const draft: PayslipDraft = {
    kind: raw.kind,
    year: raw.year ?? today.getFullYear(),
    month: raw.month ?? today.getMonth() + 1,
    label: raw.label,
    brut: raw.brut,
    netAvantImpot,
    netImposable: raw.netImposable,
    netSocial: raw.netSocial,
    netPaye: raw.netPaye,
    prelevementSource,
    tauxPas: absOrNull(raw.tauxPas),
    totalCotisationsSalariales: absOrNull(raw.totalCotisationsSalariales),
    totalCotisationsPatronales: absOrNull(raw.totalCotisationsPatronales),
    coutEmployeur: raw.coutEmployeur,
    heuresTravaillees: raw.heuresTravaillees,
    plafondSS: raw.plafondSS,
    cumuls: cumuls && Object.keys(cumuls).length > 0 ? cumuls : null,
    notes: raw.notes,
    extractedBy,
    lines: fixedLines,
  }

  return { draft, warnings: checkPayslipConsistency(draft) }
}
