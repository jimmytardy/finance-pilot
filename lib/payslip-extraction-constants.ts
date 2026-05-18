/** Valeur unitaire d'un ticket restaurant (entreprise) — repli si le bulletin ne donne pas le détail. */
export const TICKET_RESTAURANT_UNIT_EUR = 8.6

export const KILOMETRIC_INDEMNITY_CATEGORY = 'Indemnité kilométrique'
export const TRANSPORT_DFS_INDEMNITY_CATEGORY = 'Indemnité de transport (DFS)'

function foldAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function foldedLabel(category: string, description = ''): string {
  return foldAccents(`${category} ${description}`.trim())
}

/**
 * Congés payés et indemnité congés payés : composantes du salaire de base
 * (dans brut / net), pas des primes.
 */
export function isBaseSalaryElementCategory(category: string, description = ''): boolean {
  const c = foldedLabel(category, description)
  if (!c) return false
  if (isNonIncludedIndemnityLabel(c)) return false

  if (c.includes('cong')) {
    if (c.includes('objectif')) return false
    return true
  }

  return false
}

/** Indemnité de transport (DFS) : prime non incluse au brut de base. */
export function isTransportDfsIndemnityCategory(category: string, description = ''): boolean {
  const c = foldedLabel(category, description)
  return c.length > 0 && isTransportDfsIndemnityLabel(c)
}

/** Indemnité kilométrique : prime non incluse au brut de base. */
export function isKilometricIndemnityCategory(category: string, description = ''): boolean {
  const c = foldedLabel(category, description)
  if (!c || isTransportDfsIndemnityLabel(c)) return false
  return isKilometricIndemnityLabel(c)
}

/** IK ou indemnité transport DFS : hors salaire de base, en primes non incluses. */
export function isNonIncludedIndemnityCategory(category: string, description = ''): boolean {
  return (
    isTransportDfsIndemnityCategory(category, description) ||
    isKilometricIndemnityCategory(category, description)
  )
}

export function normalizeNonIncludedIndemnityCategory(
  category: string,
  description = '',
): string | null {
  if (isTransportDfsIndemnityCategory(category, description)) return TRANSPORT_DFS_INDEMNITY_CATEGORY
  if (isKilometricIndemnityCategory(category, description)) return KILOMETRIC_INDEMNITY_CATEGORY
  return null
}

function isNonIncludedIndemnityLabel(c: string): boolean {
  return isTransportDfsIndemnityLabel(c) || isKilometricIndemnityLabel(c)
}

function isTransportDfsIndemnityLabel(c: string): boolean {
  if (c.includes('indemnite de transport') && c.includes('dfs')) return true
  if (c.includes('indemnite transport') && c.includes('dfs')) return true
  if (/\bdfs\b/.test(c) && c.includes('transport')) return true
  return false
}

/** Indemnité kilométrique / vélo (hors transport DFS). */
function isKilometricIndemnityLabel(c: string): boolean {
  if (isTransportDfsIndemnityLabel(c)) return false

  if (c.includes('kilometr') || c.includes('frais kilom') || c.includes('indemnite kilom')) return true
  if (c.includes('velo') && (c.includes('indemnite') || c.includes('kilom'))) return true
  if (/\bik\b/.test(c) || c === 'ik' || c.startsWith('ik ')) return true

  if (
    (c.includes('indemnite') || c.includes('frais') || c.includes('remboursement')) &&
    (c.includes('deplacement') ||
      c.includes('trajet') ||
      c.includes('vehicule') ||
      c.includes('voiture') ||
      c.includes('automobile'))
  ) {
    return true
  }

  if (c.includes('chevaux fiscaux') || (c.includes('cv') && c.includes('km'))) return true

  return false
}

/** Libellés courts et homogènes pour les vraies primes (hors salaire de base). */
export function normalizePrimeCategoryLabel(category: string, description = ''): string {
  const raw = category.trim().replace(/^['"]+|['"]+$/g, '')
  if (!raw) return raw

  const indemnityLabel = normalizeNonIncludedIndemnityCategory(raw, description)
  if (indemnityLabel) return indemnityLabel
  if (isBaseSalaryElementCategory(raw, description)) return raw

  const combined = foldAccents(`${raw} ${description}`)
  const c = foldAccents(raw)

  if (combined.includes('interessement') || combined.includes('interressement')) return 'Interressement'
  if (combined.includes('objectif')) return 'Objectifs'
  if (combined.includes('partage') && combined.includes('valeur')) return 'Partage de valeur'

  if (c === 'primes' || c === 'prime') {
    return 'Primes'
  }

  const primeDe = /^prime\s+de\s+(.+)$/i.exec(raw)
  if (primeDe) return titleCasePrimeLabel(primeDe[1])

  const primeD = /^prime\s+d[''](.+)$/i.exec(raw)
  if (primeD) return titleCasePrimeLabel(primeD[1])

  const primeBare = /^prime\s+(.+)$/i.exec(raw)
  if (primeBare) return titleCasePrimeLabel(primeBare[1])

  return raw
}

function titleCasePrimeLabel(fragment: string): string {
  const t = fragment.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1)
}
