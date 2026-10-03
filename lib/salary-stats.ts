/**
 * Statistiques salariales calculées à partir des documents sérialisés (fonctions pures, utilisables
 * côté serveur comme côté client).
 *
 * « Net en poche » d'un mois, sans double comptage :
 * - argent encaissé via le bulletin : net payé + acomptes déjà versés + sommes versées hors bulletin
 *   (gestionnaire d'épargne salariale) — ces deux dernières sont retenues du net payé mais bien perçues ;
 * - + valeur des titres-restaurant (part salariale + patronale : la part salariale a été retenue du net) ;
 * - + partage de la valeur placé sur un plan, et fiches d'épargne salariale, nets de CSG/CRDS.
 * Le partage de la valeur perçu en argent est déjà dans l'argent encaissé : il en est seulement isolé
 * pour la répartition « salaire / partage de la valeur ».
 * La variante « avant impôt » ajoute le prélèvement à la source.
 */
import { categoryRole } from '@/lib/payslip-categories'
import type { PayslipDto, PayslipLineDto } from '@/lib/payslip-types'

function num(v: string | null | undefined): number {
  if (v == null) return 0
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export const PARTAGE_VALEUR_KEYS = ['prime_partage_valeur', 'interessement', 'participation', 'abondement', 'autre'] as const
export type PartageValeurKey = (typeof PARTAGE_VALEUR_KEYS)[number]

export type PartageValeurAmounts = {
  brut: number
  csgCrds: number
  net: number
  place: number
  percu: number
}

function emptyPv(): PartageValeurAmounts {
  return { brut: 0, csgCrds: 0, net: 0, place: 0, percu: 0 }
}

function emptyPvMap(): Record<PartageValeurKey, PartageValeurAmounts> {
  return Object.fromEntries(PARTAGE_VALEUR_KEYS.map((k) => [k, emptyPv()])) as Record<
    PartageValeurKey,
    PartageValeurAmounts
  >
}

function pvKey(categorie: string): PartageValeurKey {
  return (PARTAGE_VALEUR_KEYS as readonly string[]).includes(categorie)
    ? (categorie as PartageValeurKey)
    : 'autre'
}

export type CotisationAmounts = { salarial: number; patronal: number }

export type MonthStats = {
  /** `YYYY-MM` */
  key: string
  year: number
  month: number
  hasBulletin: boolean
  employerId: string | null
  brut: number
  salaireBase: number
  fixeBrut: number
  variableBrut: number
  finContratBrut: number
  netImposable: number
  netPaye: number
  pas: number
  tauxPas: number | null
  cotisationsSalariales: number
  cotisationsPatronales: number
  coutEmployeur: number | null
  cotisationsParCategorie: Record<string, CotisationAmounts>
  titresRestaurant: number
  titresRestaurantCount: number
  partageValeur: Record<PartageValeurKey, PartageValeurAmounts>
  /** Net payé hors partage de la valeur versé sur le bulletin. */
  netSalaire: number
  partageValeurPercuNet: number
  partageValeurPlaceNet: number
  netEnPocheApresImpot: number
  netEnPocheAvantImpot: number
}

export type YearStats = {
  year: number
  monthsWorked: number
  brut: number
  salaireBase: number
  fixeBrut: number
  variableBrut: number
  finContratBrut: number
  /** Part du variable dans (fixe + variable), en %. */
  partVariablePct: number | null
  avgFixeMensuel: number
  netImposable: number
  netPaye: number
  pas: number
  /** PAS total / net imposable total, en %. */
  tauxPasMoyen: number | null
  cotisationsSalariales: number
  cotisationsPatronales: number
  coutEmployeur: number
  titresRestaurant: number
  partageValeur: Record<PartageValeurKey, PartageValeurAmounts>
  netSalaire: number
  partageValeurPercuNet: number
  partageValeurPlaceNet: number
  netEnPocheApresImpot: number
  netEnPocheAvantImpot: number
  /** Évolutions vs année précédente, en %. */
  evoFixeMensuelPct: number | null
  evoVariablePct: number | null
  evoNetEnPochePct: number | null
  /** Cumul depuis le premier document. */
  cumulNetEnPocheApresImpot: number
  cumulNetEnPocheAvantImpot: number
}

export type CumulPoint = {
  key: string
  netSalaire: number
  titresRestaurant: number
  partageValeurPercu: number
  partageValeurPlace: number
  pas: number
  totalApresImpot: number
  totalAvantImpot: number
}

export type SalaryRaise = { key: string; from: number; to: number; pct: number }

export type SalaryStats = {
  months: MonthStats[]
  years: YearStats[]
  cumul: CumulPoint[]
  raises: SalaryRaise[]
}

function emptyMonth(year: number, month: number): MonthStats {
  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
    hasBulletin: false,
    employerId: null,
    brut: 0,
    salaireBase: 0,
    fixeBrut: 0,
    variableBrut: 0,
    finContratBrut: 0,
    netImposable: 0,
    netPaye: 0,
    pas: 0,
    tauxPas: null,
    cotisationsSalariales: 0,
    cotisationsPatronales: 0,
    coutEmployeur: null,
    cotisationsParCategorie: {},
    titresRestaurant: 0,
    titresRestaurantCount: 0,
    partageValeur: emptyPvMap(),
    netSalaire: 0,
    partageValeurPercuNet: 0,
    partageValeurPlaceNet: 0,
    netEnPocheApresImpot: 0,
    netEnPocheAvantImpot: 0,
  }
}

