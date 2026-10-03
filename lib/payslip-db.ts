import 'server-only'
import { Prisma } from '@prisma/client'
import { findCategory } from '@/lib/payslip-categories'
import {
  type PayslipBody,
  type PayslipLineBody,
  toPrismaDecimalOrNull,
  toPrismaDecimalString,
} from '@/lib/salary-schemas'

function decimal(v: string | null | undefined, digits = 2): Prisma.Decimal | null {
  const s = toPrismaDecimalOrNull(v, digits)
  return s == null ? null : new Prisma.Decimal(s)
}

/** Totaux et métadonnées d'un document, prêts pour `prisma.payslip.create/update`. */
export function payslipScalarData(d: PayslipBody) {
  return {
    kind: d.kind,
    year: d.year,
    month: d.month,
    label: d.label ?? null,
    brut: new Prisma.Decimal(toPrismaDecimalString(d.brut)),
    netAvantImpot: new Prisma.Decimal(toPrismaDecimalString(d.netAvantImpot)),
    netImposable: new Prisma.Decimal(toPrismaDecimalString(d.netImposable)),
    netSocial: decimal(d.netSocial),
    netPaye: new Prisma.Decimal(toPrismaDecimalString(d.netPaye)),
    prelevementSource: new Prisma.Decimal(toPrismaDecimalString(d.prelevementSource)),
    tauxPas: decimal(d.tauxPas, 3),
    totalCotisationsSalariales: decimal(d.totalCotisationsSalariales),
    totalCotisationsPatronales: decimal(d.totalCotisationsPatronales),
    coutEmployeur: decimal(d.coutEmployeur),
    heuresTravaillees: decimal(d.heuresTravaillees),
    plafondSS: decimal(d.plafondSS),
    cumuls: d.cumuls ?? Prisma.DbNull,
    notes: d.notes ?? null,
    extractedBy: d.extractedBy ?? null,
  }
}

/**
 * Lignes prêtes pour `createMany`. Les attributs non renseignés reprennent
 * les valeurs par défaut de la catégorie (`lib/payslip-categories.ts`).
 */
export function payslipLinesData(
  payslipId: string,
  lines: PayslipLineBody[],
): Prisma.PayslipLineCreateManyInput[] {
  return lines.map((l, position) => {
    const defaults = findCategory(l.bloc, l.categorie)?.defaults ?? {}
    return {
      payslipId,
      position,
      bloc: l.bloc,
      categorie: l.categorie,
      libelle: l.libelle,
      base: decimal(l.base),
      quantite: decimal(l.quantite),
      tauxSalarial: decimal(l.tauxSalarial, 4),
      montantSalarial: decimal(l.montantSalarial),
      tauxPatronal: decimal(l.tauxPatronal, 4),
      montantPatronal: decimal(l.montantPatronal),
      montant: decimal(l.montant),
      frequence: l.frequence ?? defaults.frequence ?? null,
      regimeSocial: l.regimeSocial ?? defaults.regimeSocial ?? null,
      imposable: l.imposable ?? defaults.imposable ?? null,
      exonerationIr: l.exonerationIr ?? defaults.exonerationIr ?? null,
      verseEnNumeraire: l.verseEnNumeraire ?? defaults.verseEnNumeraire ?? true,
      modeEpargne: l.modeEpargne ?? null,
      csgCrds: decimal(l.csgCrds),
      periodeRattachement: l.periodeRattachement ?? null,
    }
  })
}
