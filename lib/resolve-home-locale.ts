/** Locale d’affichage pour la page d’accueil marketing (priorité à la première langue supportée dans Accept-Language). */
export function resolveHomeLocale(acceptLanguage: string | null): 'fr' | 'en' {
  if (!acceptLanguage || !acceptLanguage.trim()) return 'fr'
  const parts = acceptLanguage.split(',').map((p) => (p.split(';')[0] ?? '').trim().toLowerCase())
  for (const p of parts) {
    if (p.startsWith('en')) return 'en'
    if (p.startsWith('fr')) return 'fr'
  }
  return 'fr'
}
