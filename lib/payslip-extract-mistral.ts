import 'server-only'
import { getCanonicalEnv } from '@/lib/env'
import { normalizePayslipExtraction } from '@/lib/payslip-extraction-normalize'
import {
  PAYSLIP_EXTRACTION_PROMPT,
  payslipExtractionJsonSchema,
  payslipExtractionWithDetectionSchema,
  type PayslipExtraction,
} from '@/lib/payslip-extraction-schema'

const OCR_MODEL = 'mistral-ocr-latest'
const MISTRAL_OCR_URL = 'https://api.mistral.ai/v1/ocr'

export type PayslipMime =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'

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

function buildDocumentPayload(mime: PayslipMime, base64: string): Record<string, string> {
  if (mime === 'application/pdf') {
    return {
      type: 'document_url',
      document_url: `data:application/pdf;base64,${base64}`,
    }
  }
  return {
    type: 'image_url',
    image_url: `data:${mime};base64,${base64}`,
  }
}

function parseDocumentAnnotation(raw: unknown): unknown {
  if (raw == null) return null
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (!t) return null
    return JSON.parse(t) as unknown
  }
  return raw
}

type MistralOcrResponse = {
  document_annotation?: unknown
}

export async function extractPayslipFromBuffer(
  buffer: ArrayBuffer,
  mime: PayslipMime,
): Promise<PayslipExtraction> {
  const apiKey = getCanonicalEnv().MISTRAL_API_KEY
  if (!apiKey) throw new PayslipExtractionError('not_configured')

  const base64 = Buffer.from(buffer).toString('base64')
  const document = buildDocumentPayload(mime, base64)

  let response: Response
  try {
    response = await fetch(MISTRAL_OCR_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OCR_MODEL,
        document,
        document_annotation_format: {
          type: 'json_schema',
          json_schema: {
            name: 'payslip_extraction',
            strict: true,
            schema: payslipExtractionJsonSchema,
          },
        },
        document_annotation_prompt: PAYSLIP_EXTRACTION_PROMPT,
      }),
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

  const { isPayslip: _ignored, ...extraction } = validated.data
  return normalizePayslipExtraction(extraction)
}
