/**
 * Taxonomie des lignes d'un bulletin de paie français.
 * Partagée par l'extraction IA, la validation API, les stats et l'UI : pas d'import Prisma ici
 * (utilisable côté client). Les unions de chaînes reflètent les enums du schéma Prisma.
 *
 * Conventions de montants par bloc :
 * - REMUNERATION / PARTAGE_VALEUR / FIN_CONTRAT : `montant` = gain (négatif pour une absence).
 * - COTISATION : `montantSalarial` / `montantPatronal` positifs = retenue ; négatifs = exonération.
 * - IMPOT : `montantSalarial` = prélèvement positif, `base` = net imposable, `tauxSalarial` = taux PAS.
 * - AJUSTEMENT_NET : `montant` signé (+ ajouté au net, − retenu). Titres-restaurant : part salariale
 *   en `montantSalarial`, part patronale en `montantPatronal`, nombre de titres en `quantite`.
 */

export const PAYSLIP_KINDS = ['BULLETIN', 'EPARGNE_SALARIALE'] as const
export type PayslipKindId = (typeof PAYSLIP_KINDS)[number]

export const PAYSLIP_BLOCS = [
  'REMUNERATION',
  'PARTAGE_VALEUR',
  'FIN_CONTRAT',
  'COTISATION',
  'IMPOT',
  'AJUSTEMENT_NET',
] as const
export type PayslipBlocId = (typeof PAYSLIP_BLOCS)[number]

export const PAYSLIP_FREQUENCES = ['MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE', 'PONCTUELLE'] as const
export type PayslipFrequenceId = (typeof PAYSLIP_FREQUENCES)[number]

export const PAYSLIP_REGIMES_SOCIAUX = ['NORMAL', 'REDUIT', 'EXONERE', 'SPECIFIQUE'] as const
export type PayslipRegimeSocialId = (typeof PAYSLIP_REGIMES_SOCIAUX)[number]

export const PAYSLIP_MODES_EPARGNE = ['PLACE', 'PERCU', 'INCONNU'] as const
export type PayslipModeEpargneId = (typeof PAYSLIP_MODES_EPARGNE)[number]

/** Rôle d'une catégorie dans les statistiques d'évolution. */
export type PayslipStatRole = 'fixe' | 'variable' | 'partage_valeur' | 'fin_contrat' | null

export type PayslipCategoryDefaults = {
  frequence?: PayslipFrequenceId
  regimeSocial?: PayslipRegimeSocialId
  imposable?: boolean
  exonerationIr?: boolean
  verseEnNumeraire?: boolean
}

export type PayslipCategory = {
  id: string
  bloc: PayslipBlocId
  role: PayslipStatRole
  defaults: PayslipCategoryDefaults
}

/** Catégorie de repli, valide dans tous les blocs. */
export const OTHER_CATEGORY = 'autre'

const MENSUEL_NORMAL: PayslipCategoryDefaults = { frequence: 'MENSUELLE', regimeSocial: 'NORMAL', imposable: true }

function cat(
  bloc: PayslipBlocId,
  id: string,
  role: PayslipStatRole,
  defaults: PayslipCategoryDefaults = {},
): PayslipCategory {
  return { id, bloc, role, defaults }
}

