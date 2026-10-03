import { isValidCategory, OTHER_CATEGORY, type PayslipBlocId } from '@/lib/payslip-categories'

/** Valeur unitaire d'un ticket restaurant (entreprise) — repli si le bulletin ne donne pas le détail. */
export const TICKET_RESTAURANT_UNIT_EUR = 8.6

function foldAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
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
  if (c.includes('transport') && (/\bdfs\b/.test(c) || c.includes('rembours') || c.includes('indemnite'))) return true
  if (c.includes('navigo') || c.includes('mobilites durables') || c.includes('forfait mobilite')) return true
  return false
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

  if (bloc !== 'COTISATION') {
    if (c.includes('partage') && c.includes('valeur')) return { bloc: 'PARTAGE_VALEUR', categorie: 'prime_partage_valeur' }
    if (/\b(ppv|pepa)\b/.test(c)) return { bloc: 'PARTAGE_VALEUR', categorie: 'prime_partage_valeur' }
    if (c.includes('interessement') || c.includes('interressement')) return { bloc: 'PARTAGE_VALEUR', categorie: 'interessement' }
    if (c.includes('abondement')) return { bloc: 'PARTAGE_VALEUR', categorie: 'abondement' }
    if (c.includes('titre') && c.includes('restaurant')) return { bloc: 'AJUSTEMENT_NET', categorie: 'titres_restaurant' }
    if (c.includes('ticket') && c.includes('resto')) return { bloc: 'AJUSTEMENT_NET', categorie: 'titres_restaurant' }
    if (isTransportLabel(c)) return { bloc: 'AJUSTEMENT_NET', categorie: 'transport' }
    if (isKilometricLabel(c)) return { bloc: 'AJUSTEMENT_NET', categorie: 'frais_pro' }
  }

  if (!isValidCategory(bloc, categorie)) return { bloc, categorie: OTHER_CATEGORY }
  return { bloc, categorie }
}
