'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Eye, FileUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { formatMonthLongName } from '@/lib/salary-month-label'
import { checkPayslipConsistency, type PayslipWarning } from '@/lib/payslip-consistency'
import type { PayslipDraft, PayslipDto } from '@/lib/payslip-types'
import { PayslipEditor } from '@/components/salaires/payslip-editor'
import { PayslipView } from '@/components/salaires/payslip-view'
import {
  cotisationsSalariales,
  draftFromDto,
  draftToBody,
  emptyDraft,
  fetchOpts,
  formatAmount,
  parseAmount,
  partageValeurBrut,
  payslipExtractErrorKey,
  variableBrut,
} from '@/components/salaires/payslip-format'

type EmployerDto = { id: string; name: string }

type QueueStatus = 'extracting' | 'ready' | 'saved' | 'duplicate' | 'error' | 'waiting'

type QueueItem = {
  id: string
  fileName: string
  status: QueueStatus
  draft?: PayslipDraft
  warnings?: PayslipWarning[]
  error?: string
}

type EditorState = { draft: PayslipDraft; editingId: string | null; queueId: string | null }

type SaveResult = 'ok' | 'duplicate' | 'invalid' | 'error'

export type SalarySaisieClientProps = {
  payslipExtractionEnabled?: boolean
}

function periodLabel(year: number, month: number, language: string): string {
  return `${formatMonthLongName(month, language)} ${year}`
}

