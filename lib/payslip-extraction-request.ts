import {
  PAYSLIP_EXTRACTION_PROMPT,
  payslipExtractionJsonSchema,
} from '@/lib/payslip-extraction-schema'

export const PAYSLIP_OCR_MODEL = 'mistral-ocr-latest'
export const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'

export type PayslipMime = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp'

/**
 * Corps de la requête Mistral OCR + annotation du document.
 * Partagé par l'API et le script de test (`scripts/test-payslip-extraction.ts`).
 */
export function buildPayslipOcrRequestBody(mime: PayslipMime, base64: string) {
  const document =
    mime === 'application/pdf'
      ? { type: 'document_url', document_url: `data:application/pdf;base64,${base64}` }
      : { type: 'image_url', image_url: `data:${mime};base64,${base64}` }
  return {
    model: PAYSLIP_OCR_MODEL,
    document,
    document_annotation_format: {
      type: 'json_schema',
      json_schema: {
        name: 'payslip_detailed_extraction',
        strict: true,
        schema: payslipExtractionJsonSchema,
      },
    },
    document_annotation_prompt: PAYSLIP_EXTRACTION_PROMPT,
  }
}

/** `document_annotation` arrive en chaîne JSON (ou déjà parsé selon les versions de l'API). */
export function parseDocumentAnnotation(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return null
    return JSON.parse(t) as unknown
  }
  return raw
}
