import { isValidCategory, OTHER_CATEGORY, type PayslipBlocId } from '@/lib/payslip-categories'

/** Valeur unitaire d'un ticket restaurant (entreprise) — repli si le bulletin ne donne pas le détail. */
export const TICKET_RESTAURANT_UNIT_EUR = 8.6

export function foldAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Sous-totaux et lignes d'information qui ne sont pas des éléments de paie : leurs montants vont
 * dans les totaux du document ou n'entrent pas dans le calcul du net (ex. « Transfert CSG »).
 */
export function isIgnoredLabel(libelle: string): boolean {
  const c = foldAccents(libelle)
  if (/^total\b/.test(c) || /^net\b/.test(c) || /^sous[- ]total\b/.test(c)) return true
  return [
    'salaire brut',
    'remuneration brute',
    'indemnites non soumises',
    'montant net social',
    'reintegration fiscale',
    'cumul',
    'transfert csg',
    'dont evolution',
    'journee de solidarite',
    'taux personnalise',
  ].some((p) => c.includes(p))
}

function isKilometricLabel(c: string): boolean {
  if (c.includes('kilometr') || c.includes('frais kilom') || c.includes('indemnite kilom')) return true
  if (c.includes('velo') && (c.includes('indemnite') || c.includes('kilom'))) return true
  if (/\bik\b/.test(c)) return true
  if (c.includes('teletravail')) return true
  if (c.includes('chevaux fiscaux') || (c.includes('cv') && c.includes('km'))) return true
  return false
}

function isTransportLabel(c: string): boolean {
  if (
    c.includes('transport') &&
    (/\bdfs\b/.test(c) || ['rembours', 'indemnite', 'frais', 'public', 'abonnement', 'prise en charge'].some((p) => c.includes(p)))
  ) {
    return true
  }
  return c.includes('navigo') || c.includes('mobilites durables') || c.includes('forfait mobilite')
}

function isCongesLabel(c: string): boolean {
  return c.includes('conge') || /\bcp\b/.test(c)
}

/** Catégorie de risque d'une cotisation d'après son libellé (CSG testée d'abord : « CSG déductible mutuelle »). */
function cotisationRisk(c: string): string | null {
  if (c.includes('csg') || c.includes('crds')) {
    if (c.includes('non deduct') || c.includes('crds')) return 'csg_crds_non_deductible'
    return 'csg_deductible'
  }
  if (c.includes('exoneration') || c.includes('allegement') || c.includes('reduction generale')) return 'exoneration'
  if (c.includes('chomage') || c.includes('pole emploi') || /\bags\b/.test(c)) return 'chomage'
  if (
    c.includes('agirc') ||
    c.includes('arrco') ||
    /\b(ceg|cet|apec)\b/.test(c) ||
    c.includes('equilibre') ||
    (c.includes('complementaire') && c.includes('tranche'))
  ) {
    return 'retraite_complementaire'
  }
  if (c.includes('mutuelle') || c.includes('complementaire - sante') || c.includes('complementaire sante')) return 'mutuelle'
  if (c.includes('prevoyance') || c.includes('incap')) return 'prevoyance'
  if (c.includes('accident')) return 'atmp'
  if (c.includes('allocations familiales') || c === 'famille') return 'famille'
  if (c.includes('maladie')) return 'sante'
  if (c.includes('vieillesse') || c.includes('plafonnee')) return 'retraite_base'
  return null
}

/**
 * Garde-fou après l'IA : corrige le bloc / la catégorie d'après le libellé pour les cas
 * fréquemment mal rangés, et retombe sur `autre` si le couple bloc / catégorie est invalide.
 */
