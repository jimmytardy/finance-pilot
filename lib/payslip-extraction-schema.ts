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
        'true si bulletin de salaire français (employeur, salarié, cotisations) ; false sinon',
    },
    year: { type: 'integer', description: 'Année (ex. 2026)' },
    month: { type: 'integer', description: 'Mois 1-12' },
    brut: {
      type: 'string',
      description:
        'Montant exact de la ligne « Salaire brut » dans Éléments de paie (PAS « Salaire de base » seul, PAS la colonne Brut du bandeau). Ex. mars 2026 : 3575.00',
    },
    netImposable: {
      type: 'string',
      description:
        'Net imposable mensuel : valeur sous « Net imposable » dans le bandeau récap (ligne Mensuel), OU base (2e montant) de la ligne « Impôt sur le revenu prélevé à la source - PAS ». Ex. mars 2026 : 2925.13',
    },
    netPaye: {
      type: 'string',
      description:
        'Montant de la ligne « Net payé » (ou « Net payé : X euros » en bas). Hors tickets restaurant. Ex. mars 2026 : 2588.51',
    },
    prelevementSource: {
      type: 'string',
      description:
        'Montant déduit sur la ligne PAS (colonne A déduire), valeur positive. Ex. mars 2026 : 155.03',
    },
    ticketRestaurantCount: {
      type: 'integer',
      description: 'Base (1er nombre) de la ligne « Titres-restaurant ». Ex. 18',
    },
    ticketRestaurant: {
      type: 'string',
      description:
        'Somme part salarié + part patronale de la ligne Titres-restaurant (ex. 61.92+92.88=154.80), ou (taux A déduire + taux charges patronales) × base',
    },
    explanation: {
      type: ['string', 'null'],
      description: 'Court : congés pris (ex. 2CP), ou null',
    },
    primesIndemnitesIncluses: {
      type: 'string',
      description: 'Somme des primes déjà dans « Salaire brut » (hors congés). Souvent 0.00 ou montant prime objectifs',
    },
    bonuses: {
      type: 'array',
      description:
        'Primes incluses dans « Salaire brut » (lignes AVANT « Salaire brut », ex. Prime d\'objectifs). Jamais IK, DFS, congés, partage de valeur après cotisations',
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
        'Montants en colonne « A payer » après cotisations, NON inclus dans « Salaire brut » : IK vélo, indemnité transport (DFS), prime partage de valeur versée au net, etc.',
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

export const PAYSLIP_EXTRACTION_PROMPT = `Tu extrais un bulletin de salaire français (format Sage / AWS : en-tête « BULLETIN DE SALAIRE », bloc « Éléments de paie », employeur type AVENUE WEB SYSTEMES).

Règle d'or : recopie les totaux des LIBELLÉS EXACTS ci-dessous. Ne calcule pas en additionnant les lignes de cotisations ni « Salaire de base » seul.

## Détection
- isPayslip = true seulement pour un vrai bulletin de paie.
- Si false : tous montants "0.00", ticketRestaurantCount=0, tableaux vides.

## Totaux obligatoires (colonne « Mensuel » du bandeau ou libellé dans le corps)

### brut
- UNIQUEMENT le montant de la ligne **« Salaire brut »** dans « Éléments de paie » (souvent juste après indemnité congés payés).
- NE PAS utiliser : « Salaire de base », la colonne « Brut » du bandeau haut, un total calculé, ni un brut diminué de l'IK.
- L'indemnité kilométrique vélo et l'indemnité transport (DFS) ne sont PAS dans ce « Salaire brut ».

### netImposable
- Priorité 1 : valeur **mensuelle** sous le titre **« Net imposable »** dans le bandeau (ligne « Mensuel », 7e colonne environ après Heures / Brut / Plafond S.S.).
- Priorité 2 : le 2e montant (base) sur la ligne **« Impôt sur le revenu prélevé à la source - PAS »** (avant le taux %).
- NE PAS confondre avec « Montant net social », « Net à payer avant impôt », ni la colonne « Brut » du bandeau.

### netPaye
- Montant de la ligne **« Net payé »** (avant ou après PAS selon mise en page) OU **« Net payé : X euros »** en bas de page.
- NE PAS utiliser « Net à payer avant impôt sur le revenu » ni « Montant net social ».

### prelevementSource
- Montant **déduit** (positif) sur la ligne PAS, colonne « A déduire » (ex. 155.03 si base PAS 2925.13 et taux 5.30).

## Tickets restaurant
- ticketRestaurantCount : **base** (1er nombre) de la ligne **« Titres-restaurant »** (ex. 18).
- ticketRestaurant : somme **euros salarié + euros patronal** sur cette ligne (ex. 61.92 + 92.88 = 154.80), ou (taux « A déduire » + taux « Charges patronales ») × base.

## Primes et indemnités

### bonuses (déjà dans « Salaire brut »)
- Lignes **avant** « Salaire brut » qui composent ce total : ex. **« Prime d'objectifs »** 200.00 quand le salaire brut est 3775.00.
- basis = BRUT, flow = VARIABLE.

### nonIncludedPrimes (hors « Salaire brut », souvent colonne « A payer » après « Total des cotisations »)
- **Indemnité kilométrique** / **Indemnité Kilométrique vélo** → category « Indemnité kilométrique » (ex. 16.67).
- **Indemnité de transport (DFS)** → category « Indemnité de transport (DFS) ».
- **Prime de partage de la valeur** (et autres primes après les cotisations, pas dans salaire brut) → category « Partage de valeur », basis implicite NET.
- NE PAS mettre : congés payés pris, indemnité congés payés (déjà dans salaire brut).

### Congés
- Ne pas lister en prime. Dans explanation, indiquer les jours pris (ex. « 2CP ») si visible.

## primesIndemnitesIncluses
- Somme des montants bonuses, ou "0.00" si aucune prime avant « Salaire brut ».

## Interdits
- Ne soustrais pas l'IK ni le DFS des champs brut / netImposable / netPaye (ils ne sont pas dans « Salaire brut » sur ce format).
- Ne additionne pas les cotisations salariales pour fabriquer un net.
- Format sortie : chaînes avec 2 décimales, point décimal (3575.00).

## Exemples de contrôle (ne pas inventer si autre mois)
- Mars 2026 : brut 3575.00, netImposable 2925.13, netPaye 2588.51, PAS 155.03, tickets 18, IK 16.67.
- Février 2026 : brut 3450.00, netImposable 2827.71, netPaye 2506.74, partage valeur 1300 en nonIncludedPrimes.
- Avril 2026 : brut 3775.00, netImposable 3088.90, netPaye 2741.25, prime objectifs 200 en bonuses.

year/month depuis « Période : … ». Montant introuvable → "0.00".`