function lineNetPartageValeur(l: PayslipLineDto): number {
  return num(l.montant) - num(l.csgCrds)
}

/** L'abondement est toujours versé sur un plan d'épargne, jamais dans le net payé. */
function isPlaced(l: PayslipLineDto): boolean {
  return l.modeEpargne === 'PLACE' || l.categorie === 'abondement'
}

function applyBulletin(m: MonthStats, p: PayslipDto) {
  m.hasBulletin = true
  m.employerId = p.employerId
  m.brut += num(p.brut)
  m.netImposable += num(p.netImposable)
  m.netPaye += num(p.netPaye)
  m.pas += num(p.prelevementSource)
  m.tauxPas = p.tauxPas != null ? num(p.tauxPas) : m.tauxPas

  let hasRemunerationLines = false
  let hasCotisationLines = false
  let cotSal = 0
  let cotPat = 0
  let pvPercuNet = 0
  let pvPlaceNet = 0
  let acomptes = 0
  let horsBulletin = 0

  for (const l of p.lines) {
    switch (l.bloc) {
      case 'REMUNERATION':
      case 'FIN_CONTRAT': {
        hasRemunerationLines = true
        const a = num(l.montant)
        const role = categoryRole(l.bloc, l.categorie)
        if (l.categorie === 'salaire_base') m.salaireBase += a
        if (role === 'fixe') m.fixeBrut += a
        else if (role === 'fin_contrat') m.finContratBrut += a
        else m.variableBrut += a
        break
      }
      case 'PARTAGE_VALEUR': {
        const pv = m.partageValeur[pvKey(l.categorie)]
        const net = lineNetPartageValeur(l)
        pv.brut += num(l.montant)
        pv.csgCrds += num(l.csgCrds)
        pv.net += net
        if (isPlaced(l)) {
          pv.place += net
          pvPlaceNet += net
        } else {
          pv.percu += net
          pvPercuNet += net
        }
        break
      }
      case 'COTISATION': {
        hasCotisationLines = true
        const s = num(l.montantSalarial)
        const pa = num(l.montantPatronal)
        cotSal += s
        cotPat += pa
        const c = (m.cotisationsParCategorie[l.categorie] ??= { salarial: 0, patronal: 0 })
        c.salarial += s
        c.patronal += pa
        break
      }
      case 'AJUSTEMENT_NET': {
        if (l.categorie === 'titres_restaurant') {
          m.titresRestaurant += Math.abs(num(l.montantSalarial)) + Math.abs(num(l.montantPatronal))
          m.titresRestaurantCount += num(l.quantite)
        } else if (l.categorie === 'acompte') {
          acomptes += Math.abs(num(l.montant))
        } else if (l.categorie === 'verse_hors_bulletin') {
          horsBulletin += Math.abs(num(l.montant))
        }
        break
      }
      default:
        break
    }
  }

  // Bulletin saisi avec les seuls totaux : tout le brut est considéré comme fixe.
  if (!hasRemunerationLines) m.fixeBrut += num(p.brut)

  m.cotisationsSalariales += hasCotisationLines ? cotSal : num(p.totalCotisationsSalariales)
  m.cotisationsPatronales += hasCotisationLines ? cotPat : num(p.totalCotisationsPatronales)
  if (p.coutEmployeur != null) m.coutEmployeur = (m.coutEmployeur ?? 0) + num(p.coutEmployeur)

  // Argent encaissé via ce bulletin, dont le partage de la valeur perçu en argent. La part placée qui
  // transite par une ligne « versé hors bulletin » n'est pas de l'argent encaissé.
  const encaisse = num(p.netPaye) + acomptes + horsBulletin
  const placeViaHorsBulletin = Math.min(horsBulletin, pvPlaceNet)
  m.partageValeurPercuNet += pvPercuNet
  m.partageValeurPlaceNet += pvPlaceNet
  m.netSalaire += encaisse - pvPercuNet - placeViaHorsBulletin
}

