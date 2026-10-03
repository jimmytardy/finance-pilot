import 'server-only'
import { getCanonicalEnv } from '@/lib/env'
import { normalizePayslipExtraction, type PayslipWarning } from '@/lib/payslip-extraction-normalize'
import { payslipExtractionWithDetectionSchema } from '@/lib/payslip-extraction-schema'
import {
  buildPayslipOcrRequestBody,
  MISTRAL_OCR_URL,
  parseDocumentAnnotation,
  PAYSLIP_OCR_MODEL,
  type PayslipMime,
} from '@/lib/payslip-extraction-request'
import type { PayslipDraft } from '@/lib/payslip-types'

export type { PayslipMime }

export class PayslipExtractionError extends Error {
  constructor(
    readonly code:
      | 'mistral_api_error'
      | 'extraction_failed'
      | 'not_configured'
      | 'not_a_payslip',
    message?: string,
  ) {
    super(message ?? code)
    this.name = 'PayslipExtractionError'
  }
}

type MistralOcrResponse = {
  document_annotation?: unknown
}

export async function extractPayslipFromBuffer(
  buffer: ArrayBuffer,
  mime: PayslipMime,
): Promise<{ draft: PayslipDraft; warnings: PayslipWarning[] }> {
  const apiKey = getCanonicalEnv().MISTRAL_API_KEY
  if (!apiKey) throw new PayslipExtractionError('not_configured')

  const base64 = Buffer.from(buffer).toString('base64')

  let response: Response
  try {
    response = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildPayslipOcrRequestBody(mime, base64)),
    })
  } catch (err) {
    console.error('[payslip-extract] fetch error:', err instanceof Error ? err.message : 'unknown')
    throw new PayslipExtractionError('mistral_api_error')
  }

  if (!response.ok) {
    console.error('[payslip-extract] Mistral HTTP', response.status)
    throw new PayslipExtractionError('mistral_api_error')
  }

  let body: MistralOcrResponse
  try {
    body = (await response.json()) as MistralOcrResponse
  } catch {
    throw new PayslipExtractionError('mistral_api_error')
  }

  let parsedRaw: unknown
  try {
    parsedRaw = parseDocumentAnnotation(body.document_annotation)
  } catch {
    throw new PayslipExtractionError('extraction_failed')
  }

  const validated = payslipExtractionWithDetectionSchema.safeParse(parsedRaw)
  if (!validated.success) {
    console.error('[payslip-extract] Zod validation failed')
    throw new PayslipExtractionError('extraction_failed')
  }

  if (!validated.data.isPayslip) {
    throw new PayslipExtractionError('not_a_payslip')
  }

  return normalizePayslipExtraction(validated.data, PAYSLIP_OCR_MODEL)
}
