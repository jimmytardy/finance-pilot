/**
 * Langues proposées dans l’UI. Ajouter une entrée ici + traductions pour étendre le site.
 */
export const UI_LANGUAGE_OPTIONS = [
  { code: 'fr', labelKey: 'navigation.languageFr' as const },
  { code: 'en', labelKey: 'navigation.languageEn' as const },
] as const

export type UiLanguageCode = (typeof UI_LANGUAGE_OPTIONS)[number]['code']

export function resolveUiLanguageCode(i18nLanguage: string): UiLanguageCode {
  const base = i18nLanguage.split('-')[0]?.toLowerCase() ?? 'fr'
  const match = UI_LANGUAGE_OPTIONS.find((o) => o.code === base)
  return match ? match.code : UI_LANGUAGE_OPTIONS[0].code
}
