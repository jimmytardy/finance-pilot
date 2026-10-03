import { z } from 'zod'
import {
  isValidCategory,
  PAYSLIP_BLOCS,
  PAYSLIP_FREQUENCES,
  PAYSLIP_KINDS,
  PAYSLIP_MODES_EPARGNE,
  PAYSLIP_REGIMES_SOCIAUX,
} from '@/lib/payslip-categories'

const decimalLike = z
  .union([z.number(), z.string().trim().min(1)])
  .transform((v) => String(v))
/** Montant facultatif : `null`, absent ou chaîne vide → null. */
const optionalDecimal = z
  .union([z.number(), z.string(), z.null()])
  .optional()
  .transform((v) => (v == null || String(v).trim() === '' ? null : String(v)))

export const payslipLineBodySchema = z
  .object({
    bloc: z.enum(PAYSLIP_BLOCS),
    categorie: z.string().min(1).max(100),
    libelle: z.string().max(500).default(''),
    base: optionalDecimal,
    quantite: optionalDecimal,
    tauxSalarial: optionalDecimal,
    montantSalarial: optionalDecimal,
    tauxPatronal: optionalDecimal,
    montantPatronal: optionalDecimal,
    montant: optionalDecimal,
    frequence: z.enum(PAYSLIP_FREQUENCES).nullable().optional(),
    regimeSocial: z.enum(PAYSLIP_REGIMES_SOCIAUX).nullable().optional(),
    imposable: z.boolean().nullable().optional(),
    exonerationIr: z.boolean().nullable().optional(),
    verseEnNumeraire: z.boolean().optional().default(true),
    modeEpargne: z.enum(PAYSLIP_MODES_EPARGNE).nullable().optional(),
    csgCrds: optionalDecimal,
    periodeRattachement: z.string().max(50).nullable().optional(),
  })
  .refine((l) => isValidCategory(l.bloc, l.categorie), {
    message: 'invalid_category',
    path: ['categorie'],
  })

export type PayslipLineBody = z.infer<typeof payslipLineBodySchema>

export const payslipBodySchema = z.object({
  kind: z.enum(PAYSLIP_KINDS).default('BULLETIN'),
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  label: z.string().max(200).nullable().optional(),
  brut: decimalLike,
  netAvantImpot: decimalLike,
  netImposable: decimalLike,
  netSocial: optionalDecimal,
  netPaye: decimalLike,
  prelevementSource: decimalLike.default('0'),
  tauxPas: optionalDecimal,
  totalCotisationsSalariales: optionalDecimal,
  totalCotisationsPatronales: optionalDecimal,
  coutEmployeur: optionalDecimal,
  heuresTravaillees: optionalDecimal,
  plafondSS: optionalDecimal,
  cumuls: z.record(z.string(), z.union([z.string(), z.number()])).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
  extractedBy: z.string().max(100).nullable().optional(),
  lines: z.array(payslipLineBodySchema).max(300).default([]),
})

export type PayslipBody = z.infer<typeof payslipBodySchema>

export const employerBodySchema = z.object({
  name: z.string().min(1).max(300),
})

const ym = z.string().regex(/^\d{4}-\d{2}$/)
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const employmentPeriodBodySchema = z.object({
  /** Mois de début `YYYY-MM` (recommandé) ou date `YYYY-MM-DD` (normalisée au 1er du mois). */
  startDate: z.union([ym, ymd]),
  /** Mois de fin inclus `YYYY-MM`, `YYYY-MM-DD`, absent (PATCH) ou `null` / `""` = toujours en cours. */
  endDate: z
    .union([z.literal(''), ym, ymd, z.null()])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === '' ? null : v)),
  notes: z.string().max(5000).nullable().optional(),
})

export function toPrismaDecimalString(v: string, digits = 2): string {
  const n = Number(v.replace(',', '.').replace(/\s/g, ''))
  if (!Number.isFinite(n)) throw new Error('invalid_decimal')
  return n.toFixed(digits)
}

export function toPrismaDecimalOrNull(v: string | null | undefined, digits = 2): string | null {
  return v == null ? null : toPrismaDecimalString(v, digits)
}
