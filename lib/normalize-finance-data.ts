import type {
  AnnexBudget,
  CashflowFrequency,
  ExpenseSchedule,
  FinanceData,
  FixedExpense,
  RentalProperty,
  RentalPropertyAddress,
  Revenue,
  SavedProject,
} from '@/lib/types'
import { EMPTY_FINANCE_DATA } from '@/lib/finance-defaults'
import { normalizeDayOfMonth } from '@/lib/cashflow-frequency'

function parseDayOfMonthFromRaw(raw: unknown): number {
  if (raw === '' || raw === null || raw === undefined) return 1
  if (typeof raw === 'number') return normalizeDayOfMonth(raw)
  if (typeof raw === 'string') {
    const t = raw.trim()
    if (t === '') return 1
    return normalizeDayOfMonth(Number(t))
  }
  return 1
}

function normalizeExpenseSchedule(raw: unknown): ExpenseSchedule | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const s = raw as Record<string, unknown>
  /** La catégorie peut être vide : l’UI la remplit ou affiche « Sans catégorie » ; ne pas invalider toute la planification. */
  const category = typeof s.category === 'string' ? s.category.trim() : ''
  const paymentMode =
    s.paymentMode === 'manual' || s.paymentMode === 'automatic' ? s.paymentMode : undefined
  if (!paymentMode) return undefined
  const day = parseDayOfMonthFromRaw(s.dayOfMonth)
  return { category, paymentMode, dayOfMonth: day }
}

function normalizeCashflowFrequency(raw: unknown): CashflowFrequency {
  if (raw === 'annual' || raw === 'quarterly' || raw === 'monthly') return raw
  return 'monthly'
}

function normalizeRevenue(raw: unknown): Revenue {
  if (!raw || typeof raw !== 'object') {
    return { id: crypto.randomUUID(), label: '', amount: 0, frequency: 'monthly' }
  }
  const e = raw as Record<string, unknown>
  const id = typeof e.id === 'string' ? e.id : crypto.randomUUID()
  const label = typeof e.label === 'string' ? e.label : ''
  const amount = typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0
  const frequency = normalizeCashflowFrequency(e.frequency)
  return { id, label, amount, frequency }
}

function normalizeFixedExpense(raw: unknown): FixedExpense {
  if (!raw || typeof raw !== 'object') {
    return { id: crypto.randomUUID(), label: '', amount: 0, frequency: 'monthly' }
  }
  const e = raw as Record<string, unknown>
  const id = typeof e.id === 'string' ? e.id : crypto.randomUUID()
  const label = typeof e.label === 'string' ? e.label : ''
  const amount = typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0
  const frequency = normalizeCashflowFrequency(e.frequency)
  const schedule = normalizeExpenseSchedule(e.schedule)
  const out: FixedExpense = { id, label, amount, frequency }
  if (schedule) out.schedule = schedule
  return out
}

function normalizeAnnexBudget(raw: unknown): AnnexBudget {
  if (!raw || typeof raw !== 'object') {
    return { id: crypto.randomUUID(), label: '', amount: 0, frequency: 'monthly' }
  }
  const e = raw as Record<string, unknown>
  const id = typeof e.id === 'string' ? e.id : crypto.randomUUID()
  const label = typeof e.label === 'string' ? e.label : ''
  const amount = typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0
  const frequency = normalizeCashflowFrequency(e.frequency)
  const schedule = normalizeExpenseSchedule(e.schedule)
  const out: AnnexBudget = { id, label, amount, frequency }
  if (schedule) out.schedule = schedule
  return out
}

function normalizeRentalAddress(raw: unknown): RentalPropertyAddress {
  if (!raw || typeof raw !== 'object') {
    return { street: '', postalCode: '', city: '' }
  }
  const a = raw as Record<string, unknown>
  return {
    street: typeof a.street === 'string' ? a.street : '',
    postalCode: typeof a.postalCode === 'string' ? a.postalCode : '',
    city: typeof a.city === 'string' ? a.city : '',
  }
}

export function normalizeFinanceData(raw: unknown): FinanceData {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(EMPTY_FINANCE_DATA)
  }
  const o = raw as Record<string, unknown>
  return {
    revenues: Array.isArray(o.revenues) ? (o.revenues as unknown[]).map(normalizeRevenue) : [],
    fixedExpenses: Array.isArray(o.fixedExpenses)
      ? (o.fixedExpenses as unknown[]).map(normalizeFixedExpense)
      : [],
    annexBudgets: Array.isArray(o.annexBudgets)
      ? (o.annexBudgets as unknown[]).map(normalizeAnnexBudget)
      : [],
    rentalProperties: Array.isArray(o.rentalProperties)
      ? (o.rentalProperties as RentalProperty[]).map((rp) => ({
          ...rp,
          address: normalizeRentalAddress(rp.address),
          additionalCharges: Array.isArray(rp.additionalCharges) ? rp.additionalCharges : [],
        }))
      : [],
    investments: Array.isArray(o.investments)
      ? (o.investments as FinanceData['investments'])
      : [],
  }
}

export function parseSavedProjects(raw: unknown): SavedProject[] {
  if (!Array.isArray(raw)) return []
  const out: SavedProject[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const p = item as Record<string, unknown>
    if (typeof p.id !== 'string' || typeof p.name !== 'string') continue
    if (!p.data || typeof p.data !== 'object') continue
    out.push({
      id: p.id,
      name: p.name.trim() || 'Sans nom',
      createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
      updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
      data: normalizeFinanceData(p.data),
    })
  }
  return out
}
