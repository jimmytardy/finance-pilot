'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { useScheduleCompletion } from '@/hooks/use-schedule-completion'
import { Navigation } from '@/components/navigation'
import { BreakdownChart } from '@/components/dashboard/breakdown-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyAmount } from '@/lib/i18n/locale'
import {
  effectiveDayInMonth,
  isAutomaticDebitDueToday,
  isAutomaticDebitPastThisMonth,
  manualTransferDueStatus,
} from '@/lib/schedule-utils'
import type { AnnexBudget, FixedExpense } from '@/lib/types'

type LineKind = 'fixed' | 'annex'

type ScheduledLine = {
  kind: LineKind
  id: string
  label: string
  monthlyAmount: number
  category: string
  dayOfMonth: number
  paymentMode: 'manual' | 'automatic'
}

function toMonthly(e: { amount: number; frequency: 'monthly' | 'annual' }) {
  return e.frequency === 'annual' ? e.amount / 12 : e.amount
}

function collectScheduled(
  fixed: FixedExpense[],
  annex: AnnexBudget[],
): ScheduledLine[] {
  const out: ScheduledLine[] = []
  for (const e of fixed) {
    if (!e.schedule) continue
    const cat = e.schedule.category.trim() || ''
    out.push({
      kind: 'fixed',
      id: e.id,
      label: e.label,
      monthlyAmount: toMonthly(e),
      category: cat,
      dayOfMonth: e.schedule.dayOfMonth,
      paymentMode: e.schedule.paymentMode,
    })
  }
  for (const b of annex) {
    if (!b.schedule) continue
    const cat = b.schedule.category.trim() || ''
    out.push({
      kind: 'annex',
      id: b.id,
      label: b.label,
      monthlyAmount: toMonthly(b),
      category: cat,
      dayOfMonth: b.schedule.dayOfMonth,
      paymentMode: b.schedule.paymentMode,
    })
  }
  return out
}

function itemKey(kind: LineKind, id: string) {
  return `${kind}:${id}`
}

