'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Coins, FileText, FileUp, Loader2, Pencil, Plus, Receipt, Trash2, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatMonthLongName } from '@/lib/salary-month-label'

type BonusBasis = 'BRUT' | 'NET'
type BonusFlow = 'FIXE' | 'VARIABLE'

type BonusDto = {
  id: string
  category: string
  description: string
  amount: string
  basis: BonusBasis
  flow: BonusFlow
}

type NonIncludedPrimeDto = {
  id: string
  category: string
  description: string
  amount: string
}

export type SalaryMonthDto = {
  id: string
  year: number
  month: number
  employerId: string | null
  brut: string
  netImposable: string
  netPaye: string
  prelevementSource: string
  ticketRestaurant: string
  primesIndemnitesIncluses: string
  primesIndemnitesNonIncluses: string
  explanation: string | null
  bonuses: BonusDto[]
  nonIncludedPrimes: NonIncludedPrimeDto[]
}

type EmployerDto = { id: string; name: string }

type PendingBonus = {
  category: string
  description: string
  amount: string
  basis: BonusBasis
  flow: BonusFlow
}

type PendingNonIncludedPrime = {
  category: string
  description: string
  amount: string
}

type PayslipExtractionPayload = {
  year?: number
  month?: number
  brut: string
  netImposable: string
  netPaye: string
  prelevementSource: string
  ticketRestaurant: string
  explanation?: string | null
  primesIndemnitesIncluses?: string
  bonuses?: Array<{
    category: string
    description?: string
    amount: string
    basis?: BonusBasis
    flow?: BonusFlow
  }>
  nonIncludedPrimes?: Array<{
    category: string
    description?: string
    amount: string
  }>
}

export type SalarySaisieClientProps = {
  payslipExtractionEnabled?: boolean
}

const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const emptyBulletinForm = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  brut: '',
  netImposable: '',
  netPaye: '',
  prelevementSource: '',
  ticketRestaurant: '',
  explanation: '',
}

const fetchOpts: RequestInit = { credentials: 'include' }

function periodLabel(year: number, month: number, language: string): string {
  return `${formatMonthLongName(month, language)} ${year}`
}

