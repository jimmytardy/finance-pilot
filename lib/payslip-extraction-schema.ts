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

export const PAYSLIP_EXTRACTION_PROMPT = `Tu extrais TOUTES les lignes d'un bulletin de salaire français (tous logiciels de paie : Sage, Silae, PayFit, etc.) ou d'une fiche distincte d'épargne salariale.

Règle d'or : recopie les montants imprimés. Ne calcule jamais un total en additionnant des lignes ; ne fusionne jamais deux lignes ; n'invente aucun montant.

## Détection
- isPayslip = true pour un bulletin de paie ou un relevé d'intéressement / participation / abondement ; sinon false, montants "0.00" et lines = [].
- kind = EPARGNE_SALARIALE pour une fiche distincte d'intéressement ou de participation (sans salaire de base) ; sinon BULLETIN.
- year / month : période de paie (« Période : Mars 2026 », « Du 01/09/2021 au 30/09/2021 »), pas la date de paiement. Pour une fiche d'épargne salariale : mois de la date de versement.

## Totaux (recopiés depuis leur libellé)
- brut : « Salaire brut » / « Rémunération brute » / « Total brut ». Pas « Salaire de base » seul.
- netAvantImpot : « Net à payer avant impôt sur le revenu ». S'il n'est pas imprimé (anciens bulletins), mets netPaye + prelevementSource.
- netImposable : « Net imposable » du mois (ou base de la ligne PAS). Pas le cumul annuel.
- netSocial : « Montant net social », sinon null.
- netPaye : « Net payé » / « Net à payer » final, versé sur le compte (après PAS). Hors valeur des titres-restaurant.
- prelevementSource : montant retenu sur la ligne « Impôt sur le revenu prélevé à la source » / « PAS », positif ; tauxPas : son taux en %, tel qu'imprimé (ex. 5.30, pas 0.053).
- totalCotisationsSalariales / totalCotisationsPatronales : ligne « Total des cotisations et contributions » (ou « Total retenues »), valeurs positives.
- coutEmployeur : « Coût global » ou « Total versé par l'employeur », sinon null.
- cumuls : colonnes « Cumul » / « Annuel » / « Depuis janvier » si présentes.
- Fiche d'épargne salariale : brut = montant brut total, netAvantImpot = netPaye = montant net après CSG/CRDS, netImposable = montant imposable s'il est indiqué sinon "0.00", prelevementSource = "0.00".

## Lignes (lines) — une entrée par élément de paie imprimé, dans l'ordre
Catégories autorisées par bloc :
${categoriesList()}

Où mettre les montants (quel que soit le nom des colonnes du logiciel) :
- Un libellé de la forme « Mutuelle | Forfait » ou « Prévoyance | Tranche A » est UNE seule ligne : la partie après « | » est une précision (base forfaitaire, tranche), jamais une ligne à part.
- Un taux est un pourcentage ou un taux horaire imprimé dans la colonne Taux ; un montant en euros n'est jamais un taux.
- Les commentaires imprimés sous une ligne (« (1.00 JOUR DE CONGES PAYES PRIS) ») ne font pas partie de son libellé.
- REMUNERATION, FIN_CONTRAT, PARTAGE_VALEUR : le montant va TOUJOURS dans « montant », jamais dans montantSalarial. Gain positif ; retenue sur brut négative (congés payés pris, absence). base, quantite (heures, jours) et taux si imprimés.
- COTISATION : base, tauxSalarial, montantSalarial (part salarié / « À déduire »), tauxPatronal, montantPatronal (part employeur / « Charges patronales »). Valeurs POSITIVES même si le bulletin les imprime en négatif. Remplis chaque part uniquement si sa propre colonne contient un montant : ne recopie jamais la part employeur dans la part salarié. Une ligne peut avoir les deux parts même sans taux (ex. « Mutuelle | Forfait 48,92 48,93 » → salarié 48.92, employeur 48.93). Seules les exonérations / réductions (réduction générale, exonération de cotisations) sont négatives.
- IMPOT : categorie prelevement_source, base = net imposable, tauxSalarial = taux en %, montantSalarial = montant retenu positif.
- AJUSTEMENT_NET : « montant » signé (+ ajouté au net : frais, transport, télétravail, IJSS ; − retenu : acompte, saisie). Titres-restaurant : quantite = nombre de titres, montantSalarial = part salarié, montantPatronal = part employeur.

Règles de rangement :
- Avant le brut : REMUNERATION (salaire_base, heures_sup, conges_payes pour congés pris et indemnité de congés, absence, prime_objectifs pour prime d'objectifs / bonus / commissions, prime_annuelle pour 13e mois / vacances, prime_exceptionnelle).
- Fin de contrat : indemnité compensatrice de congés payés → FIN_CONTRAT / indemnite_conges ; préavis → indemnite_preavis ; précarité → indemnite_precarite ; licenciement / rupture conventionnelle → indemnite_rupture ; autre indemnité compensatrice (RTT…) → FIN_CONTRAT / autre.
- Partage de la valeur : prime de partage de la valeur (PPV) et prime exceptionnelle de pouvoir d'achat (PEPA) → prime_partage_valeur, même si versée après les cotisations. Intéressement, participation, abondement → leurs catégories ; csgCrds = CSG/CRDS sur ce montant si indiquée ; modeEpargne = PLACE si placé sur PEE/PER, PERCU si versé, INCONNU sinon.
- Versé hors bulletin : une ligne « … versé brut hors bulletin » (+) va en PARTAGE_VALEUR (montant brut) ; sa contrepartie « … versé net hors bulletin » (−) va en AJUSTEMENT_NET / verse_hors_bulletin avec montant négatif.
- Acompte déjà versé (ex. « Acompte du 11/02 ») → AJUSTEMENT_NET / acompte, montant négatif.
- Cotisations par risque : Sécurité sociale maladie → sante ; complémentaire santé / mutuelle → mutuelle ; prévoyance / incapacité-invalidité-décès → prevoyance ; accidents du travail → atmp ; vieillesse plafonnée / déplafonnée → retraite_base ; Agirc-Arrco T1/T2, CEG, CET, APEC → retraite_complementaire ; allocations familiales → famille ; chômage / Pôle emploi, AGS → chomage ; CSG déductible → csg_deductible ; CSG non déductible + CRDS → csg_crds_non_deductible ; FNAL / aide au logement, CSA / solidarité autonomie, versement mobilité, formation, apprentissage, forfait social, dialogue social, « autres contributions dues par l'employeur » → autres_contributions ; convention collective (ADESATT…) → conventionnelle ; allègements / exonérations → exoneration.
- Après le net : indemnité kilométrique, IK vélo, frais professionnels, télétravail → frais_pro ; remboursement transport, Navigo, frais de transport public, forfait mobilités durables, indemnité de transport DFS → transport ; IJSS → ijss ; versement PEE/PER volontaire → versement_volontaire_pee.

À NE PAS mettre dans lines :
- les sous-totaux et totaux (« Salaire brut », « Rémunération brute », « Total des cotisations », « Indemnités non soumises », « Total dû », « Net imposable », « Net à payer », « Net payé ») : ils vont dans les totaux ;
- les lignes d'information sans incidence sur le net : « Montant net social », « Réintégration fiscale », « Cumul PAS annuel », « Transfert CSG … prestataire », « dont évolution de la rémunération … », « Total intéressement », « Journée de solidarité », commentaires sans montant (« 2 jours de RTT les 24 et 31 déc ») ;
- les numéros de renvoi entourés (①, ②, « 1 », « 4 » placés devant un total) ne font pas partie des montants : « TOTAL COTISATIONS SALARIALES ④ 683,96 » vaut 683.96.

## Format
- Montants : chaînes avec point décimal (3575.00), sans espace ni symbole €. Champ absent → null (totaux obligatoires absents → "0.00").
- notes : congés pris, absences ou événements (ex. « 2 CP »), sinon null.`