function applyEpargneSalariale(m: MonthStats, p: PayslipDto) {
  const pvLines = p.lines.filter((l) => l.bloc === 'PARTAGE_VALEUR')
  if (pvLines.length === 0) {
    // Fiche sans détail : son net payé est considéré comme perçu.
    const net = num(p.netPaye)
    const pv = m.partageValeur.autre
    pv.brut += num(p.brut)
    pv.net += net
    pv.percu += net
    m.partageValeurPercuNet += net
    return
  }
  for (const l of pvLines) {
    const pv = m.partageValeur[pvKey(l.categorie)]
    const net = lineNetPartageValeur(l)
    pv.brut += num(l.montant)
    pv.csgCrds += num(l.csgCrds)
    pv.net += net
    if (isPlaced(l)) {
      pv.place += net
      m.partageValeurPlaceNet += net
    } else {
      pv.percu += net
      m.partageValeurPercuNet += net
    }
  }
}

export function computeMonthStats(payslips: PayslipDto[]): MonthStats[] {
  const byKey = new Map<string, MonthStats>()
  for (const p of payslips) {
    const k = `${p.year}-${String(p.month).padStart(2, '0')}`
    const m = byKey.get(k) ?? emptyMonth(p.year, p.month)
    if (p.kind === 'BULLETIN') applyBulletin(m, p)
    else applyEpargneSalariale(m, p)
    byKey.set(k, m)
  }
  const months = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key))
  for (const m of months) {
    m.netEnPocheApresImpot = m.netSalaire + m.titresRestaurant + m.partageValeurPercuNet + m.partageValeurPlaceNet
    m.netEnPocheAvantImpot = m.netEnPocheApresImpot + m.pas
  }
  return months
}

