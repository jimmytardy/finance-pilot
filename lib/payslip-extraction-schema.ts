import { z } from 'zod'
import {
  PAYSLIP_BLOCS,
  PAYSLIP_CATEGORIES,
  PAYSLIP_CATEGORY_IDS,
  PAYSLIP_MODES_EPARGNE,
} from '@/lib/payslip-categories'

/** Montant facultatif renvoyé par l'IA : nombre, chaîne ou null → chaîne décimale ou null. */
const optionalMoney = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((v) => {
    if (v == null) return null
    const s = String(v).replace(/\s/g, '').replace(',', '.').trim()
    if (s === '') return null
    return Number.isFinite(Number(s)) ? s : null
  })

const money = optionalMoney.transform((v) => v ?? '0.00')

export const payslipExtractionLineSchema = z.object({
  bloc: z.enum(PAYSLIP_BLOCS),
  categorie: z.string().min(1),
  libelle: z.string().optional().default(''),
  base: optionalMoney,
  quantite: optionalMoney,
  tauxSalarial: optionalMoney,
  montantSalarial: optionalMoney,
  tauxPatronal: optionalMoney,
  montantPatronal: optionalMoney,
  montant: optionalMoney,
  csgCrds: optionalMoney,
  modeEpargne: z.enum(PAYSLIP_MODES_EPARGNE).nullable().optional().default(null),
  periodeRattachement: z.string().nullable().optional().default(null),
})

export type PayslipExtractionLine = z.infer<typeof payslipExtractionLineSchema>

/** Réponse brute Mistral (inclut le drapeau de détection). */
export const payslipExtractionWithDetectionSchema = z.object({
  isPayslip: z.boolean(),
  kind: z.enum(['BULLETIN', 'EPARGNE_SALARIALE']).optional().default('BULLETIN'),
  year: z.number().int().min(1900).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  label: z.string().nullable().optional().default(null),
  brut: money,
  netAvantImpot: money,
  netImposable: money,
  netSocial: optionalMoney,
  netPaye: money,
  prelevementSource: money,
  tauxPas: optionalMoney,
  totalCotisationsSalariales: optionalMoney,
  totalCotisationsPatronales: optionalMoney,
  coutEmployeur: optionalMoney,
  heuresTravaillees: optionalMoney,
  plafondSS: optionalMoney,
  cumuls: z
    .object({
      brut: optionalMoney,
      netImposable: optionalMoney,
      prelevementSource: optionalMoney,
      heuresSupExonerees: optionalMoney,
    })
    .nullable()
    .optional()
    .default(null),
  notes: z.string().nullable().optional().default(null),
  lines: z.array(z.unknown()).optional().default([]),
})

export type PayslipExtractionRaw = z.infer<typeof payslipExtractionWithDetectionSchema>

const nullableString = { type: ['string', 'null'] }

/** JSON Schema pour Mistral document_annotation (json_schema mode). */
export const payslipExtractionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    isPayslip: {
      type: 'boolean',
      description:
        'true si bulletin de salaire français ou relevé d’intéressement / participation ; false sinon',
    },
    kind: {
      type: 'string',
      enum: ['BULLETIN', 'EPARGNE_SALARIALE'],
      description:
        'BULLETIN pour un bulletin de paie mensuel ; EPARGNE_SALARIALE pour une fiche distincte d’intéressement, de participation ou d’abondement',
    },
    year: { type: 'integer', description: 'Année de la période de paie (ex. 2026)' },
    month: { type: 'integer', description: 'Mois 1-12 de la période de paie' },
    label: { ...nullableString, description: 'Titre court pour une fiche d’épargne salariale (ex. « Intéressement 2025 »), sinon null' },
    brut: { type: 'string', description: 'Ligne « Salaire brut » / « Total brut »' },
    netAvantImpot: { type: 'string', description: 'Ligne « Net à payer avant impôt sur le revenu »' },
    netImposable: { type: 'string', description: 'Net imposable du mois (base du prélèvement à la source)' },
    netSocial: { ...nullableString, description: 'Ligne « Montant net social », ou null' },
    netPaye: { type: 'string', description: 'Ligne « Net payé » / « Net à payer » final, versé sur le compte' },
    prelevementSource: { type: 'string', description: 'Montant retenu au titre du PAS, positif' },
    tauxPas: { ...nullableString, description: 'Taux PAS en % (ex. 5.30), ou null' },
    totalCotisationsSalariales: { ...nullableString, description: 'Total des cotisations et contributions, part salariale' },
    totalCotisationsPatronales: { ...nullableString, description: 'Total des cotisations, part patronale' },
    coutEmployeur: { ...nullableString, description: '« Total versé par l’employeur » / coût global' },
    heuresTravaillees: { ...nullableString, description: 'Heures du mois (ex. 151.67)' },
    plafondSS: { ...nullableString, description: 'Plafond de la Sécurité sociale du mois' },
    cumuls: {
      type: ['object', 'null'],
      additionalProperties: false,
      description: 'Cumuls annuels du bandeau, si présents',
      properties: {
        brut: nullableString,
        netImposable: nullableString,
        prelevementSource: nullableString,
        heuresSupExonerees: nullableString,
      },
    },
    notes: { ...nullableString, description: 'Court : congés pris (ex. « 2 CP »), absences, ou null' },
    lines: {
      type: 'array',
      description: 'Toutes les lignes du document, une par libellé, dans l’ordre',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          bloc: { type: 'string', enum: [...PAYSLIP_BLOCS] },
          categorie: { type: 'string', enum: PAYSLIP_CATEGORY_IDS },
          libelle: { type: 'string', description: 'Libellé exact du bulletin' },
          base: nullableString,
          quantite: nullableString,
          tauxSalarial: nullableString,
          montantSalarial: nullableString,
          tauxPatronal: nullableString,
          montantPatronal: nullableString,
          montant: nullableString,
          csgCrds: nullableString,
          modeEpargne: { type: ['string', 'null'], enum: [...PAYSLIP_MODES_EPARGNE, null] },
          periodeRattachement: nullableString,
        },
        required: ['bloc', 'categorie', 'libelle'],
      },
    },
  },
  required: ['isPayslip', 'kind', 'brut', 'netAvantImpot', 'netImposable', 'netPaye', 'prelevementSource', 'lines'],
}

