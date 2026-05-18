import { z } from 'zod'

const decimalString = z.union([z.string(), z.number()]).transform((v) => String(v))

export const payslipBonusExtractionSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional().default(''),
  amount: decimalString,
  basis: z.enum(['BRUT', 'NET']).optional().default('BRUT'),
  flow: z.enum(['FIXE', 'VARIABLE']).optional().default('VARIABLE'),
})

export const payslipNonIncludedPrimeExtractionSchema = z.object({
  category: z.string().min(1),
  description: z.string().optional().default(''),
  amount: decimalString,
})

/** Réponse brute Mistral (inclut le drapeau de détection). */
export const payslipExtractionWithDetectionSchema = z.object({
  isPayslip: z.boolean(),
  year: z.number().int().min(1900).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  brut: decimalString,
  netImposable: decimalString,
  netPaye: decimalString,
  prelevementSource: decimalString,
  /** Nombre de tickets restaurant indiqué sur le bulletin (base / quantité). */
  ticketRestaurantCount: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v == null || v === '') return undefined
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim())
      if (!Number.isFinite(n) || n < 0) return undefined
      return Math.round(n)
    }),
  ticketRestaurant: decimalString,
  explanation: z.string().nullable().optional().default(null),
  primesIndemnitesIncluses: decimalString.optional(),
  bonuses: z.array(payslipBonusExtractionSchema).optional().default([]),
  nonIncludedPrimes: z.array(payslipNonIncludedPrimeExtractionSchema).optional().default([]),
})

export type PayslipExtractionWithDetection = z.infer<typeof payslipExtractionWithDetectionSchema>

export type PayslipExtraction = Omit<PayslipExtractionWithDetection, 'isPayslip'>

/** JSON Schema pour Mistral document_annotation (json_schema mode). */
export const payslipExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    isPayslip: {
      type: 'boolean',
      description:
        'true si le document est une fiche de paye / bulletin de salaire français ; false pour tout autre document (facture, photo, contrat, etc.)',
    },
    year: { type: 'integer', description: 'Année du bulletin (ex. 2025)' },
    month: { type: 'integer', description: 'Mois du bulletin 1-12' },
    brut: {
      type: 'string',
      description:
        'Salaire brut du mois tel que sur le bulletin, INCLUANT congés payés et indemnité kilométrique, HORS primes listées dans bonuses',
    },
    netImposable: {
      type: 'string',
      description: 'Net imposable du bulletin (incluant congés payés et IK si présents sur la fiche)',
    },
    netPaye: {
      type: 'string',
      description: 'Net payé du bulletin (hors tickets restaurant)',
    },
    prelevementSource: { type: 'string', description: 'Prélèvement à la source' },
    ticketRestaurantCount: {
      type: 'integer',
      description:
        'Nombre de tickets restaurant indiqué sur le bulletin (colonne quantité / base, pas le montant en euros)',
    },
    ticketRestaurant: {
      type: 'string',
      description: 'Laisser "0.00" : recalculé côté serveur (nombre × 8,60 €)',
    },
    explanation: {
      type: ['string', 'null'],
      description: 'Explication si bulletin atypique (prime exceptionnelle, régularisation, etc.), sinon null',
    },
    primesIndemnitesIncluses: {
      type: 'string',
      description:
        'Total des primes « normales » déjà incluses au brut de base (hors congés / IK / indemnité CP)',
    },
    bonuses: {
      type: 'array',
      description:
        'Uniquement vraies primes (intéressement, objectifs, partage de valeur, 13e mois, etc.). JAMAIS congés payés ni indemnité kilométrique',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'string' },
          basis: { type: 'string', enum: ['BRUT', 'NET'] },
          flow: { type: 'string', enum: ['FIXE', 'VARIABLE'] },
        },
        required: ['category', 'amount'],
      },
    },
    nonIncludedPrimes: {
      type: 'array',
      description:
        'Primes ou indemnités réellement hors salaire de base du bulletin. JAMAIS congés payés ni indemnité kilométrique (déjà dans brut/net)',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          description: { type: 'string' },
          amount: { type: 'string' },
        },
        required: ['category', 'amount'],
      },
    },
  },
  required: [
    'isPayslip',
    'brut',
    'netImposable',
    'netPaye',
    'prelevementSource',
    'ticketRestaurantCount',
    'ticketRestaurant',
  ],
}

export const PAYSLIP_EXTRACTION_PROMPT = `Tu analyses un document uploadé par l'utilisateur.

## Détection du type de document
- isPayslip = true UNIQUEMENT si c'est une fiche de paye / bulletin de salaire français (employeur, salarié, brut, net, cotisations, etc.).
- isPayslip = false pour tout autre document : facture, photo personnelle, contrat, relevé bancaire, capture d'écran sans bulletin, document illisible ou vide, etc.
- Si isPayslip = false : mets "0.00" pour tous les montants, 0 pour ticketRestaurantCount, tableaux bonuses et nonIncludedPrimes vides, explanation = null. Ne devine pas de montants.

## Si isPayslip = true
Extrais les montants en euros sous forme de chaînes avec 2 décimales (point décimal en sortie).

## Salaire de base (champs brut, netImposable, netPaye)
- brut, netImposable, netPaye : totaux du bulletin du mois, en INCLUANT congés payés, indemnité de congés payés et indemnité kilométrique (IK) s'ils figurent sur la fiche.
- Ces éléments font partie du salaire de base : ne les liste PAS dans "bonuses" ni dans "nonIncludedPrimes".
- Exclue uniquement du net payé la part tickets restaurant, et des totaux brut/net les montants des vraies primes à détailler dans "bonuses".

## Primes (bonuses vs nonIncludedPrimes)
- bonuses : UNIQUEMENT vraies primes (intéressement, objectifs, partage de valeur, 13e mois, etc.). Libellés category :
  "Interressement", "Objectifs", "Partage de valeur" (sinon libellé court sans "Prime de").
- NE METS JAMAIS dans bonuses ni nonIncludedPrimes : congés payés, indemnité congés payés, indemnité kilométrique (IK),
  frais kilométriques, indemnité de déplacement liée au véhicule, remboursement de trajet, etc.
- Vérifie category ET description : si l'un des deux évoque l'IK ou les congés payés, n'ajoute pas la ligne aux primes.
- nonIncludedPrimes : uniquement montants clairement hors salaire de base du bulletin (pas congés payés, pas IK). Tableau vide si aucune.

## Tickets restaurant
- ticketRestaurantCount : nombre de tickets indiqué sur le bulletin (quantité / base / nombre de titres), entier.
- Ne déduis pas un montant en euros du bulletin pour les tickets : mets ticketRestaurant à "0.00" (recalcul automatique : nombre × 8,60 €).

## Autres champs
- prelevementSource : prélèvement à la source (0.00 si absent)
- year, month : période du bulletin si visible
- explanation : texte court uniquement si bulletin atypique, sinon null
- primesIndemnitesIncluses : total des vraies primes déjà dans le brut (hors congés payés et hors IK). Omettre ou "0.00" si seul l'IK ou les congés composent ce total.

Si un montant est introuvable, mets "0.00". Si ticketRestaurantCount est absent, mets 0.`
