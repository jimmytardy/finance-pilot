/**
 * Banc de test de l'extraction IA des bulletins de paie.
 *
 * Envoie chaque PDF de `examples/` à Mistral avec exactement la requête de production
 * (`lib/payslip-extraction-request.ts`), applique la normalisation, les contrôles de cohérence
 * et les stats, puis compare à `examples/expected.json`.
 *
 * Usage : MISTRAL_API_KEY=… pnpm dlx tsx --tsconfig tsconfig.json scripts/test-payslip-extraction.ts [--fresh] [fichier.pdf…]
 * Les réponses brutes sont mises en cache dans `examples/.cache/` (clé = hash du prompt + schéma + PDF) ;
 * `--fresh` force un nouvel appel.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  buildPayslipOcrRequestBody,
  MISTRAL_OCR_URL,
  parseDocumentAnnotation,
  PAYSLIP_OCR_MODEL,
} from '@/lib/payslip-extraction-request'
import { payslipExtractionWithDetectionSchema } from '@/lib/payslip-extraction-schema'
import { normalizePayslipExtraction } from '@/lib/payslip-extraction-normalize'
import { computeMonthStats } from '@/lib/salary-stats'
import type { PayslipDraft, PayslipDto } from '@/lib/payslip-types'

const EXAMPLES = path.resolve('examples')
const CACHE = path.join(EXAMPLES, '.cache')
const TOLERANCE = 0.02

type Expected = {
  year: number
  month: number
  totals: Record<string, number | null>
  stats: Record<string, number>
  pv?: Record<string, number>
  pvNet?: Record<string, number>
  lines: Record<string, number>
}

function num(v: string | null | undefined): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function close(actual: number | null, expected: number | null): boolean {
  if (expected == null) return actual == null || actual === 0
  return actual != null && Math.abs(actual - expected) <= TOLERANCE
}

async function callMistral(file: string, fresh: boolean): Promise<unknown> {
  const pdf = readFileSync(path.join(EXAMPLES, file))
  const body = buildPayslipOcrRequestBody('application/pdf', pdf.toString('base64'))
  const key = createHash('sha256')
    .update(JSON.stringify({ p: body.document_annotation_prompt, s: body.document_annotation_format }))
    .update(pdf)
    .digest('hex')
    .slice(0, 16)
  const cachePath = path.join(CACHE, `${file}.${key}.json`)
  if (!fresh && existsSync(cachePath)) return JSON.parse(readFileSync(cachePath, 'utf8'))

  const res = await fetch(MISTRAL_OCR_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Mistral HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const json = (await res.json()) as { document_annotation?: unknown }
  const annotation = parseDocumentAnnotation(json.document_annotation)
  mkdirSync(CACHE, { recursive: true })
  writeFileSync(cachePath, JSON.stringify(annotation, null, 2))
  return annotation
}

function toDto(d: PayslipDraft): PayslipDto {
  return { ...d, id: 'test', employerId: null, createdAt: '', updatedAt: '' }
}

function sumLines(d: PayslipDraft, categorie: string, field: 'montant' = 'montant'): number {
  return d.lines.filter((l) => l.categorie === categorie).reduce((s, l) => s + (num(l[field]) ?? 0), 0)
}

async function main() {
  const args = process.argv.slice(2)
  const fresh = args.includes('--fresh')
  const only = args.filter((a) => a.endsWith('.pdf'))
  const expected = JSON.parse(readFileSync(path.join(EXAMPLES, 'expected.json'), 'utf8')) as Record<string, Expected>
  const files = readdirSync(EXAMPLES)
    .filter((f) => f.endsWith('.pdf') && (only.length === 0 || only.includes(f)))
    .sort()

  let failures = 0
  for (const file of files) {
    const exp = expected[file]
    const errors: string[] = []
    let draft: PayslipDraft
    let warnings: { code: string; expected: number; actual: number }[]
    try {
      const raw = await callMistral(file, fresh)
      const parsed = payslipExtractionWithDetectionSchema.parse(raw)
      if (!parsed.isPayslip) throw new Error('isPayslip = false')
      ;({ draft, warnings } = normalizePayslipExtraction(parsed, PAYSLIP_OCR_MODEL))
    } catch (err) {
      console.log(`\n✗ ${file} — ÉCHEC : ${err instanceof Error ? err.message : err}`)
      failures++
      continue
    }

    if (!exp) {
      console.log(`\n? ${file} — pas de valeurs attendues`)
      continue
    }
    if (draft.year !== exp.year || draft.month !== exp.month) {
      errors.push(`période ${draft.year}-${draft.month} ≠ ${exp.year}-${exp.month}`)
    }
    for (const [k, v] of Object.entries(exp.totals)) {
      const a = num(draft[k as keyof PayslipDraft] as string | null)
      if (!close(a, v)) errors.push(`${k} = ${a} ≠ ${v}`)
    }
    const [m] = computeMonthStats([toDto(draft)])
    const pvBrut = Object.values(m.partageValeur).reduce((s, p) => s + p.brut, 0)
    const statActual: Record<string, number> = {
      fixeBrut: m.fixeBrut,
      variableBrut: m.variableBrut,
      finContratBrut: m.finContratBrut,
      titresRestaurant: m.titresRestaurant,
      partageValeurBrut: pvBrut,
      netEnPoche: m.netEnPocheApresImpot,
    }
    for (const [k, v] of Object.entries(exp.stats)) {
      if (!close(statActual[k], v)) errors.push(`stats.${k} = ${statActual[k]?.toFixed(2)} ≠ ${v}`)
    }
    for (const [cat, v] of Object.entries(exp.pv ?? {})) {
      const a = m.partageValeur[cat as keyof typeof m.partageValeur]?.brut ?? 0
      if (!close(a, v)) errors.push(`pv.${cat} brut = ${a} ≠ ${v}`)
    }
    for (const [cat, v] of Object.entries(exp.pvNet ?? {})) {
      const a = m.partageValeur[cat as keyof typeof m.partageValeur]?.net ?? 0
      if (!close(a, v)) errors.push(`pv.${cat} net = ${a.toFixed(2)} ≠ ${v}`)
    }
    for (const [cat, v] of Object.entries(exp.lines)) {
      const a = sumLines(draft, cat)
      if (!close(a, v)) errors.push(`lignes ${cat} = ${a.toFixed(2)} ≠ ${v}`)
    }
    for (const w of warnings) {
      errors.push(`alerte ${w.code} (attendu ${w.expected.toFixed(2)}, calculé ${w.actual.toFixed(2)})`)
    }

    if (errors.length === 0) {
      console.log(`✓ ${file} (${draft.lines.length} lignes)`)
    } else {
      failures++
      console.log(`\n✗ ${file} (${draft.lines.length} lignes)`)
      for (const e of errors) console.log(`    - ${e}`)
      if (args.includes('--lines')) {
        for (const l of draft.lines) {
          console.log(
            `      ${l.bloc}/${l.categorie} | ${l.libelle} | m=${l.montant} sal=${l.montantSalarial} pat=${l.montantPatronal} csg=${l.csgCrds} mode=${l.modeEpargne}`,
          )
        }
      }
    }
  }
  console.log(`\n${files.length - failures}/${files.length} bulletins corrects`)
  process.exit(failures > 0 ? 1 : 0)
}

void main()
