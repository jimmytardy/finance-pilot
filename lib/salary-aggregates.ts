import type { Prisma } from '@prisma/client'
import type { SalaryBonus, SalaryMonth } from '@prisma/client'

function num(d: Prisma.Decimal): number {
  return Number(d.toString())
}

/**
 * Brut « récap » pour un mois : montant bulletin + primes / indemnités **non incluses** au brut.
 * `primesIndemnitesIncluses` est déjà dans `brut` → ne jamais l’ajouter ici (évite le double comptage).
 */
export function monthBrutTotalRecap(m: SalaryMonth): number {
  return num(m.brut) + num(m.primesIndemnitesNonIncluses)
}

export type SalaryMonthWithBonuses = SalaryMonth & { bonuses: SalaryBonus[] }

/**
 * Total « net hors impôts » (poche + titres restaurant), par année.
 * Ajustable métier : voir plan module Salaires.
 */
export function totalNetHorsImpots(months: SalaryMonth[]): number {
  return months.reduce((s, m) => s + num(m.netPaye) + num(m.ticketRestaurant), 0)
}

export function aggregateByYear(months: SalaryMonthWithBonuses[]): {
  year: number
  netImposable: number
  netPaye: number
  prelevementSource: number
  fixeBrut: number
  variableBrut: number
  variableNet: number
  totalBrut: number
  totalNet: number
  totalNetHorsImpots: number
  /** Nombre de bulletins sur l’année (mois travaillés). */
  monthsWorked: number
  avgNetPaye: number
  avgTotalNetHorsImpots: number
}[] {
  const byYear = new Map<number, SalaryMonthWithBonuses[]>()
  for (const m of months) {
    const list = byYear.get(m.year) ?? []
    list.push(m)
    byYear.set(m.year, list)
  }

  const years = [...byYear.keys()].sort((a, b) => a - b)
  return years.map((year) => {
    const list = byYear.get(year) ?? []
    let variableBrut = 0
    let variableNet = 0
    for (const m of list) {
      for (const b of m.bonuses) {
        if (b.flow !== 'VARIABLE') continue
        const a = num(b.amount)
        if (b.basis === 'BRUT') variableBrut += a
        else variableNet += a
      }
    }
    const sumBrutRecap = list.reduce((s, m) => s + monthBrutTotalRecap(m), 0)
    const fixeBrut = Math.max(0, sumBrutRecap - variableBrut)
    const sumNetPaye = list.reduce((s, m) => s + num(m.netPaye), 0)
    const sumNetImposable = list.reduce((s, m) => s + num(m.netImposable), 0)
    const sumPrel = list.reduce((s, m) => s + num(m.prelevementSource), 0)
    /** Net payé sur les bulletins (hors lignes de primes net « variable » additionnelles). */
    const totalNet = sumNetPaye
    const totalNetHorsImp = totalNetHorsImpots(list)
    const monthsWorked = list.length
    const avgNetPaye = monthsWorked > 0 ? sumNetPaye / monthsWorked : 0
    const avgTotalNetHorsImpots = monthsWorked > 0 ? totalNetHorsImp / monthsWorked : 0

    return {
      year,
      netImposable: sumNetImposable,
      netPaye: sumNetPaye,
      prelevementSource: sumPrel,
      fixeBrut,
      variableBrut,
      variableNet,
      totalBrut: sumBrutRecap,
      totalNet,
      totalNetHorsImpots: totalNetHorsImp,
      monthsWorked,
      avgNetPaye,
      avgTotalNetHorsImpots,
    }
  })
}

/**
 * Moyenne mensuelle « net payé + prélèvement à la source » (masse avant PAS).
 * Moyenne mensuelle du net payé réel.
 * Variation % vs année précédente (sur la moyenne réelle).
 */
export function evolutionRows(
  months: SalaryMonth[],
): { year: number; netPayeMoyenSansPrelevement: number; netPayeMoyenReel: number; augmentationPct: number | null }[] {
  const byYear = new Map<number, SalaryMonth[]>()
  for (const m of months) {
    const list = byYear.get(m.year) ?? []
    list.push(m)
    byYear.set(m.year, list)
  }
  const years = [...byYear.keys()].sort((a, b) => a - b)
  const out: {
    year: number
    netPayeMoyenSansPrelevement: number
    netPayeMoyenReel: number
    augmentationPct: number | null
  }[] = []

  let prevReel: number | null = null
  for (const year of years) {
    const list = byYear.get(year) ?? []
    const n = list.length || 1
    const sumSans = list.reduce((s, m) => s + num(m.netPaye) + num(m.prelevementSource), 0)
    const sumReel = list.reduce((s, m) => s + num(m.netPaye), 0)
    const netPayeMoyenSansPrelevement = sumSans / n
    const netPayeMoyenReel = sumReel / n
    let augmentationPct: number | null = null
    if (prevReel != null && prevReel !== 0) {
      augmentationPct = ((netPayeMoyenReel - prevReel) / prevReel) * 100
    }
    prevReel = netPayeMoyenReel
    out.push({ year, netPayeMoyenSansPrelevement, netPayeMoyenReel, augmentationPct })
  }
  return out
}

export type EmployerSalaryStats = {
  employerId: string
  name: string
  monthCount: number
  averageNetPaye: number
  byYear: { year: number; averageNetPaye: number; totalNetPaye: number }[]
}

export function employerStats(
  employers: { id: string; name: string }[],
  months: SalaryMonth[],
): EmployerSalaryStats[] {
  return employers.map((e) => {
    const list = months.filter((m) => m.employerId === e.id)
    const n = list.length
    const averageNetPaye = n === 0 ? 0 : list.reduce((s, m) => s + num(m.netPaye), 0) / n

    const byY = new Map<number, SalaryMonth[]>()
    for (const m of list) {
      const arr = byY.get(m.year) ?? []
      arr.push(m)
      byY.set(m.year, arr)
    }
    const years = [...byY.keys()].sort((a, b) => a - b)
    const byYear = years.map((year) => {
      const arr = byY.get(year) ?? []
      const totalNetPaye = arr.reduce((s, m) => s + num(m.netPaye), 0)
      const averageNetPayeY = arr.length === 0 ? 0 : totalNetPaye / arr.length
      return { year, averageNetPaye: averageNetPayeY, totalNetPaye }
    })

    return {
      employerId: e.id,
      name: e.name,
      monthCount: n,
      averageNetPaye,
      byYear,
    }
  })
}
