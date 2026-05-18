/** Valeur unitaire d'un ticket restaurant (entreprise). */
export const TICKET_RESTAURANT_UNIT_EUR = 8.6

function foldAccents(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/**
 * Congés payés, indemnité congés payés, indemnité kilométrique :
 * composantes du salaire de base, pas des primes (ni bonuses ni nonIncludedPrimes).
 */
export function isBaseSalaryElementCategory(category: string, description = ''): boolean {
  const c = foldAccents(`${category} ${description}`.trim())
  if (!c) return false

  if (isKilometricIndemnityLabel(c)) return true

  if (c.includes('cong')) {
    if (c.includes('objectif')) return false
    return true
  }

  return false
}

/** Indemnité kilométrique / frais de déplacement professionnels (hors vraies primes). */
function isKilometricIndemnityLabel(c: string): boolean {
  if (c.includes('kilometr') || c.includes('frais kilom') || c.includes('indemnite kilom')) return true
  if (/\bik\b/.test(c) || c === 'ik' || c.startsWith('ik ')) return true

  if (
    (c.includes('indemnite') || c.includes('frais') || c.includes('remboursement')) &&
    (c.includes('deplacement') ||
      c.includes('trajet') ||
      c.includes('transport') ||
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