export default function AdvancedFinancePage() {
  const { t, i18n } = useTranslation()
  const { data, isLoaded } = useFinanceData()
  const { loaded: completionLoaded, getCurrentMonthKey, getDone, setDone, resetMonth } =
    useScheduleCompletion()

  const now = new Date()
  const monthKey = getCurrentMonthKey(now)

  const monthLabel = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number)
    const d = new Date(y, m - 1, 1)
    return d.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })
  }, [monthKey, i18n.language])

  const lines = useMemo(
    () => (isLoaded ? collectScheduled(data.fixedExpenses, data.annexBudgets) : []),
    [isLoaded, data.fixedExpenses, data.annexBudgets],
  )

  const pieData = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of lines) {
      const name = row.category || t('advancedFinance.uncategorized')
      map.set(name, (map.get(name) ?? 0) + row.monthlyAmount)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [lines, t])

  const manualLines = useMemo(() => lines.filter((l) => l.paymentMode === 'manual'), [lines])

  const upcomingAuto = lines
    .filter((l) => l.paymentMode === 'automatic' && !isAutomaticDebitPastThisMonth(l.dayOfMonth, now))
    .sort(
      (a, b) =>
        effectiveDayInMonth(now.getFullYear(), now.getMonth(), a.dayOfMonth) -
        effectiveDayInMonth(now.getFullYear(), now.getMonth(), b.dayOfMonth),
    )

  const pastAuto = lines.filter(
    (l) => l.paymentMode === 'automatic' && isAutomaticDebitPastThisMonth(l.dayOfMonth, now),
  )

  const formatCurrency = (n: number) => formatCurrencyAmount(n, i18n.language)

  const formatDueDate = (dayOfMonth: number) => {
    const y = now.getFullYear()
    const mi = now.getMonth()
    const day = effectiveDayInMonth(y, mi, dayOfMonth)
    return new Date(y, mi, day).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
    })
  }

  if (!isLoaded) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-full max-w-xl mb-8" />
            <Skeleton className="h-80 w-full" />
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-balance">{t('advancedFinance.title')}</h1>
              <p className="text-muted-foreground mt-1 max-w-3xl">{t('advancedFinance.subtitle')}</p>
              <p className="mt-2 text-sm font-medium text-primary capitalize">{t('advancedFinance.monthBadge', { month: monthLabel })}</p>
            </div>
            {completionLoaded && manualLines.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 self-start sm:self-auto"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.confirm(t('advancedFinance.resetMonthConfirm'))) {
                    resetMonth(monthKey)
                  }
                }}
              >
                {t('advancedFinance.resetMonth')}
              </Button>
            )}
          </header>

          {lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('advancedFinance.empty')}</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <BreakdownChart data={pieData} title={t('advancedFinance.pieTitle')} />

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('advancedFinance.upcomingTitle')}</CardTitle>
                  <CardDescription>{t('advancedFinance.upcomingDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingAuto.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('advancedFinance.manualColLine')}</TableHead>
                          <TableHead className="w-[10rem]">{t('advancedFinance.upcomingColDue')}</TableHead>
                          <TableHead className="w-[7.5rem] text-right">{t('advancedFinance.manualColAmount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingAuto.map((row) => {
                          const isToday = isAutomaticDebitDueToday(row.dayOfMonth, now)
                          const dueLabel = isToday
                            ? t('advancedFinance.upcomingDueToday')
                            : t('advancedFinance.upcomingOnDate', { date: formatDueDate(row.dayOfMonth) })
                          return (
                            <TableRow key={itemKey(row.kind, row.id)}>
                              <TableCell className="text-left font-medium">{row.label}</TableCell>
                              <TableCell className="text-left tabular-nums text-muted-foreground">{dueLabel}</TableCell>
                              <TableCell className="text-right font-mono tabular-nums">{formatCurrency(row.monthlyAmount)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">{t('advancedFinance.manualTitle')}</CardTitle>
                  <CardDescription>{t('advancedFinance.manualDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  {manualLines.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('advancedFinance.manualColLine')}</TableHead>
                          <TableHead className="hidden sm:table-cell">{t('advancedFinance.manualColSource')}</TableHead>
                          <TableHead>{t('advancedFinance.manualColCategory')}</TableHead>
                          <TableHead>{t('advancedFinance.manualColDay')}</TableHead>
                          <TableHead className="text-right">{t('advancedFinance.manualColAmount')}</TableHead>
                          <TableHead>{t('advancedFinance.manualColStatus')}</TableHead>
                          <TableHead className="w-[4.5rem] text-center">{t('advancedFinance.manualColDone')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualLines.map((row) => {
                          const key = itemKey(row.kind, row.id)
                          const due = manualTransferDueStatus(row.dayOfMonth, now)
                          const statusLabel =
                            due === 'past'
                              ? t('advancedFinance.manualStatusPast')
                              : due === 'today'
                                ? t('advancedFinance.manualStatusToday')
                                : t('advancedFinance.manualStatusAhead')
                          const done = completionLoaded && getDone(key, monthKey)
                          return (
                            <TableRow key={key}>
                              <TableCell className="font-medium">{row.label}</TableCell>
                              <TableCell className="hidden text-muted-foreground sm:table-cell">
                                {row.kind === 'fixed'
                                  ? t('advancedFinance.sourceFixed')
                                  : t('advancedFinance.sourceAnnex')}
                              </TableCell>
                              <TableCell>{row.category || t('advancedFinance.uncategorized')}</TableCell>
                              <TableCell>{t('schedule.dayOfMonthShort', { day: row.dayOfMonth })}</TableCell>
                              <TableCell className="text-right font-mono">{formatCurrency(row.monthlyAmount)}</TableCell>
                              <TableCell className="text-muted-foreground">{statusLabel}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox
                                  checked={done}
                                  disabled={!completionLoaded}
                                  onCheckedChange={(c) => setDone(key, c === true, monthKey)}
                                  aria-label={t('advancedFinance.manualColDone')}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {pastAuto.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('advancedFinance.pastAutoTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      {pastAuto.map((row) => (
                        <li
                          key={itemKey(row.kind, row.id)}
                          className="rounded-md border border-border bg-muted/40 px-2 py-1"
                        >
                          {row.label} · {formatCurrency(row.monthlyAmount)}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