function categoriesList(): string {
  const byBloc = new Map<string, string[]>()
  for (const c of PAYSLIP_CATEGORIES) {
    const list = byBloc.get(c.bloc) ?? []
    list.push(c.id)
    byBloc.set(c.bloc, list)
  }
  return [...byBloc.entries()].map(([bloc, ids]) => `- ${bloc} : ${ids.join(', ')}`).join('\n')
}

export const PAYSLIP_EXTRACTION_PROMPT = `Tu extrais TOUTES les lignes d'un bulletin de salaire français (tous logiciels de paie) ou d'une fiche distincte d'épargne salariale.

Règle d'or : recopie les montants imprimés. Ne calcule jamais un total en additionnant des lignes ; ne fusionne jamais deux lignes.

## Détection
- isPayslip = true pour un bulletin de paie ou un relevé d'intéressement / participation / abondement ; sinon false, montants "0.00" et lines = [].
- kind = EPARGNE_SALARIALE pour une fiche distincte d'intéressement ou de participation (pas de salaire de base) ; sinon BULLETIN.
- year / month : période de paie (« Période du … au … »), pas la date de paiement.

## Totaux (recopiés depuis leur libellé)
- brut : ligne « Salaire brut » / « Total brut ». Pas « Salaire de base » seul.
- netAvantImpot : « Net à payer avant impôt sur le revenu ».
- netImposable : « Net imposable » du mois (ou base de la ligne PAS). Pas le cumul annuel.
- netSocial : « Montant net social ».
- netPaye : « Net payé » / « Net à payer » final (après PAS et ajustements). Hors valeur des titres-restaurant.
- prelevementSource : montant retenu sur la ligne « Impôt sur le revenu prélevé à la source », positif ; tauxPas : son taux en %.
- totalCotisationsSalariales / totalCotisationsPatronales : ligne « Total des cotisations et contributions ».
- coutEmployeur : « Total versé par l'employeur » / « Coût global ».
- cumuls : colonnes « Cumul annuel » / « Année » du bandeau si présentes.

## Lignes (lines) — une entrée par libellé imprimé, dans l'ordre
Catégories autorisées par bloc :
${categoriesList()}

Conventions de montants :
- REMUNERATION, FIN_CONTRAT, PARTAGE_VALEUR : montant = gain (négatif pour une absence / retenue sur brut). base, quantite (heures, jours) et taux si imprimés.
- COTISATION : base, tauxSalarial, montantSalarial (colonne « À déduire » / part salarié), tauxPatronal, montantPatronal (part employeur). Montants positifs ; les exonérations / réductions (réduction générale, réduction salariale heures sup) sont négatives.
- IMPOT : categorie prelevement_source, base = net imposable, tauxSalarial = taux, montantSalarial = montant retenu positif.
- AJUSTEMENT_NET : montant signé (+ ajouté au net, − retenu). Titres-restaurant : quantite = nombre de titres, montantSalarial = part salarié, montantPatronal = part employeur, montant = −part salarié.

Règles de rangement :
- Lignes avant « Salaire brut » : REMUNERATION (salaire_base, heures_sup, primes, conges_payes, absence…). Prime d'objectifs / bonus / commissions → prime_objectifs ; 13e mois / fin d'année / vacances → prime_annuelle.
- Prime de partage de la valeur (PPV, ex-PEPA) → PARTAGE_VALEUR / prime_partage_valeur, même si elle est versée après les cotisations. Intéressement, participation, abondement → leurs catégories PARTAGE_VALEUR ; csgCrds = CSG/CRDS retenue sur ce montant ; modeEpargne = PLACE si placé sur PEE/PER, PERCU si versé, INCONNU sinon.
- Cotisations par risque : Sécurité sociale maladie → sante ; complémentaire santé / mutuelle → mutuelle ; prévoyance → prevoyance ; accidents du travail → atmp ; vieillesse plafonnée / déplafonnée → retraite_base ; Agirc-Arrco T1/T2, CEG, CET, APEC → retraite_complementaire ; allocations familiales → famille ; chômage, AGS → chomage ; CSG déductible → csg_deductible ; CSG non déductible + CRDS → csg_crds_non_deductible ; FNAL, CSA, versement mobilité, formation, apprentissage, forfait social, dialogue social → autres_contributions ; allègements / réduction générale → exoneration.
- Après le net : indemnité kilométrique, IK vélo, frais professionnels, télétravail → frais_pro ; remboursement transport, Navigo, forfait mobilités durables, DFS transport → transport ; IJSS → ijss ; acompte → acompte ; versement PEE/PER volontaire → versement_volontaire_pee.
- Ignore les lignes de sous-totaux (« Total des cotisations », « Salaire brut », « Net à payer ») : elles vont dans les totaux, pas dans lines.

## Format
- Montants : chaînes avec point décimal (3575.00), sans espace ni symbole €. Champ absent → null (totaux obligatoires absents → "0.00").
- notes : congés pris, absences ou événements (ex. « 2 CP »), sinon null.`
