'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { formatYearMonthLabel } from '@/lib/salary-month-label'

type Period = { id: string; startDate: string; endDate: string | null; notes: string | null }
type Employer = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  employmentPeriods: Period[]
}

type EmployerStat = {
  employerId: string
  name: string
  monthCount: number
  averageNetPaye: number
  byYear: { year: number; averageNetPaye: number; totalNetPaye: number }[]
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function SalaryEmployersClient() {
  const { t, i18n } = useTranslation()
  const [employers, setEmployers] = useState<Employer[]>([])
  const [stats, setStats] = useState<EmployerStat[]>([])
  const [loading, setLoading] = useState(true)
  const [nameOpen, setNameOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [periodDialog, setPeriodDialog] = useState<{ employerId: string; periodId?: string } | null>(null)
  const [periodForm, setPeriodForm] = useState({ startMonth: '', endMonth: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [eRes, sRes] = await Promise.all([
        fetch('/api/salaires/employers'),
        fetch('/api/salaires/employer-stats'),
      ])
      if (!eRes.ok || !sRes.ok) throw new Error()
      setEmployers(await eRes.json())
      setStats(await sRes.json())
    } catch {
      toast.error(t('salaries.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const createEmployer = async () => {
    if (!newName.trim()) return
    const res = await fetch('/api/salaires/employers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    if (!res.ok) toast.error(t('salaries.employerSaveError'))
    else {
      toast.success(t('salaries.employerSaveOk'))
      setNameOpen(false)
      setNewName('')
      void load()
    }
  }

  const deleteEmployer = async (id: string) => {
    if (!confirm(t('salaries.confirmDeleteEmployer'))) return
    const res = await fetch(`/api/salaires/employers/${id}`, { method: 'DELETE' })
    if (!res.ok) toast.error(t('salaries.employerDeleteError'))
    else {
      toast.success(t('salaries.employerDeleteOk'))
      void load()
    }
  }

  const openPeriod = (employerId: string, p?: Period) => {
    const toYm = (s: string) => (s.length >= 7 ? s.slice(0, 7) : s)
    if (p) {
      setPeriodDialog({ employerId, periodId: p.id })
      setPeriodForm({
        startMonth: toYm(p.startDate),
        endMonth: p.endDate ? toYm(p.endDate) : '',
        notes: p.notes ?? '',
      })
    } else {
      setPeriodDialog({ employerId })
      setPeriodForm({ startMonth: '', endMonth: '', notes: '' })
    }
  }

  const savePeriod = async () => {
    if (!periodDialog) return
    if (!periodForm.startMonth) {
      toast.error(t('salaries.periodStartRequired'))
      return
    }
    if (periodForm.endMonth && periodForm.endMonth < periodForm.startMonth) {
      toast.error(t('salaries.periodEndBeforeStart'))
      return
    }
    const { employerId, periodId } = periodDialog
    const body = {
      startDate: periodForm.startMonth,
      endDate: periodForm.endMonth || null,
      notes: periodForm.notes || null,
    }
    const url = periodId
      ? `/api/salaires/employers/${employerId}/periods/${periodId}`
      : `/api/salaires/employers/${employerId}/periods`
    const method = periodId ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) toast.error(t('salaries.periodSaveError'))
    else {
      toast.success(t('salaries.periodSaveOk'))
      setPeriodDialog(null)
      void load()
    }
  }

  const deletePeriod = async (employerId: string, periodId: string) => {
    if (!confirm(t('salaries.confirmDeletePeriod'))) return
    const res = await fetch(`/api/salaires/employers/${employerId}/periods/${periodId}`, { method: 'DELETE' })
    if (!res.ok) toast.error(t('salaries.periodDeleteError'))
    else {
      toast.success(t('salaries.periodDeleteOk'))
      void load()
    }
  }

  const statFor = (id: string) => stats.find((s) => s.employerId === id)

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('salaries.employersTitle')}</CardTitle>
            <CardDescription>{t('salaries.employersLead')}</CardDescription>
          </div>
          <Button type="button" size="sm" onClick={() => setNameOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('salaries.addEmployer')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
          ) : (
            employers.map((e) => {
              const st = statFor(e.id)
              return (
                <div key={e.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold">{e.name}</h3>
                    <div className="flex gap-1">
                      <Button type="button" variant="outline" size="sm" onClick={() => openPeriod(e.id)}>
                        <Plus className="mr-1 h-4 w-4" />
                        {t('salaries.addPeriod')}
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void deleteEmployer(e.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {st ? (
                    <p className="mb-3 text-sm text-muted-foreground">
                      {t('salaries.employerAvgNet', { count: st.monthCount, avg: fmt(st.averageNetPaye) })}
                    </p>
                  ) : null}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('salaries.periodStart')}</TableHead>
                        <TableHead>{t('salaries.periodEnd')}</TableHead>
                        <TableHead>{t('salaries.periodNotes')}</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {e.employmentPeriods.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{formatYearMonthLabel(p.startDate, i18n.language)}</TableCell>
                          <TableCell>
                            {p.endDate ? formatYearMonthLabel(p.endDate, i18n.language) : t('salaries.periodEndOngoing')}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{p.notes ?? '—'}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => openPeriod(e.id, p)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => void deletePeriod(e.id, p.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {st && st.byYear.length > 0 ? (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium">{t('salaries.employerByYear')}</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('salaries.colYear')}</TableHead>
                            <TableHead className="text-right">{t('salaries.employerYearAvg')}</TableHead>
                            <TableHead className="text-right">{t('salaries.employerYearTotal')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {st.byYear.map((y) => (
                            <TableRow key={y.year}>
                              <TableCell>{y.year}</TableCell>
                              <TableCell className="text-right">{fmt(y.averageNetPaye)}</TableCell>
                              <TableCell className="text-right">{fmt(y.totalNetPaye)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('salaries.newEmployer')}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>{t('salaries.employerName')}</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNameOpen(false)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" onClick={() => void createEmployer()}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!periodDialog} onOpenChange={(o) => !o && setPeriodDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{periodDialog?.periodId ? t('salaries.editPeriod') : t('salaries.newPeriod')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="salary-period-start-month">{t('salaries.periodStart')}</Label>
              <Input
                id="salary-period-start-month"
                type="month"
                value={periodForm.startMonth}
                onChange={(e) => setPeriodForm((f) => ({ ...f, startMonth: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="salary-period-end-month">{t('salaries.periodEnd')}</Label>
              <Input
                id="salary-period-end-month"
                type="month"
                value={periodForm.endMonth}
                min={periodForm.startMonth || undefined}
                onChange={(e) => setPeriodForm((f) => ({ ...f, endMonth: e.target.value }))}
              />
              <div className="mt-2 flex items-start gap-2">
                <Checkbox
                  id="salary-period-ongoing"
                  checked={!periodForm.endMonth}
                  onCheckedChange={(c) => {
                    if (c === true) setPeriodForm((f) => ({ ...f, endMonth: '' }))
                  }}
                />
                <label htmlFor="salary-period-ongoing" className="cursor-pointer text-sm">
                  {t('salaries.periodOngoingToggle')}
                </label>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{t('salaries.periodEndHint')}</p>
            </div>
            <div>
              <Label>{t('salaries.periodNotes')}</Label>
              <Input value={periodForm.notes} onChange={(e) => setPeriodForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPeriodDialog(null)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" onClick={() => void savePeriod()}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
