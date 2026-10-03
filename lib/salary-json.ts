import type { Payslip, PayslipLine, Prisma } from '@prisma/client'
import type { PayslipDto, PayslipLineDto } from '@/lib/payslip-types'

export function dec(v: Prisma.Decimal | null | undefined): string {
  if (v == null) return '0'
  return v.toString()
}

function decOrNull(v: Prisma.Decimal | null | undefined): string | null {
  return v == null ? null : v.toString()
}

export function serializePayslipLine(l: PayslipLine): PayslipLineDto {
  return {
    id: l.id,
    position: l.position,
    bloc: l.bloc,
    categorie: l.categorie,
    libelle: l.libelle,
    base: decOrNull(l.base),
    quantite: decOrNull(l.quantite),
    tauxSalarial: decOrNull(l.tauxSalarial),
    montantSalarial: decOrNull(l.montantSalarial),
    tauxPatronal: decOrNull(l.tauxPatronal),
    montantPatronal: decOrNull(l.montantPatronal),
    montant: decOrNull(l.montant),
    frequence: l.frequence,
    regimeSocial: l.regimeSocial,
    imposable: l.imposable,
    exonerationIr: l.exonerationIr,
    verseEnNumeraire: l.verseEnNumeraire,
    modeEpargne: l.modeEpargne,
    csgCrds: decOrNull(l.csgCrds),
    periodeRattachement: l.periodeRattachement,
  }
}

export function serializePayslip(p: Payslip & { lines?: PayslipLine[] }): PayslipDto {
  return {
    id: p.id,
    employerId: p.employerId,
    kind: p.kind,
    year: p.year,
    month: p.month,
    label: p.label,
    brut: dec(p.brut),
    netAvantImpot: dec(p.netAvantImpot),
    netImposable: dec(p.netImposable),
    netSocial: decOrNull(p.netSocial),
    netPaye: dec(p.netPaye),
    prelevementSource: dec(p.prelevementSource),
    tauxPas: decOrNull(p.tauxPas),
    totalCotisationsSalariales: decOrNull(p.totalCotisationsSalariales),
    totalCotisationsPatronales: decOrNull(p.totalCotisationsPatronales),
    coutEmployeur: decOrNull(p.coutEmployeur),
    heuresTravaillees: decOrNull(p.heuresTravaillees),
    plafondSS: decOrNull(p.plafondSS),
    cumuls: (p.cumuls as Record<string, string | number> | null) ?? null,
    notes: p.notes,
    extractedBy: p.extractedBy,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lines: [...(p.lines ?? [])].sort((a, b) => a.position - b.position).map(serializePayslipLine),
  }
}

export function serializeEmployer(
  e: {
    id: string
    name: string
    createdAt: Date
    updatedAt: Date
    employmentPeriods?: {
      id: string
      startDate: Date
      endDate: Date | null
      notes: string | null
    }[]
  },
) {
  return {
    id: e.id,
    name: e.name,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    employmentPeriods: (e.employmentPeriods ?? []).map((p) => ({
      id: p.id,
      startDate: formatYearMonthUtc(p.startDate),
      endDate: p.endDate ? formatYearMonthUtc(p.endDate) : null,
      notes: p.notes,
    })),
  }
}

/** Mois civil uniquement (`YYYY-MM`), sans jour. */
function formatYearMonthUtc(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