export function reclassifyLine(
  bloc: PayslipBlocId,
  categorie: string,
  libelle: string,
): { bloc: PayslipBlocId; categorie: string } {
  const c = foldAccents(libelle)

  if (bloc !== 'COTISATION' && bloc !== 'IMPOT') {
    // Contrepartie nette d'un montant versé par un tiers (gestionnaire d'épargne salariale).
    if (c.includes('hors bulletin') && /\bnet\b/.test(c)) return { bloc: 'AJUSTEMENT_NET', categorie: 'verse_hors_bulletin' }
    if (c.includes('partage') && c.includes('valeur')) return { bloc: 'PARTAGE_VALEUR', categorie: 'prime_partage_valeur' }
    if (/\b(ppv|pepa)\b/.test(c) || (c.includes('pouvoir') && c.includes('achat'))) {
      return { bloc: 'PARTAGE_VALEUR', categorie: 'prime_partage_valeur' }
    }
    if (c.includes('interessement') || c.includes('interressement')) return { bloc: 'PARTAGE_VALEUR', categorie: 'interessement' }
    // « Participation » seule = participation aux résultats ; pas « participation employeur transport / mutuelle ».
    const participationAutre = ['employeur', 'patronal', 'transport', 'mutuelle', 'sante', 'prevoyance', 'repas']
    if (c.includes('participation') && !participationAutre.some((p) => c.includes(p))) {
      return { bloc: 'PARTAGE_VALEUR', categorie: 'participation' }
    }
    if (c.includes('abondement')) return { bloc: 'PARTAGE_VALEUR', categorie: 'abondement' }
    if (c.includes('titre') && c.includes('restaurant')) return { bloc: 'AJUSTEMENT_NET', categorie: 'titres_restaurant' }
    if (c.includes('ticket') && c.includes('resto')) return { bloc: 'AJUSTEMENT_NET', categorie: 'titres_restaurant' }
    if (c.includes('acompte') || c.includes('avance sur salaire')) return { bloc: 'AJUSTEMENT_NET', categorie: 'acompte' }
    if (isTransportLabel(c)) return { bloc: 'AJUSTEMENT_NET', categorie: 'transport' }
    if (isKilometricLabel(c)) return { bloc: 'AJUSTEMENT_NET', categorie: 'frais_pro' }

    // Fin de contrat : indemnités compensatrices, précarité, rupture.
    if (c.includes('compensatrice')) {
      if (isCongesLabel(c)) return { bloc: 'FIN_CONTRAT', categorie: 'indemnite_conges' }
      if (c.includes('preavis')) return { bloc: 'FIN_CONTRAT', categorie: 'indemnite_preavis' }
      return { bloc: 'FIN_CONTRAT', categorie: OTHER_CATEGORY }
    }
    if (c.includes('precarite') || c.includes('fin de contrat')) return { bloc: 'FIN_CONTRAT', categorie: 'indemnite_precarite' }
    if (c.includes('licenciement') || c.includes('rupture conventionnelle') || c.includes('depart a la retraite')) {
      return { bloc: 'FIN_CONTRAT', categorie: 'indemnite_rupture' }
    }

    if (bloc === 'REMUNERATION') {
      // En premier : un commentaire (« 1 jour de congés payés pris ») est parfois collé au libellé.
      if (c.startsWith('salaire de base') || c.includes('appointement')) return { bloc, categorie: 'salaire_base' }
      if (c.includes('objectif') || c.includes('bonus') || c.includes('commission')) return { bloc, categorie: 'prime_objectifs' }
      if (c.includes('anciennete')) return { bloc, categorie: 'prime_anciennete' }
      if (c.includes('heures sup') || c.includes('heures compl')) return { bloc, categorie: 'heures_sup' }
      if (isCongesLabel(c)) return { bloc, categorie: 'conges_payes' }
      if (c.includes('absence')) return { bloc, categorie: 'absence' }
      if (c.includes('rtt')) return { bloc, categorie: 'conges_payes' }
    }
  }

  if (bloc === 'COTISATION') {
    const risque = cotisationRisk(c)
    if (risque) return { bloc, categorie: risque }
  }

  if (!isValidCategory(bloc, categorie)) return { bloc, categorie: OTHER_CATEGORY }
  return { bloc, categorie }
}
