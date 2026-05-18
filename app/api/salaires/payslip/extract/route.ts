import type { NextRequest } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth-user-from-request'
import { isPayslipExtractionConfigured } from '@/lib/payslip-ai-config'
import {
  extractPayslipFromBuffer,
  PayslipExtractionError,
  type PayslipMime,
} from '@/lib/payslip-extract-mistral'

const MAX_BYTES = 10 * 1024 * 1024

const ALLOWED_MIMES = new Set<PayslipMime>([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
])

function normalizeMime(type: string): PayslipMime | null {
  const t = type.split(';')[0]?.trim().toLowerCase() ?? ''
  if (t === 'image/jpg') return 'image/jpeg'
  if (ALLOWED_MIMES.has(t as PayslipMime)) return t as PayslipMime
  return null
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return Response.json({ error: 'Non authentifié' }, { status: 401 })

  if (!isPayslipExtractionConfigured()) {
    return Response.json({ error: 'payslip_extraction_disabled' }, { status: 503 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof Blob)) {
    return Response.json({ error: 'missing_file' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'file_too_large' }, { status: 400 })
  }

  const mime = normalizeMime(file.type)
  if (!mime) {
    return Response.json({ error: 'invalid_file_type' }, { status: 400 })
  }

  const buf = await file.arrayBuffer()

  try {
    const extraction = await extractPayslipFromBuffer(buf, mime)
    return Response.json({ extraction })
  } catch (err) {
    if (err instanceof PayslipExtractionError) {
      if (err.code === 'not_configured') {
        return Response.json({ error: 'payslip_extraction_disabled' }, { status: 503 })
      }
      if (err.code === 'not_a_payslip') {
        return Response.json({ error: 'not_a_payslip' }, { status: 422 })
      }
      return Response.json({ error: err.code }, { status: 502 })
    }
    console.error('[payslip/extract] unexpected error')
    return Response.json({ error: 'extraction_failed' }, { status: 502 })
  }
}
