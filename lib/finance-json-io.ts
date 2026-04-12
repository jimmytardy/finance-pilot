import type { FinanceData } from '@/lib/types'
import { normalizeFinanceData } from '@/lib/normalize-finance-data'

const ROOT_KEYS = ['revenues', 'fixedExpenses', 'annexBudgets', 'rentalProperties', 'investments'] as const

export type FinanceJsonImportError = 'invalid_json' | 'not_object' | 'unexpected_shape'

function hasFinanceKeys(o: object): boolean {
  return ROOT_KEYS.some((k) => k in (o as Record<string, unknown>))
}

/** Objet racine ou enveloppe `{ "data": { … } }` (sauvegardes type projet). */
function financePayloadFromParsed(parsed: object): object | null {
  if (hasFinanceKeys(parsed)) return parsed
  const o = parsed as Record<string, unknown>
  const inner = o.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner) && hasFinanceKeys(inner)) {
    return inner
  }
  return null
}

/** Parse un export JSON : syntaxe, objet racine, forme attendue (au moins une clé connue). */
export function parseFinanceDataJson(raw: string): { ok: true; data: FinanceData } | { ok: false; error: FinanceJsonImportError } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'invalid_json' }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'not_object' }
  }
  const payload = financePayloadFromParsed(parsed as object)
  if (!payload) {
    return { ok: false, error: 'unexpected_shape' }
  }
  return { ok: true, data: normalizeFinanceData(payload) }
}

export function financeDataToFormattedJson(data: FinanceData): string {
  return JSON.stringify(data, null, 2)
}

export function downloadFinanceDataJson(data: FinanceData, filename?: string) {
  if (typeof document === 'undefined') return
  const name = filename ?? `finance-pilot-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([financeDataToFormattedJson(data)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
