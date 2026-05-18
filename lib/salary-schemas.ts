import { z } from 'zod'
import { SalaryBonusBasis, SalaryBonusFlow } from '@prisma/client'

const decimalLike = z.union([z.number(), z.string()]).transform((v) => String(v))

export const salaryMonthBodySchema = z.object({
  year: z.number().int().min(1900).max(2100),
  month: z.number().int().min(1).max(12),
  employerId: z.string().cuid().nullable().optional(),
  brut: decimalLike,
  netImposable: decimalLike,
  netPaye: decimalLike,
  prelevementSource: decimalLike,
  ticketRestaurant: decimalLike,
  primesIndemnitesIncluses: decimalLike.optional(),
  primesIndemnitesNonIncluses: decimalLike.optional(),
  explanation: z.string().max(20000).nullable().optional(),
})

export const salaryBonusBodySchema = z.object({
  category: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  amount: decimalLike,
  basis: z.nativeEnum(SalaryBonusBasis),
  flow: z.nativeEnum(SalaryBonusFlow),
})

export const salaryNonIncludedPrimeBodySchema = z.object({
  category: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  amount: decimalLike,
})

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

export function toPrismaDecimalString(v: string): string {
  const n = Number(v.replace(',', '.'))
  if (!Number.isFinite(n)) throw new Error('invalid_decimal')
  return n.toFixed(2)
}
