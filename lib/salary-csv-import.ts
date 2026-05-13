/** Normalise un en-tête CSV pour correspondance (minuscules, sans accents superflus). */
function normHeader(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
}

type ColKey =
  | 'year'
  | 'month'
  | 'brut'
  | 'netImposable'
  | 'netPaye'
  | 'prelevementSource'
  | 'ticketRestaurant'
  | 'primesIndemnitesIncluses'
  | 'primesIndemnitesNonIncluses'
  | 'explanation'

const HEADER_ALIASES: Record<string, ColKey> = {
  annee: 'year',
  année: 'year',
  year: 'year',
  mois: 'month',
  month: 'month',
  brut: 'brut',
  'net imposable': 'netImposable',
  netimposable: 'netImposable',
  'net taxable': 'netImposable',
  'taxable net': 'netImposable',
  'net paye': 'netPaye',
  'net payé': 'netPaye',
  netpaye: 'netPaye',
  'prelevement a la source': 'prelevementSource',
  'prélèvement à la source': 'prelevementSource',
  prelevementalasource: 'prelevementSource',
  pas: 'prelevementSource',
  'ticket restaurant': 'ticketRestaurant',
  ticketrestaurant: 'ticketRestaurant',
  tr: 'ticketRestaurant',
  'primes indemnites incluses': 'primesIndemnitesIncluses',
  'primes / indemnites incluses': 'primesIndemnitesIncluses',
  'primes indemnites non incluses': 'primesIndemnitesNonIncluses',
  'primes / indemnites non incluses': 'primesIndemnitesNonIncluses',
  explication: 'explanation',
  commentaire: 'explanation',
}

export type ParsedSalaryRow = {
  year: number
  month: number
  brut: string
  netImposable: string
  netPaye: string
  prelevementSource: string
  ticketRestaurant: string
  primesIndemnitesIncluses: string
  primesIndemnitesNonIncluses: string
  explanation: string | null
  rowIndex: number
}

function parseMoney(v: unknown): string {
  if (v == null || v === '') return '0'
  if (typeof v === 'number' && Number.isFinite(v)) return v.toFixed(2)
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.')
  const n = Number(s)
  if (!Number.isFinite(n)) return '0'
  return n.toFixed(2)
}

function parseYear(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isInteger(v)) return v
  const n = parseInt(String(v).trim(), 10)
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null
}

function parseMonth(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) {
    const m = Math.round(v)
    return m >= 1 && m <= 12 ? m : null
  }
  const n = parseInt(String(v).trim(), 10)
  return Number.isFinite(n) && n >= 1 && n <= 12 ? n : null
}

/** Découpe une ligne CSV en respectant les champs entre guillemets. */
export function splitCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && c === delimiter) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out.map((s) => s.trim())
}

function detectDelimiter(headerLine: string): ',' | ';' {
  const semi = (headerLine.match(/;/g) ?? []).length
  const comma = (headerLine.match(/,/g) ?? []).length
  return semi > comma ? ';' : ','
}

/**
 * Lit un fichier CSV (UTF-8, virgule ou point-virgule) et retourne des lignes prêtes pour upsert Prisma.
 */
export function parseSalaryCsvText(text: string): {
  rows: ParsedSalaryRow[]
  errors: string[]
} {
  const errors: string[] = []
  let normalized = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)

  if (lines.length < 2) {
    errors.push('empty_or_header_only')
    return { rows: [], errors }
  }

  const delim = detectDelimiter(lines[0]!)
  const headerCells = splitCsvLine(lines[0]!, delim)
  const colByKey = new Map<ColKey, number>()
  headerCells.forEach((h, idx) => {
    const nk = normHeader(h)
    const mapped = HEADER_ALIASES[nk]
    if (mapped != null) colByKey.set(mapped, idx)
  })

  const required: ColKey[] = ['year', 'month', 'brut', 'netImposable', 'netPaye', 'prelevementSource', 'ticketRestaurant']
  for (const r of required) {
    if (!colByKey.has(r)) errors.push(`missing_column:${r}`)
  }
  if (errors.length > 0) return { rows: [], errors }

  const out: ParsedSalaryRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const rowIndex = i + 1
    const cells = splitCsvLine(lines[i]!, delim)
    const get = (k: ColKey) => {
      const idx = colByKey.get(k)
      return idx != null && idx < cells.length ? cells[idx] : ''
    }
    const year = parseYear(get('year'))
    const month = parseMonth(get('month'))
    if (year == null || month == null) {
      errors.push(`row_${rowIndex}:invalid_year_month`)
      continue
    }
    out.push({
      year,
      month,
      brut: parseMoney(get('brut')),
      netImposable: parseMoney(get('netImposable')),
      netPaye: parseMoney(get('netPaye')),
      prelevementSource: parseMoney(get('prelevementSource')),
      ticketRestaurant: parseMoney(get('ticketRestaurant')),
      primesIndemnitesIncluses: colByKey.has('primesIndemnitesIncluses')
        ? parseMoney(get('primesIndemnitesIncluses'))
        : '0',
      primesIndemnitesNonIncluses: colByKey.has('primesIndemnitesNonIncluses')
        ? parseMoney(get('primesIndemnitesNonIncluses'))
        : '0',
      explanation: (() => {
        const ex = get('explanation')
        if (ex == null || ex === '') return null
        return String(ex).trim().slice(0, 20000)
      })(),
      rowIndex,
    })
  }

  return { rows: out, errors }
}

export function parseSalaryCsvBuffer(buffer: ArrayBuffer): {
  rows: ParsedSalaryRow[]
  errors: string[]
} {
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer)
  return parseSalaryCsvText(text)
}

/** Ligne d’en-tête du modèle (séparateur point-virgule, lisible dans Excel FR). */
export const SALARY_CSV_TEMPLATE_HEADER =
  'Année;Mois;Brut;Net imposable;Net payé;Prélèvement à la source;Ticket restaurant;Primes / indemnités incluses;Primes / indemnités non incluses;Explication'

export const SALARY_CSV_TEMPLATE_EXAMPLE = '2024;1;3500;2800;2200;400;150;0;0;'