export function SalarySaisieClient({ payslipExtractionEnabled = false }: SalarySaisieClientProps) {
  const { t, i18n } = useTranslation()
  const lng = i18n.language
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [payslips, setPayslips] = useState<PayslipDto[]>([])
  const [employers, setEmployers] = useState<EmployerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [viewing, setViewing] = useState<PayslipDto | null>(null)
  const [overwrite, setOverwrite] = useState<EditorState | null>(null)
  const [saving, setSaving] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])

  const load = useCallback(async () => {
    try {
      const [pRes, eRes] = await Promise.all([
        fetch('/api/salaires/payslips', fetchOpts),
        fetch('/api/salaires/employers', fetchOpts),
      ])
      if (!pRes.ok || !eRes.ok) throw new Error('load')
      setPayslips(await pRes.json())
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

  const years = useMemo(() => [...new Set(payslips.map((p) => p.year))].sort((a, b) => b - a), [payslips])

  const rows = useMemo(
    () =>
      payslips
        .filter((p) => yearFilter === 'all' || p.year === Number(yearFilter))
        .sort((a, b) => b.year - a.year || b.month - a.month || a.kind.localeCompare(b.kind)),
    [payslips, yearFilter],
  )

  const employerName = (id: string | null) => (id ? (employers.find((e) => e.id === id)?.name ?? '—') : '—')

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue((q) => q.map((item) => (item.id === id ? { ...item, ...patch } : item)))

  /** Enregistre un brouillon. Ne gère pas l'UI : renvoie `duplicate` si le mois a déjà un bulletin. */
  const persist = async (state: EditorState, forceOverwrite: boolean): Promise<SaveResult> => {
    const url = state.editingId
      ? `/api/salaires/payslips/${state.editingId}`
      : `/api/salaires/payslips${forceOverwrite ? '?overwrite=1' : ''}`
    const res = await fetch(url, {
      method: state.editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftToBody(state.draft)),
      ...fetchOpts,
    })
    if (res.status === 409) return 'duplicate'
    if (res.status === 400) return 'invalid'
    if (!res.ok) return 'error'
    if (state.queueId) updateQueueItem(state.queueId, { status: 'saved' })
    return 'ok'
  }

  const saveEditor = async (state: EditorState, forceOverwrite = false) => {
    setSaving(true)
    try {
      const result = await persist(state, forceOverwrite)
      if (result === 'duplicate') {
        if (state.editingId) toast.error(t('salaries.duplicateMonth'))
        else setOverwrite(state)
        return
      }
      if (result === 'invalid' || result === 'error') {
        toast.error(t(result === 'invalid' ? 'salaries.invalidPayslip' : 'salaries.saveError'))
        return
      }
      toast.success(t('salaries.saveOk'))
      setEditor(null)
      setOverwrite(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  const deletePayslip = async (p: PayslipDto) => {
    if (!confirm(t('salaries.confirmDelete'))) return
    const res = await fetch(`/api/salaires/payslips/${p.id}`, { method: 'DELETE', ...fetchOpts })
    if (!res.ok) {
      toast.error(t('salaries.deleteError'))
      return
    }
    toast.success(t('salaries.deleteOk'))
    await load()
  }

  /** Extrait les fichiers un par un (l'API Mistral est appelée séquentiellement). */
  const onFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    if (files.length === 0) return
    const items: QueueItem[] = files.map((f) => ({ id: crypto.randomUUID(), fileName: f.name, status: 'waiting' }))
    setQueue((q) => [...q, ...items])

    for (const [i, file] of files.entries()) {
      const id = items[i].id
      updateQueueItem(id, { status: 'extracting' })
      try {
        const fd = new FormData()
        fd.set('file', file)
        const res = await fetch('/api/salaires/payslip/extract', { method: 'POST', body: fd, ...fetchOpts })
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string }
          updateQueueItem(id, { status: 'error', error: t(payslipExtractErrorKey(j.error)) })
          continue
        }
        const { extraction, warnings } = (await res.json()) as {
          extraction: PayslipDraft
          warnings: PayslipWarning[]
        }
        updateQueueItem(id, { status: 'ready', draft: extraction, warnings })
      } catch {
        updateQueueItem(id, { status: 'error', error: t('salaries.extractError') })
      }
    }
  }

  /** Enregistre d'un coup les extractions prêtes et sans alerte de cohérence. */
  const saveAllReady = async () => {
    const ready = queue.filter((q) => q.status === 'ready' && q.draft && (q.warnings?.length ?? 0) === 0)
    setSaving(true)
    let saved = 0
    try {
      for (const item of ready) {
        const result = await persist({ draft: item.draft!, editingId: null, queueId: item.id }, false)
        if (result === 'ok') saved++
        else if (result === 'duplicate') updateQueueItem(item.id, { status: 'duplicate' })
        else {
          const error = t(result === 'invalid' ? 'salaries.invalidPayslip' : 'salaries.saveError')
          updateQueueItem(item.id, { status: 'error', error })
        }
      }
    } finally {
      setSaving(false)
    }
    toast.success(t('salaries.savedCount', { count: saved }))
    await load()
  }

  const queueReadyClean = queue.filter((q) => q.status === 'ready' && (q.warnings?.length ?? 0) === 0).length
  const extracting = queue.some((q) => q.status === 'extracting' || q.status === 'waiting')

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('salaries.saisieTitle')}</CardTitle>
            <CardDescription>{t('salaries.saisieLead')}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {payslipExtractionEnabled ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(ev) => void onFiles(ev)}
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {t('salaries.fromPayslips')}
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              size="sm"
              onClick={() => setEditor({ draft: emptyDraft(), editingId: null, queueId: null })}
            >
              <Plus className="h-4 w-4" />
              {t('salaries.addPayslip')}
            </Button>
          </div>
        </CardHeader>

        {queue.length > 0 ? (
          <CardContent className="border-t border-border pt-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{t('salaries.queueTitle')}</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || queueReadyClean === 0}
                  onClick={() => void saveAllReady()}
                >
                  {t('salaries.saveAllReady', { count: queueReadyClean })}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={extracting}
                  onClick={() => setQueue((q) => q.filter((i) => i.status !== 'saved'))}
                >
                  {t('salaries.clearSaved')}
                </Button>
              </div>
            </div>
            <ul className="divide-y divide-border rounded-md border border-border text-sm">
              {queue.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                  <QueueStatusIcon status={item.status} warnings={item.warnings?.length ?? 0} />
                  <span className="min-w-0 flex-1 truncate" title={item.fileName}>
                    {item.fileName}
                    {item.draft ? (
                      <span className="ml-2 text-muted-foreground">
                        {periodLabel(item.draft.year, item.draft.month, lng)}
                        {item.draft.kind === 'EPARGNE_SALARIALE' ? ` · ${t('salaries.kindEpargne')}` : ''}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.status === 'error'
                      ? item.error
                      : item.status === 'ready' && (item.warnings?.length ?? 0) > 0
                        ? t('salaries.queueWarnings', { count: item.warnings!.length })
                        : t(`salaries.queueStatus.${item.status}`)}
                  </span>
                  {item.draft && (item.status === 'ready' || item.status === 'duplicate') ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditor({ draft: item.draft!, editingId: null, queueId: item.id })}
                    >
                      {t('salaries.review')}
                    </Button>
                  ) : null}
                  {item.status !== 'extracting' && item.status !== 'waiting' ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={t('salaries.removeFromQueue')}
                      onClick={() => setQueue((q) => q.filter((i) => i.id !== item.id))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}

        <CardContent className={queue.length > 0 ? 'pt-2' : undefined}>
          <div className="mb-3 flex justify-end">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('salaries.allYears')}</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('salaries.period')}</TableHead>
                    <TableHead>{t('salaries.employer')}</TableHead>
                    <TableHead className="text-right">{t('salaries.totals.brut')}</TableHead>
                    <TableHead className="text-right">{t('salaries.colVariable')}</TableHead>
                    <TableHead className="text-right">{t('salaries.colPartageValeur')}</TableHead>
                    <TableHead className="text-right">{t('salaries.colCotisations')}</TableHead>
                    <TableHead className="text-right">{t('salaries.totals.prelevementSource')}</TableHead>
                    <TableHead className="text-right">{t('salaries.totals.netPaye')}</TableHead>
                    <TableHead className="w-[140px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((p) => {
                    const warnings = checkPayslipConsistency(p).length
                    return (
                      <TableRow key={p.id} className="cursor-pointer" onClick={() => setViewing(p)}>
                        <TableCell className="whitespace-nowrap">
                          {periodLabel(p.year, p.month, lng)}
                          {p.kind === 'EPARGNE_SALARIALE' ? (
                            <Badge variant="outline" className="ml-2">
                              {p.label || t('salaries.kindEpargne')}
                            </Badge>
                          ) : null}
                          {warnings > 0 ? (
                            <AlertTriangle
                              className="ml-2 inline h-4 w-4 text-amber-600"
                              aria-label={t('salaries.queueWarnings', { count: warnings })}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{employerName(p.employerId)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatAmount(parseAmount(p.brut), lng)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatAmount(variableBrut(p), lng)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatAmount(partageValeurBrut(p), lng)}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatAmount(cotisationsSalariales(p), lng)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAmount(parseAmount(p.prelevementSource), lng)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatAmount(parseAmount(p.netPaye), lng)}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button type="button" variant="ghost" size="icon" title={t('salaries.view')} onClick={() => setViewing(p)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title={t('salaries.edit')}
                            onClick={() => setEditor({ draft: draftFromDto(p), editingId: p.id, queueId: null })}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" title={t('salaries.delete')} onClick={() => void deletePayslip(p)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editor != null} onOpenChange={(open) => !open && setEditor(null)}>
        <DialogContent className="flex max-h-[min(92vh,100dvh-2rem)] max-w-[min(72rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>{editor?.editingId ? t('salaries.editPayslip') : t('salaries.newPayslip')}</DialogTitle>
            <DialogDescription>{t('salaries.editorLead')}</DialogDescription>
          </DialogHeader>
          <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {editor ? (
              <PayslipEditor
                draft={editor.draft}
                onChange={(draft) => setEditor((s) => (s ? { ...s, draft } : s))}
              />
            ) : null}
          </div>
          <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setEditor(null)}>
              {t('salaries.cancel')}
            </Button>
            <Button type="button" disabled={saving || !editor} onClick={() => editor && void saveEditor(editor)}>
              {t('salaries.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={viewing != null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="flex max-h-[min(92vh,100dvh-2rem)] max-w-[min(64rem,calc(100%-2rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
            <DialogTitle>
              {viewing
                ? `${periodLabel(viewing.year, viewing.month, lng)} · ${viewing.label || employerName(viewing.employerId)}`
                : null}
            </DialogTitle>
          </DialogHeader>
          <div className="h-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            {viewing ? <PayslipView payslip={viewing} /> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={overwrite != null} onOpenChange={(open) => !open && setOverwrite(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('salaries.overwriteMonthTitle')}</DialogTitle>
            <DialogDescription>
              {overwrite
                ? t('salaries.overwriteMonthMessage', {
                    period: periodLabel(overwrite.draft.year, overwrite.draft.month, lng),
                  })
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOverwrite(null)}>
              {t('salaries.overwriteMonthCancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={() => overwrite && void saveEditor(overwrite, true)}>
              {t('salaries.overwriteMonthConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function QueueStatusIcon({ status, warnings }: { status: QueueStatus; warnings: number }) {
  if (status === 'extracting' || status === 'waiting') {
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
  }
  if (status === 'saved') return <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-hidden />
  if (status === 'error') return <X className="h-4 w-4 shrink-0 text-destructive" aria-hidden />
  if (status === 'duplicate' || warnings > 0) {
    return <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
  }
  return <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
}
