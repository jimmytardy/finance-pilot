import { getCanonicalEnv } from '@/lib/env'

/** Serveur : extraction fiche de paye via Mistral OCR (sans exposer la clé). */
export function isPayslipExtractionConfigured(): boolean {
  try {
    return Boolean(getCanonicalEnv().MISTRAL_API_KEY?.trim())
  } catch {
    return false
  }
}