export const PAYSLIP_CATEGORIES: readonly PayslipCategory[] = [
  // Rémunération (éléments du brut)
  cat('REMUNERATION', 'salaire_base', 'fixe', MENSUEL_NORMAL),
  cat('REMUNERATION', 'heures_sup', 'variable', { frequence: 'MENSUELLE', regimeSocial: 'REDUIT', imposable: true, exonerationIr: true }),
  cat('REMUNERATION', 'rachat_rtt', 'variable', { frequence: 'PONCTUELLE', regimeSocial: 'REDUIT', imposable: true, exonerationIr: true }),
  cat('REMUNERATION', 'prime_anciennete', 'fixe', MENSUEL_NORMAL),
  cat('REMUNERATION', 'prime_objectifs', 'variable', { frequence: 'TRIMESTRIELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('REMUNERATION', 'prime_annuelle', 'variable', { frequence: 'ANNUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('REMUNERATION', 'prime_exceptionnelle', 'variable', { frequence: 'PONCTUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('REMUNERATION', 'prime_sujetion', 'variable', MENSUEL_NORMAL),
  cat('REMUNERATION', 'avantage_nature', 'fixe', { ...MENSUEL_NORMAL, verseEnNumeraire: false }),
  cat('REMUNERATION', 'conges_payes', 'fixe', MENSUEL_NORMAL),
  cat('REMUNERATION', 'absence', 'fixe', MENSUEL_NORMAL),
  cat('REMUNERATION', 'maintien_salaire', 'fixe', MENSUEL_NORMAL),
  cat('REMUNERATION', 'activite_partielle', 'fixe', { frequence: 'MENSUELLE', regimeSocial: 'SPECIFIQUE', imposable: true }),
  cat('REMUNERATION', 'rappel_salaire', 'fixe', { frequence: 'PONCTUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('REMUNERATION', OTHER_CATEGORY, 'variable'),

  // Partage de la valeur
  cat('PARTAGE_VALEUR', 'prime_partage_valeur', 'partage_valeur', { frequence: 'PONCTUELLE', regimeSocial: 'EXONERE', imposable: true }),
  cat('PARTAGE_VALEUR', 'interessement', 'partage_valeur', { frequence: 'ANNUELLE', regimeSocial: 'SPECIFIQUE' }),
  cat('PARTAGE_VALEUR', 'participation', 'partage_valeur', { frequence: 'ANNUELLE', regimeSocial: 'SPECIFIQUE' }),
  cat('PARTAGE_VALEUR', 'abondement', 'partage_valeur', { frequence: 'PONCTUELLE', regimeSocial: 'SPECIFIQUE', imposable: false }),
  cat('PARTAGE_VALEUR', OTHER_CATEGORY, 'partage_valeur'),

  // Fin de contrat
  cat('FIN_CONTRAT', 'indemnite_rupture', 'fin_contrat', { frequence: 'PONCTUELLE', regimeSocial: 'SPECIFIQUE' }),
  cat('FIN_CONTRAT', 'indemnite_conges', 'fin_contrat', { frequence: 'PONCTUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('FIN_CONTRAT', 'indemnite_preavis', 'fin_contrat', { frequence: 'PONCTUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('FIN_CONTRAT', 'indemnite_precarite', 'fin_contrat', { frequence: 'PONCTUELLE', regimeSocial: 'NORMAL', imposable: true }),
  cat('FIN_CONTRAT', OTHER_CATEGORY, 'fin_contrat'),

  // Cotisations et contributions
  cat('COTISATION', 'sante', null),
  cat('COTISATION', 'mutuelle', null),
  cat('COTISATION', 'prevoyance', null),
  cat('COTISATION', 'atmp', null),
  cat('COTISATION', 'retraite_base', null),
  cat('COTISATION', 'retraite_complementaire', null),
  cat('COTISATION', 'famille', null),
  cat('COTISATION', 'chomage', null),
  cat('COTISATION', 'csg_deductible', null),
  cat('COTISATION', 'csg_crds_non_deductible', null),
  cat('COTISATION', 'autres_contributions', null),
  cat('COTISATION', 'conventionnelle', null),
  cat('COTISATION', 'exoneration', null),
  cat('COTISATION', OTHER_CATEGORY, null),

  // Impôt
  cat('IMPOT', 'prelevement_source', null),
  cat('IMPOT', OTHER_CATEGORY, null),

  // Ajustements après le net
  cat('AJUSTEMENT_NET', 'titres_restaurant', null),
  cat('AJUSTEMENT_NET', 'transport', null, { regimeSocial: 'EXONERE', imposable: false }),
  cat('AJUSTEMENT_NET', 'frais_pro', null, { regimeSocial: 'EXONERE', imposable: false }),
  cat('AJUSTEMENT_NET', 'ijss', null),
  cat('AJUSTEMENT_NET', 'acompte', null),
  cat('AJUSTEMENT_NET', 'saisie', null),
  cat('AJUSTEMENT_NET', 'versement_volontaire_pee', null),
  cat('AJUSTEMENT_NET', 'reprise_avantage_nature', null),
  cat('AJUSTEMENT_NET', OTHER_CATEGORY, null),
]

export function categoriesForBloc(bloc: PayslipBlocId): PayslipCategory[] {
  return PAYSLIP_CATEGORIES.filter((c) => c.bloc === bloc)
}

export function findCategory(bloc: string, categorie: string): PayslipCategory | undefined {
  return PAYSLIP_CATEGORIES.find((c) => c.bloc === bloc && c.id === categorie)
}

export function isValidCategory(bloc: string, categorie: string): boolean {
  return findCategory(bloc, categorie) != null
}

/** Identifiants uniques (toutes catégories confondues) pour l'enum du JSON Schema IA. */
export const PAYSLIP_CATEGORY_IDS: string[] = [...new Set(PAYSLIP_CATEGORIES.map((c) => c.id))]

export function categoryRole(bloc: string, categorie: string): PayslipStatRole {
  return findCategory(bloc, categorie)?.role ?? null
}

/** Clé i18n du libellé d'une catégorie (`autre` est décliné par bloc). */
export function categoryLabelKey(bloc: string, categorie: string): string {
  if (categorie === OTHER_CATEGORY) return `salaries.categories.autre_${bloc.toLowerCase()}`
  return `salaries.categories.${categorie}`
}

export function blocLabelKey(bloc: string): string {
  return `salaries.blocs.${bloc.toLowerCase()}`
}
