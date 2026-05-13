'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
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
}

type EmployerDto = { id: string; name: string }

const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const emptyForm = {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  brut: '',
  netImposable: '',
  netPaye: '',
  prelevementSource: '',
  ticketRestaurant: '',
  primesIndemnitesIncluses: '0',
  primesIndemnitesNonIncluses: '0',
  explanation: '',
}

export function SalarySaisieClient() {
  const { t, i18n } = useTranslation()
  const [months, setMonths] = useState<SalaryMonthDto[]>([])
  const [employers, setEmployers] = useState<EmployerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [bonusDraft, setBonusDraft] = useState({
    category: '',
    description: '',
    amount: '',
    basis: 'BRUT' as BonusBasis,
    flow: 'VARIABLE' as BonusFlow,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, eRes] = await Promise.all([fetch('/api/salaires/months'), fetch('/api/salaires/employers')])
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

  const openNew = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setDialogOpen(true)
  }

  const openEdit = (row: SalaryMonthDto) => {
    setEditingId(row.id)
    setForm({
      year: row.year,
      month: row.month,
      brut: row.brut,
      netImposable: row.netImposable,
      netPaye: row.netPaye,
      prelevementSource: row.prelevementSource,
      ticketRestaurant: row.ticketRestaurant,
      primesIndemnitesIncluses: row.primesIndemnitesIncluses,
      primesIndemnitesNonIncluses: row.primesIndemnitesNonIncluses,
      explanation: row.explanation ?? '',
    })
    setDialogOpen(true)
  }

  const saveMonth = async () => {
    const body = {
      year: form.year,
      month: form.month,
      brut: form.brut,
      netImposable: form.netImposable,
      netPaye: form.netPaye,
      prelevementSource: form.prelevementSource,
      ticketRestaurant: form.ticketRestaurant,
      primesIndemnitesIncluses: form.primesIndemnitesIncluses,
      primesIndemnitesNonIncluses: form.primesIndemnitesNonIncluses,
      explanation: form.explanation || null,
    }
    const url = editingId ? `/api/salaires/months/${editingId}` : '/api/salaires/months'
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      toast.error(t('salaries.saveError'))
      return
    }
    toast.success(t('salaries.saveOk'))
    setDialogOpen(false)
    void load()
  }

  const deleteMonth = async (id: string) => {
    if (!confirm(t('salaries.confirmDelete'))) return
    const res = await fetch(`/api/salaires/months/${id}`, { method: 'DELETE' })
    if (!res.ok) toast.error(t('salaries.deleteError'))
    else {
      toast.success(t('salaries.deleteOk'))
      void load()
    }
  }

  const addBonus = async () => {
    if (!editingId) {
      toast.message(t('salaries.saveMonthBeforeBonus'))
      return
    }
    if (!bonusDraft.category.trim() || !bonusDraft.amount) {
      toast.error(t('salaries.bonusIncomplete'))
      return
    }
    const res = await fetch(`/api/salaires/months/${editingId}/bonuses`, {
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
      await res.json()
      toast.success(t('salaries.bonusOk'))
      setBonusDraft({ category: '', description: '', amount: '', basis: 'BRUT', flow: 'VARIABLE' })
      await load()
    }
  }

  const removeBonus = async (bonusId: string) => {
    if (!editingId) return
    const res = await fetch(`/api/salaires/months/${editingId}/bonuses/${bonusId}`, { method: 'DELETE' })
    if (!res.ok) toast.error(t('salaries.bonusDeleteError'))
    else {
      toast.success(t('salaries.bonusDeleteOk'))
      await load()
    }
  }

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const fd = new FormData()
    fd.set('file', file)
    const res = await fetch('/api/salaires/import', { method: 'POST', body: fd })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      toast.error(j.details?.join?.(', ') ?? t('salaries.importError'))
      return
    }
    const j = await res.json()
    toast.success(t('salaries.importOk', { count: j.imported ?? 0 }))
    void load()
  }

  const editingBonuses = editingId ? months.find((m) => m.id === editingId)?.bonuses ?? [] : []
  const editingRow = editingId ? months.find((m) => m.id === editingId) : null
  const employerAutoLabel =
    editingRow?.employerId != null
      ? employers.find((e) => e.id === editingRow.employerId)?.name ?? '—'
      : t('salaries.employerAssignedOnSave')

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('salaries.saisieTitle')}</CardTitle>
            <CardDescription>{t('salaries.saisieLead')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href="/api/salaires/template">
                <Download className="mr-2 h-4 w-4" />
                {t('salaries.downloadTemplate')}
              </a>
            </Button>
            <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
              <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(ev) => void onImport(ev)} />
              <Upload className="h-4 w-4" />
              {t('salaries.importExcel')}
            </label>
            <Button type="button" size="sm" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
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
                  <TableHead>{t('salaries.employer')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colBrut')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colNetPaye')}</TableHead>
                  <TableHead className="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.year}</TableCell>
                    <TableCell>{formatMonthLongName(row.month, i18n.language)}</TableCell>
                    <TableCell>
                      {row.employerId ? employers.find((e) => e.id === row.employerId)?.name ?? '—' : '—'}
                    </TableCell>
                    <TableCell className="text-right">{row.brut}</TableCell>
                    <TableCell className="text-right">{row.netPaye}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void deleteMonth(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? t('salaries.editMonth') : t('salaries.newMonth')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-3">
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>{t('salaries.colYear')}</Label>
                  <Input
                    type="number"
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
                    <SelectTrigger>
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
                <p className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{employerAutoLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('salaries.employerFromPeriodsHelp')}</p>
              </div>
              {(
                [
                  ['brut', t('salaries.colBrut')],
                  ['netImposable', t('salaries.colNetImposable')],
                  ['netPaye', t('salaries.colNetPaye')],
                  ['prelevementSource', t('salaries.colPrelevement')],
                  ['ticketRestaurant', t('salaries.colTicket')],
                  ['primesIndemnitesIncluses', t('salaries.colPrimesIncluses')],
                  ['primesIndemnitesNonIncluses', t('salaries.colPrimesNonIncluses')],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={form[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <Label>{t('salaries.colExplanation')}</Label>
                <Input
                  value={form.explanation}
                  onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))}
                />
              </div>

              {editingId ? (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-sm font-medium">{t('salaries.bonusesTitle')}</p>
                  <ul className="space-y-1 text-sm">
                    {editingBonuses.map((b) => (
                      <li key={b.id} className="flex items-center justify-between gap-2">
                        <span>
                          {b.category} — {b.amount} ({b.basis}/{b.flow})
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void removeBonus(b.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
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
              ) : null}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" onClick={() => void saveMonth()}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
