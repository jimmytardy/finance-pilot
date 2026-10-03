import { numberLocaleForLanguage } from '@/lib/i18n/locale'
import { categoryRole, type PayslipBlocId } from '@/lib/payslip-categories'
import type { PayslipDraft, PayslipDto, PayslipLineDto } from '@/lib/payslip-types'

export const fetchOpts: RequestInit = { credentials: 'include' }

export function parseAmount(v: string | number | null | undefined): number {
  if (v == null) return 0
  const n = Number(String(v).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

/** Montant avec 2 décimales, sans symbole (tableaux denses). */
export function formatAmount(n: number, language: string): string {
  return n.toLocaleString(numberLocaleForLanguage(language), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatOptionalAmount(v: string | null | undefined, language: string): string {
  return v == null || v === '' ? '—' : formatAmount(parseAmount(v), language)
}

export function formatPct(v: number | null | undefined, language: string, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return '—'
  const s = v.toLocaleString(numberLocaleForLanguage(language), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'exceptZero',
  })
  return `${s} %`
}

export function emptyLine(bloc: PayslipBlocId, categorie: string): PayslipLineDto {
  return {
    bloc,
    categorie,
    libelle: '',
    base: null,
    quantite: null,
    tauxSalarial: null,
    montantSalarial: null,
    tauxPatronal: null,
    montantPatronal: null,
    montant: null,
    frequence: null,
    regimeSocial: null,
    imposable: null,
    exonerationIr: null,
    verseEnNumeraire: true,
    modeEpargne: bloc === 'PARTAGE_VALEUR' ? 'INCONNU' : null,
    csgCrds: null,
    periodeRattachement: null,
  }
}

export function emptyDraft(): PayslipDraft {
  const now = new Date()
  return {
    kind: 'BULLETIN',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    label: null,
    brut: '',
    netAvantImpot: '',
    netImposable: '',
    netSocial: null,
    netPaye: '',
    prelevementSource: '0',
    tauxPas: null,
    totalCotisationsSalariales: null,
    totalCotisationsPatronales: null,
    coutEmployeur: null,
    heuresTravaillees: null,
    plafondSS: null,
    cumuls: null,
    notes: null,
    extractedBy: null,
    lines: [],
  }
}

export function draftFromDto(p: PayslipDto): PayslipDraft {
  const { employerId: _e, createdAt: _c, updatedAt: _u, ...rest } = p
  return { ...rest, lines: p.lines.map((l) => ({ ...l })) }
}

/** Corps JSON attendu par `POST/PUT /api/salaires/payslips`. */
export function draftToBody(d: PayslipDraft) {
  const { id: _id, ...rest } = d
  return {
    ...rest,
    lines: d.lines.map(({ id: _lid, position: _pos, ...l }) => l),
  }
}

/** Primes et éléments variables du brut (hors partage de la valeur). */
export function variableBrut(p: Pick<PayslipDto, 'lines'>): number {
  return p.lines
    .filter((l) => l.bloc === 'REMUNERATION' && categoryRole(l.bloc, l.categorie) === 'variable')
    .reduce((s, l) => s + parseAmount(l.montant), 0)
}

export function partageValeurBrut(p: Pick<PayslipDto, 'lines'>): number {
  return p.lines.filter((l) => l.bloc === 'PARTAGE_VALEUR').reduce((s, l) => s + parseAmount(l.montant), 0)
}

export function cotisationsSalariales(p: PayslipDto): number {
  const lines = p.lines.filter((l) => l.bloc === 'COTISATION')
  if (lines.length === 0) return parseAmount(p.totalCotisationsSalariales)
  return lines.reduce((s, l) => s + parseAmount(l.montantSalarial), 0)
}

export function payslipExtractErrorKey(code: string | undefined): string {
  switch (code) {
    case 'file_too_large':
      return 'salaries.extractErrorFileTooLarge'
    case 'invalid_file_type':
      return 'salaries.extractErrorInvalidType'
    case 'payslip_extraction_disabled':
      return 'salaries.extractErrorDisabled'
    case 'mistral_api_error':
      return 'salaries.extractErrorApi'
    case 'not_a_payslip':
      return 'salaries.extractErrorNotPayslip'
    default:
      return 'salaries.extractError'
  }
}