function pct(curr: number, prev: number | null | undefined): number | null {
  if (prev == null || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

export function computeYearStats(months: MonthStats[]): YearStats[] {
  const byYear = new Map<number, MonthStats[]>()
  for (const m of months) {
    const list = byYear.get(m.year) ?? []
    list.push(m)
    byYear.set(m.year, list)
  }

  const out: YearStats[] = []
  let cumulApres = 0
  let cumulAvant = 0
  for (const year of [...byYear.keys()].sort((a, b) => a - b)) {
    const list = byYear.get(year) ?? []
    const sum = (pick: (m: MonthStats) => number) => list.reduce((s, m) => s + pick(m), 0)
    const monthsWorked = list.filter((m) => m.hasBulletin).length
    const fixeBrut = sum((m) => m.fixeBrut)
    const variableBrut = sum((m) => m.variableBrut)
    const netImposable = sum((m) => m.netImposable)
    const pas = sum((m) => m.pas)
    const netEnPocheApresImpot = sum((m) => m.netEnPocheApresImpot)
    const netEnPocheAvantImpot = sum((m) => m.netEnPocheAvantImpot)
    cumulApres += netEnPocheApresImpot
    cumulAvant += netEnPocheAvantImpot

    const partageValeur = emptyPvMap()
    for (const m of list) {
      for (const k of PARTAGE_VALEUR_KEYS) {
        const src = m.partageValeur[k]
        const dst = partageValeur[k]
        dst.brut += src.brut
        dst.csgCrds += src.csgCrds
        dst.net += src.net
        dst.place += src.place
        dst.percu += src.percu
      }
    }

    const avgFixeMensuel = monthsWorked > 0 ? fixeBrut / monthsWorked : 0
    const prev = out[out.length - 1]
    out.push({
      year,
      monthsWorked,
      brut: sum((m) => m.brut),
      salaireBase: sum((m) => m.salaireBase),
      fixeBrut,
      variableBrut,
      finContratBrut: sum((m) => m.finContratBrut),
      partVariablePct: fixeBrut + variableBrut > 0 ? (variableBrut / (fixeBrut + variableBrut)) * 100 : null,
      avgFixeMensuel,
      netImposable,
      netPaye: sum((m) => m.netPaye),
      pas,
      tauxPasMoyen: netImposable > 0 ? (pas / netImposable) * 100 : null,
      cotisationsSalariales: sum((m) => m.cotisationsSalariales),
      cotisationsPatronales: sum((m) => m.cotisationsPatronales),
      coutEmployeur: sum((m) => m.coutEmployeur ?? 0),
      titresRestaurant: sum((m) => m.titresRestaurant),
      partageValeur,
      netSalaire: sum((m) => m.netSalaire),
      partageValeurPercuNet: sum((m) => m.partageValeurPercuNet),
      partageValeurPlaceNet: sum((m) => m.partageValeurPlaceNet),
      netEnPocheApresImpot,
      netEnPocheAvantImpot,
      evoFixeMensuelPct: pct(avgFixeMensuel, prev?.avgFixeMensuel),
      evoVariablePct: pct(variableBrut, prev?.variableBrut),
      evoNetEnPochePct: pct(netEnPocheApresImpot, prev?.netEnPocheApresImpot),
      cumulNetEnPocheApresImpot: cumulApres,
      cumulNetEnPocheAvantImpot: cumulAvant,
    })
  }
  return out
}

/** Série cumulée mois par mois de ce qui a été perçu. */
export function computeCumul(months: MonthStats[]): CumulPoint[] {
  const acc = { netSalaire: 0, titresRestaurant: 0, partageValeurPercu: 0, partageValeurPlace: 0, pas: 0 }
  return months.map((m) => {
    acc.netSalaire += m.netSalaire
    acc.titresRestaurant += m.titresRestaurant
    acc.partageValeurPercu += m.partageValeurPercuNet
    acc.partageValeurPlace += m.partageValeurPlaceNet
    acc.pas += m.pas
    const totalApresImpot = acc.netSalaire + acc.titresRestaurant + acc.partageValeurPercu + acc.partageValeurPlace
    return {
      key: m.key,
      netSalaire: round2(acc.netSalaire),
      titresRestaurant: round2(acc.titresRestaurant),
      partageValeurPercu: round2(acc.partageValeurPercu),
      partageValeurPlace: round2(acc.partageValeurPlace),
      pas: round2(acc.pas),
      totalApresImpot: round2(totalApresImpot),
      totalAvantImpot: round2(totalApresImpot + acc.pas),
    }
  })
}

/**
 * Changements du salaire de base mensuel d'un bulletin à l'autre.
 * Les mois incomplets (entrée, sortie, absences) faussent le montant : seuls les mois
 * sans ligne d'absence ni de fin de contrat sont comparés.
 */
export function detectRaises(payslips: PayslipDto[]): SalaryRaise[] {
  const bulletins = payslips
    .filter((p) => p.kind === 'BULLETIN')
    .sort((a, b) => a.year - b.year || a.month - b.month)
  const out: SalaryRaise[] = []
  let prev: number | null = null
  for (const p of bulletins) {
    const baseLines = p.lines.filter((l) => l.bloc === 'REMUNERATION' && l.categorie === 'salaire_base')
    const incomplete = p.lines.some(
      (l) => (l.bloc === 'REMUNERATION' && l.categorie === 'absence') || l.bloc === 'FIN_CONTRAT',
    )
    if (baseLines.length === 0 || incomplete) continue
    const base = baseLines.reduce((s, l) => s + num(l.montant), 0)
    if (prev != null && Math.abs(base - prev) >= 0.01) {
      out.push({
        key: `${p.year}-${String(p.month).padStart(2, '0')}`,
        from: prev,
        to: base,
        pct: ((base - prev) / prev) * 100,
      })
    }
    prev = base
  }
  return out
}

export function computeSalaryStats(payslips: PayslipDto[]): SalaryStats {
  const months = computeMonthStats(payslips)
  return {
    months,
    years: computeYearStats(months),
    cumul: computeCumul(months),
    raises: detectRaises(payslips),
  }
}

export type EmployerSalaryStats = {
  employerId: string
  name: string
  monthCount: number
  averageNetPaye: number
  byYear: { year: number; averageNetPaye: number; totalNetPaye: number }[]
}

/** Net payé moyen par employeur (bulletins uniquement). */
export function employerStats(
  employers: { id: string; name: string }[],
  payslips: { employerId: string | null; kind: string; year: number; netPaye: string }[],
): EmployerSalaryStats[] {
  return employers.map((e) => {
    const list = payslips.filter((p) => p.employerId === e.id && p.kind === 'BULLETIN')
    const total = list.reduce((s, p) => s + num(p.netPaye), 0)
    const byY = new Map<number, number[]>()
    for (const p of list) {
      const arr = byY.get(p.year) ?? []
      arr.push(num(p.netPaye))
      byY.set(p.year, arr)
    }
    return {
      employerId: e.id,
      name: e.name,
      monthCount: list.length,
      averageNetPaye: list.length === 0 ? 0 : total / list.length,
      byYear: [...byY.keys()]
        .sort((a, b) => a - b)
        .map((year) => {
          const arr = byY.get(year) ?? []
          const totalNetPaye = arr.reduce((s, n) => s + n, 0)
          return { year, averageNetPaye: arr.length ? totalNetPaye / arr.length : 0, totalNetPaye }
        }),
    }
  })
}