function parsePrimeAmount(s: string): number {
  const n = Number(String(s).replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

function sumIncluses(row: SalaryMonthDto): number {
  const fromBonuses = (row.bonuses ?? []).reduce((s, b) => s + parsePrimeAmount(b.amount), 0)
  if (fromBonuses > 0) return fromBonuses
  return parsePrimeAmount(row.primesIndemnitesIncluses)
}

function sumNonIncluses(row: SalaryMonthDto): number {
  const fromLines = (row.nonIncludedPrimes ?? []).reduce((s, p) => s + parsePrimeAmount(p.amount), 0)
  if (fromLines > 0) return fromLines
  return parsePrimeAmount(row.primesIndemnitesNonIncluses)
}

function sumTotalPrimes(row: SalaryMonthDto): number {
  return sumIncluses(row) + sumNonIncluses(row)
}

/** Brut bulletin moins les primes / indemnités déjà incluses dans ce brut. */
function brutHorsPrimesIncluses(row: SalaryMonthDto): number {
  return Math.max(0, parsePrimeAmount(row.brut) - sumIncluses(row))
}

function formatAmount(n: number, locale: string): string {
  const loc = locale === 'en' ? 'en-GB' : 'fr-FR'
  return n.toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Montant inclus + lignes de prime détaillées. */
function primesInclusesItemCount(row: SalaryMonthDto): number {
  const bonusCount = row.bonuses?.length ?? 0
  const inclusesField = parsePrimeAmount(row.primesIndemnitesIncluses) > 0 ? 1 : 0
  return bonusCount + inclusesField
}

function nonInclusesItemCount(row: SalaryMonthDto): number {
  return row.nonIncludedPrimes?.length ?? 0
}

function payslipExtractErrorKey(code: string | undefined): string {
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

export function SalarySaisieClient({ payslipExtractionEnabled = false }: SalarySaisieClientProps) {
  const { t, i18n } = useTranslation()
  const payslipInputRef = useRef<HTMLInputElement>(null)
  const [months, setMonths] = useState<SalaryMonthDto[]>([])
  const [employers, setEmployers] = useState<EmployerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBulletinForm)
  const [extracting, setExtracting] = useState(false)
  const [uploadedPayslipName, setUploadedPayslipName] = useState<string | null>(null)
  const [pendingPrimesIncluses, setPendingPrimesIncluses] = useState<string | null>(null)
  const [pendingBonuses, setPendingBonuses] = useState<PendingBonus[]>([])
  const [pendingNonIncludedPrimes, setPendingNonIncludedPrimes] = useState<PendingNonIncludedPrime[]>([])
  const [primesDialogMonthId, setPrimesDialogMonthId] = useState<string | null>(null)
  const [primesIncluses, setPrimesIncluses] = useState('0')
  const [nonInclusesDialogMonthId, setNonInclusesDialogMonthId] = useState<string | null>(null)
  const [bonusDraft, setBonusDraft] = useState({
    category: '',
    description: '',
    amount: '',
    basis: 'BRUT' as BonusBasis,
    flow: 'VARIABLE' as BonusFlow,
  })
  const [nonIncludedDraft, setNonIncludedDraft] = useState({
    category: '',
    description: '',
    amount: '',
  })
  const [overwriteTarget, setOverwriteTarget] = useState<SalaryMonthDto | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, eRes] = await Promise.all([
        fetch('/api/salaires/months', fetchOpts),
        fetch('/api/salaires/employers', fetchOpts),
      ])
      if (!mRes.ok) throw new Error('months')
      if (!eRes.ok) throw new Error('employers')
      setMonths(await mRes.json())
      setEmployers(await eRes.json())
    } catch {
      toast.error(t('salaries.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = useMemo(
    () => [...months].sort((a, b) => (a.year !== b.year ? b.year - a.year : b.month - a.month)),
    [months],
  )

  const pendingPrimePreview = useMemo(() => {
    const lines: { name: string; amount: string }[] = []
    for (const b of pendingBonuses) {
      lines.push({ name: b.category, amount: b.amount })
    }
    if (
      pendingPrimesIncluses != null &&
      parsePrimeAmount(pendingPrimesIncluses) > 0 &&
      pendingBonuses.length === 0
    ) {
      lines.push({ name: t('salaries.colPrimesIncluses'), amount: pendingPrimesIncluses })
    }
    for (const p of pendingNonIncludedPrimes) {
      lines.push({ name: p.category, amount: p.amount })
    }
    return lines
  }, [pendingBonuses, pendingNonIncludedPrimes, pendingPrimesIncluses, t])

  const primesDialogRow = primesDialogMonthId ? months.find((m) => m.id === primesDialogMonthId) : null
  const nonInclusesDialogRow = nonInclusesDialogMonthId
    ? months.find((m) => m.id === nonInclusesDialogMonthId)
    : null
  const primesDialogBonuses = primesDialogRow?.bonuses ?? []
  const nonInclusesDialogLines = nonInclusesDialogRow?.nonIncludedPrimes ?? []

  const clearPayslipPending = () => {
    setPendingPrimesIncluses(null)
    setPendingBonuses([])
    setPendingNonIncludedPrimes([])
  }

  const clearPayslipExtraction = () => {
    setUploadedPayslipName(null)
    setForm({ ...emptyBulletinForm })
    clearPayslipPending()
  }

  const openNew = () => {
    setEditingId(null)
    clearPayslipExtraction()
    setDialogOpen(true)
  }

  const openEdit = (row: SalaryMonthDto) => {
    setEditingId(row.id)
    setUploadedPayslipName(null)
    setForm({
      year: row.year,
      month: row.month,
      brut: row.brut,
      netImposable: row.netImposable,
      netPaye: row.netPaye,
      prelevementSource: row.prelevementSource,
      ticketRestaurant: row.ticketRestaurant,
      explanation: row.explanation ?? '',
    })
    setDialogOpen(true)
  }

  const openPrimesDialog = (row: SalaryMonthDto) => {
    setPrimesDialogMonthId(row.id)
    setPrimesIncluses(row.primesIndemnitesIncluses)
    setBonusDraft({ category: '', description: '', amount: '', basis: 'BRUT', flow: 'VARIABLE' })
  }

  const openNonInclusesDialog = (row: SalaryMonthDto) => {
    setNonInclusesDialogMonthId(row.id)
    setNonIncludedDraft({ category: '', description: '', amount: '' })
  }

  const buildMonthBody = (overwrite: boolean): Record<string, unknown> => {
    const body: Record<string, unknown> = {
      year: form.year,
      month: form.month,
      brut: form.brut,
      netImposable: form.netImposable,
      netPaye: form.netPaye,
      prelevementSource: form.prelevementSource,
      ticketRestaurant: form.ticketRestaurant,
      explanation: form.explanation || null,
    }
    if (pendingPrimesIncluses != null && pendingPrimesIncluses.trim() !== '') {
      body.primesIndemnitesIncluses = pendingPrimesIncluses
    } else if (overwrite) {
      body.primesIndemnitesIncluses = '0'
    }
    if (overwrite) {
      body.primesIndemnitesNonIncluses = '0'
    }
    return body
  }

  const clearMonthPrimes = async (row: SalaryMonthDto) => {
    await Promise.all(
      (row.bonuses ?? []).map((b) =>
        fetch(`/api/salaires/months/${row.id}/bonuses/${b.id}`, { method: 'DELETE', ...fetchOpts }),
      ),
    )
    await Promise.all(
      (row.nonIncludedPrimes ?? []).map((p) =>
        fetch(`/api/salaires/months/${row.id}/non-included-primes/${p.id}`, {
          method: 'DELETE',
          ...fetchOpts,
        }),
      ),
    )
  }

  const addPendingPrimes = async (monthId: string) => {
    for (const b of pendingBonuses) {
      const bonusRes = await fetch(`/api/salaires/months/${monthId}/bonuses`, {
        ...fetchOpts,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: b.category,
          description: b.description,
          amount: b.amount,
          basis: b.basis,
          flow: b.flow,
        }),
      })
      if (!bonusRes.ok) throw new Error('bonus')
    }
    for (const p of pendingNonIncludedPrimes) {
      const primeRes = await fetch(`/api/salaires/months/${monthId}/non-included-primes`, {
        ...fetchOpts,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: p.category,
          description: p.description,
          amount: p.amount,
        }),
      })
      if (!primeRes.ok) throw new Error('non_included')
    }
  }

  const persistMonth = async (replaceExistingId: string | null) => {
    const isOverwrite = replaceExistingId != null && !editingId
    const body = buildMonthBody(isOverwrite)
    const targetId = editingId ?? replaceExistingId
    const url = targetId ? `/api/salaires/months/${targetId}` : '/api/salaires/months'
    const method = targetId ? 'PATCH' : 'POST'

    setSaving(true)
    try {
      const res = await fetch(url, {
        ...fetchOpts,
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        if (res.status === 409 && !editingId) {
          const existing = months.find((m) => m.year === form.year && m.month === form.month)
          if (existing) {
            setOverwriteTarget(existing)
            return
          }
        }
        toast.error(t('salaries.saveError'))
        return
      }
      const saved = (await res.json()) as SalaryMonthDto
      const monthId = targetId ?? saved.id

      if (isOverwrite) {
        const prev = months.find((m) => m.id === replaceExistingId)
        if (prev) await clearMonthPrimes(prev)
      }

      if (!editingId) {
        await addPendingPrimes(monthId)
      }

      toast.success(t('salaries.saveOk'))
      setUploadedPayslipName(null)
      clearPayslipPending()
      setDialogOpen(false)
      setOverwriteTarget(null)
      void load()
    } catch {
      toast.error(t('salaries.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const saveMonth = async () => {
    if (!editingId) {
      const existing = months.find((m) => m.year === form.year && m.month === form.month)
      if (existing) {
        setOverwriteTarget(existing)
        return
      }
    }
    await persistMonth(null)
  }

  const confirmOverwriteMonth = async () => {
    if (!overwriteTarget) return
    const id = overwriteTarget.id
    setOverwriteTarget(null)
    await persistMonth(id)
  }

  const onPayslipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setExtracting(true)
    try {
      const fd = new FormData()
      fd.set('file', file)
      const res = await fetch('/api/salaires/payslip/extract', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(t(payslipExtractErrorKey(j.error)))
        return
      }
      const { extraction } = (await res.json()) as { extraction: PayslipExtractionPayload }
      setForm((f) => ({
        ...f,
        year: extraction.year ?? f.year,
        month: extraction.month ?? f.month,
        brut: String(extraction.brut ?? ''),
        netImposable: String(extraction.netImposable ?? ''),
        netPaye: String(extraction.netPaye ?? ''),
        prelevementSource: String(extraction.prelevementSource ?? ''),
        ticketRestaurant: String(extraction.ticketRestaurant ?? ''),
        explanation: extraction.explanation ?? '',
      }))
      setPendingPrimesIncluses(
        extraction.primesIndemnitesIncluses != null ? String(extraction.primesIndemnitesIncluses) : null,
      )
      setPendingBonuses(
        (extraction.bonuses ?? []).map((b) => ({
          category: b.category,
          description: b.description ?? '',
          amount: String(b.amount),
          basis: b.basis ?? 'BRUT',
          flow: b.flow ?? 'VARIABLE',
        })),
      )
      setPendingNonIncludedPrimes(
        (extraction.nonIncludedPrimes ?? []).map((p) => ({
          category: p.category,
          description: p.description ?? '',
          amount: String(p.amount),
        })),
      )
      setUploadedPayslipName(file.name)
      toast.success(t('salaries.extractOk'))
    } finally {
      setExtracting(false)
    }
  }

  const savePrimesIncluses = async () => {
    if (!primesDialogMonthId) return
    const res = await fetch(`/api/salaires/months/${primesDialogMonthId}`, {
      ...fetchOpts,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ primesIndemnitesIncluses: primesIncluses }),
    })
    if (!res.ok) {
      toast.error(t('salaries.saveError'))
      return
    }
    toast.success(t('salaries.primesSaveOk'))
    await load()
  }

  const deleteMonth = async (id: string) => {
    if (!confirm(t('salaries.confirmDelete'))) return
    const res = await fetch(`/api/salaires/months/${id}`, { method: 'DELETE', ...fetchOpts })
    if (!res.ok) toast.error(t('salaries.deleteError'))
    else {
      toast.success(t('salaries.deleteOk'))
      void load()
    }
  }

  const addBonus = async () => {
    if (!primesDialogMonthId) return
    if (!bonusDraft.category.trim() || !bonusDraft.amount) {
      toast.error(t('salaries.bonusIncomplete'))
      return
    }
    const res = await fetch(`/api/salaires/months/${primesDialogMonthId}/bonuses`, {
      ...fetchOpts,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: bonusDraft.category,
        description: bonusDraft.description,
        amount: bonusDraft.amount,
        basis: bonusDraft.basis,
        flow: bonusDraft.flow,
      }),
    })
    if (!res.ok) toast.error(t('salaries.bonusError'))
    else {
      toast.success(t('salaries.bonusOk'))
      setBonusDraft({ category: '', description: '', amount: '', basis: 'BRUT', flow: 'VARIABLE' })
      await load()
    }
  }

  const removeBonus = async (bonusId: string) => {
    if (!primesDialogMonthId) return
    const res = await fetch(`/api/salaires/months/${primesDialogMonthId}/bonuses/${bonusId}`, {
      method: 'DELETE',
      ...fetchOpts,
    })
    if (!res.ok) toast.error(t('salaries.bonusDeleteError'))
    else {
      toast.success(t('salaries.bonusDeleteOk'))
      await load()
    }
  }

  const addNonIncludedPrime = async () => {
    if (!nonInclusesDialogMonthId) return
    if (!nonIncludedDraft.category.trim() || !nonIncludedDraft.amount) {
      toast.error(t('salaries.nonIncludedPrimeIncomplete'))
      return
    }
    const res = await fetch(`/api/salaires/months/${nonInclusesDialogMonthId}/non-included-primes`, {
      ...fetchOpts,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: nonIncludedDraft.category,
        description: nonIncludedDraft.description,
        amount: nonIncludedDraft.amount,
      }),
    })
    if (!res.ok) toast.error(t('salaries.nonIncludedPrimeError'))
    else {
      toast.success(t('salaries.nonIncludedPrimeOk'))
      setNonIncludedDraft({ category: '', description: '', amount: '' })
      await load()
    }
  }

  const removeNonIncludedPrime = async (lineId: string) => {
    if (!nonInclusesDialogMonthId) return
    const res = await fetch(
      `/api/salaires/months/${nonInclusesDialogMonthId}/non-included-primes/${lineId}`,
      { method: 'DELETE', ...fetchOpts },
    )
    if (!res.ok) toast.error(t('salaries.nonIncludedPrimeDeleteError'))
    else {
      toast.success(t('salaries.nonIncludedPrimeDeleteOk'))
      await load()
    }
  }

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.set('file', file)
    const res = await fetch('/api/salaires/import', { method: 'POST', body: fd, credentials: 'include' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.details?.join?.(', ') ?? t('salaries.importError'))
      return
    }
    const j = await res.json()
    toast.success(t('salaries.importOk', { count: j.imported ?? 0 }))
    void load()
  }

  const editingRow = editingId ? months.find((m) => m.id === editingId) : null
  const employerAutoLabel =
    editingRow?.employerId != null
      ? employers.find((e) => e.id === editingRow.employerId)?.name ?? '—'
      : t('salaries.employerAssignedOnSave')

  const bulletinFields = [
    ['brut', t('salaries.colBrut')],
    ['netImposable', t('salaries.colNetImposable')],
    ['netPaye', t('salaries.colNetPaye')],
    ['prelevementSource', t('salaries.colPrelevement')],
    ['ticketRestaurant', t('salaries.colTicket')],
  ] as const

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('salaries.saisieTitle')}</CardTitle>
            <CardDescription>{t('salaries.saisieLead')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/salaires/template">
                <Download className="h-4 w-4" />
                {t('salaries.downloadTemplate')}
              </a>
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(ev) => void onImport(ev)} />
                <Upload className="h-4 w-4" />
                {t('salaries.importExcel')}
              </label>
            </Button>
            <Button type="button" size="sm" onClick={openNew}>
              <Plus className="h-4 w-4" />
              {t('salaries.addMonth')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.colYear')}</TableHead>
                  <TableHead>{t('salaries.colMonth')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colBrut')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colNetPaye')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colSumPrimes')}</TableHead>
                  <TableHead className="w-[168px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => {
                  const primesCount = primesInclusesItemCount(row)
                  const nonInclusesCount = nonInclusesItemCount(row)
                  return (
                  <TableRow key={row.id}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{formatMonthLongName(row.month, i18n.language)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(brutHorsPrimesIncluses(row), i18n.language)}
                    </TableCell>
                    <TableCell className="text-right">{row.netPaye}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatAmount(sumTotalPrimes(row), i18n.language)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative"
                        title={t('salaries.managePrimes')}
                        onClick={() => openPrimesDialog(row)}
                      >
                        <Coins className="h-4 w-4" />
                        {primesCount > 0 ? (
                          <span
                            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
                            aria-hidden
                          >
                            {primesCount > 99 ? '99+' : primesCount}
                          </span>
                        ) : null}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="relative"
                        title={t('salaries.managePrimesNonIncluses')}
                        onClick={() => openNonInclusesDialog(row)}
                      >
                        <Receipt className="h-4 w-4" />
                        {nonInclusesCount > 0 ? (
                          <span
                            className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-semibold leading-none text-primary-foreground"
                            aria-hidden
                          >
                            {nonInclusesCount > 99 ? '99+' : nonInclusesCount}
                          </span>
                        ) : null}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void deleteMonth(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[min(92vh,100dvh-2rem)] max-w-[min(52rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>{editingId ? t('salaries.editMonth') : t('salaries.newMonth')}</DialogTitle>
          </DialogHeader>
          <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-5 px-6 py-5">
              {payslipExtractionEnabled && !editingId ? (
                <div
                  className={
                    uploadedPayslipName
                      ? 'rounded-lg border border-border bg-muted/20 px-4 py-3'
                      : 'rounded-lg border border-dashed border-border bg-muted/30 px-4 py-4'
                  }
                >
                  <input
                    ref={payslipInputRef}
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={extracting || uploadedPayslipName != null}
                    onChange={(ev) => void onPayslipFile(ev)}
                  />
                  {uploadedPayslipName ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={uploadedPayslipName}>
                          {uploadedPayslipName}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          disabled={extracting}
                          aria-label={t('salaries.removePayslip')}
                          onClick={clearPayslipExtraction}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {pendingPrimePreview.length > 0 ? (
                        <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
                          <span className="font-medium text-foreground/80">{t('salaries.extractPendingName')}</span>
                          <span className="text-right font-medium text-foreground/80">
                            {t('salaries.extractPendingValue')}
                          </span>
                          {pendingPrimePreview.map((line, idx) => (
                            <div key={`${line.name}-${idx}`} className="contents">
                              <span className="text-muted-foreground">{line.name}</span>
                              <span className="text-right tabular-nums text-muted-foreground">
                                {formatAmount(parsePrimeAmount(line.amount), i18n.language)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        disabled={extracting}
                        onClick={() => payslipInputRef.current?.click()}
                      >
                        {extracting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileUp className="h-4 w-4" />
                        )}
                        {extracting ? t('salaries.extracting') : t('salaries.fromPayslip')}
                      </Button>
                      <p className="mt-2 text-xs text-muted-foreground">{t('salaries.fromPayslipAiHint')}</p>
                    </>
                  )}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t('salaries.colYear')}</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value, 10) || f.year }))}
                  />
                </div>
                <div>
                  <Label>{t('salaries.colMonth')}</Label>
                  <Select
                    value={String(form.month)}
                    onValueChange={(v) => {
                      const m = parseInt(v, 10)
                      setForm((f) => ({ ...f, month: m >= 1 && m <= 12 ? m : f.month }))
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTH_NUMBERS.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {formatMonthLongName(m, i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>{t('salaries.employer')}</Label>
                <p className="mt-1.5 rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm">{employerAutoLabel}</p>
                <p className="mt-1.5 text-xs text-muted-foreground">{t('salaries.employerFromPeriodsHelp')}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {bulletinFields.map(([key, label]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="mt-1.5"
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div>
                <Label>{t('salaries.colExplanation')}</Label>
                <Input
                  className="mt-1.5"
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="relative z-10 shrink-0 border-t border-border bg-background px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void saveMonth()}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={overwriteTarget != null}
        onOpenChange={(open) => {
          if (!open) setOverwriteTarget(null)
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salaries.overwriteMonthTitle')}</DialogTitle>
            <DialogDescription>
              {overwriteTarget
                ? t('salaries.overwriteMonthMessage', {
                    period: periodLabel(overwriteTarget.year, overwriteTarget.month, i18n.language),
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOverwriteTarget(null)}>
              {t('salaries.overwriteMonthCancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => void confirmOverwriteMonth()}>
              {t('salaries.overwriteMonthConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={primesDialogMonthId != null}
        onOpenChange={(open) => {
          if (!open) setPrimesDialogMonthId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[min(40rem,calc(100%-2rem))] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {primesDialogRow
                ? t('salaries.primesDialogTitle', {
                    period: periodLabel(primesDialogRow.year, primesDialogRow.month, i18n.language),
                  })
                : t('salaries.managePrimes')}
            </DialogTitle>
            <DialogDescription>{t('salaries.primesDialogLead')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[min(60vh,28rem)] pr-3">
            <div className="grid gap-5 py-1">
              <div>
                <Label>{t('salaries.colPrimesIncluses')}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  className="mt-1.5"
                  value={primesIncluses}
                  onChange={(e) => setPrimesIncluses(e.target.value)}
                />
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">{t('salaries.bonusesTitle')}</p>
                <ul className="space-y-2 text-sm">
                  {primesDialogBonuses.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <span>
                        {b.category} — {b.amount} ({b.basis}/{b.flow})
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void removeBonus(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {primesDialogBonuses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
                  ) : null}
                </ul>
                <div className="grid gap-2">
                  <Input
                    placeholder={t('salaries.bonusCategory')}
                    value={bonusDraft.category}
                    onChange={(e) => setBonusDraft((d) => ({ ...d, category: e.target.value }))}
                  />
                  <Input
                    placeholder={t('salaries.bonusDescription')}
                    value={bonusDraft.description}
                    onChange={(e) => setBonusDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                  <Input
                    placeholder={t('salaries.bonusAmount')}
                    value={bonusDraft.amount}
                    onChange={(e) => setBonusDraft((d) => ({ ...d, amount: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={bonusDraft.basis}
                      onValueChange={(v) => setBonusDraft((d) => ({ ...d, basis: v as BonusBasis }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRUT">{t('salaries.basisBrut')}</SelectItem>
                        <SelectItem value="NET">{t('salaries.basisNet')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={bonusDraft.flow}
                      onValueChange={(v) => setBonusDraft((d) => ({ ...d, flow: v as BonusFlow }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXE">{t('salaries.flowFixe')}</SelectItem>
                        <SelectItem value="VARIABLE">{t('salaries.flowVariable')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void addBonus()}>
                    {t('salaries.bonusAdd')}
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPrimesDialogMonthId(null)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" onClick={() => void savePrimesIncluses()}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={nonInclusesDialogMonthId != null}
        onOpenChange={(open) => {
          if (!open) setNonInclusesDialogMonthId(null)
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[min(40rem,calc(100%-2rem))] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {nonInclusesDialogRow
                ? t('salaries.primesNonInclusesDialogTitle', {
                    period: periodLabel(nonInclusesDialogRow.year, nonInclusesDialogRow.month, i18n.language),
                  })
                : t('salaries.managePrimesNonIncluses')}
            </DialogTitle>
            <DialogDescription>{t('salaries.primesNonInclusesDialogLead')}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[min(60vh,28rem)] pr-3">
            <div className="grid gap-5 py-1">
              <div className="space-y-3">
                <p className="text-sm font-medium">{t('salaries.nonIncludedPrimesTitle')}</p>
                <ul className="space-y-2 text-sm">
                  {nonInclusesDialogLines.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <span>
                        {p.category} — {p.amount}
                        {p.description ? ` (${p.description})` : ''}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => void removeNonIncludedPrime(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {nonInclusesDialogLines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
                  ) : null}
                </ul>
                <div className="grid gap-2">
                  <Input
                    placeholder={t('salaries.bonusCategory')}
                    value={nonIncludedDraft.category}
                    onChange={(e) => setNonIncludedDraft((d) => ({ ...d, category: e.target.value }))}
                  />
                  <Input
                    placeholder={t('salaries.bonusDescription')}
                    value={nonIncludedDraft.description}
                    onChange={(e) => setNonIncludedDraft((d) => ({ ...d, description: e.target.value }))}
                  />
                  <Input
                    placeholder={t('salaries.bonusAmount')}
                    value={nonIncludedDraft.amount}
                    onChange={(e) => setNonIncludedDraft((d) => ({ ...d, amount: e.target.value }))}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={() => void addNonIncludedPrime()}>
                    {t('salaries.nonIncludedPrimeAdd')}
                  </Button>
                </div>
              </div>
              {nonInclusesDialogRow ? (
                <p className="text-sm text-muted-foreground">
                  {t('salaries.colSumNonIncluses')} :{' '}
                  <span className="font-mono font-medium text-foreground">
                    {formatAmount(sumNonIncluses(nonInclusesDialogRow), i18n.language)}
                  </span>
                </p>
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNonInclusesDialogMonthId(null)}>
              {t('salaries.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
