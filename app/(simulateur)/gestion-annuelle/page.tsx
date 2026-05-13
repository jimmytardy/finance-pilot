'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSimulatorWorkspace } from '@/contexts/simulator-workspace-context'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  aggregateYearCategoryTotals,
  buildQuarterAggregates,
  buildYearSlices,
  categoryLabel,
  QUARTER_RESTE_A_VIVRE_DATA_KEY,
  type QuarterAggregate,
} from '@/lib/annual-budget-analytics'
import { BreakdownChart } from '@/components/dashboard/breakdown-chart'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts'
import { formatCurrencyAmount } from '@/lib/i18n/locale'

const LINE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

function formatMonthList(year: number, monthNumbers: number[], locale: string): string {
  if (monthNumbers.length === 0) return ''
  return monthNumbers
    .map((m) => new Date(year, m - 1, 1).toLocaleDateString(locale, { month: 'short' }))
    .join(', ')
}

function quarterRowsForTable(q: QuarterAggregate, uncategorized: string) {
  return Array.from(q.byCategory.entries())
    .map(([key, value]) => ({
      name: categoryLabel(key, uncategorized),
      value,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
}

export default function GestionAnnuellePage() {
  const { t, i18n } = useTranslation()
  const { financeLoaded, monthlySnapshots } = useSimulatorWorkspace()

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const k of Object.keys(monthlySnapshots)) {
      const y = Number(k.slice(0, 4))
      if (Number.isFinite(y)) set.add(y)
    }
    set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => b - a)
  }, [monthlySnapshots])

  const [year, setYear] = useState(() => years[0] ?? new Date().getFullYear())

  const displayYear = years.includes(year) ? year : (years[0] ?? new Date().getFullYear())

  useEffect(() => {
    if (!years.includes(year) && years.length > 0) {
      setYear(years[0]!)
    }
  }, [years, year])

  const uncategorized = t('advancedFinance.uncategorized')

  const yearTotals = useMemo(
    () => aggregateYearCategoryTotals(monthlySnapshots, displayYear),
    [monthlySnapshots, displayYear],
  )

  const pieData = useMemo(() => {
    const rows = Array.from(yearTotals.entries())
      .map(([key, value]) => ({
        name: categoryLabel(key, uncategorized),
        value,
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
    return rows
  }, [yearTotals, uncategorized])

  const topCategoryKeys = useMemo(() => {
    return Array.from(yearTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k]) => k)
  }, [yearTotals])

  const slices = useMemo(
    () => buildYearSlices(monthlySnapshots, displayYear, i18n.language),
    [monthlySnapshots, displayYear, i18n.language],
  )

  const evolutionRows = useMemo(() => {
    return slices.map((s) => {
      const row: Record<string, string | number> = { mois: s.shortLabel }
      for (const cat of topCategoryKeys) {
        row[cat] = s.byCategory.get(cat) ?? 0
      }
      return row
    })
  }, [slices, topCategoryKeys])

  const chartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color?: string }> = { mois: { label: t('annualPage.axisMonth') } }
    topCategoryKeys.forEach((cat, i) => {
      cfg[cat] = {
        label: categoryLabel(cat, uncategorized),
        color: LINE_COLORS[i % LINE_COLORS.length],
      }
    })
    return cfg
  }, [topCategoryKeys, t, uncategorized])

  const quarterAggregates = useMemo(
    () => buildQuarterAggregates(monthlySnapshots, displayYear),
    [monthlySnapshots, displayYear],
  )

  const allQuarterCategoryKeys = useMemo(() => {
    const set = new Set<string>()
    for (const q of quarterAggregates) {
      for (const k of q.byCategory.keys()) set.add(k)
    }
    return Array.from(set).sort((a, b) =>
      categoryLabel(a, uncategorized).localeCompare(categoryLabel(b, uncategorized), i18n.language, {
        sensitivity: 'base',
      }),
    )
  }, [quarterAggregates, uncategorized, i18n.language])

  const quarterLineRows = useMemo(() => {
    return quarterAggregates.map((q) => {
      const row: Record<string, string | number> = {
        trimestre: t('annualPage.quarterShort', { n: q.quarter }),
        [QUARTER_RESTE_A_VIVRE_DATA_KEY]: q.resteAVivre,
      }
      for (const cat of allQuarterCategoryKeys) {
        row[cat] = q.byCategory.get(cat) ?? 0
      }
      return row
    })
  }, [quarterAggregates, allQuarterCategoryKeys, t])

  const quarterSeriesResetKey = `${displayYear}:${allQuarterCategoryKeys.join('|')}`

  const [visibleCategoryKeys, setVisibleCategoryKeys] = useState<Set<string> | null>(null)
  const [showResteLine, setShowResteLine] = useState(true)

  useEffect(() => {
    setVisibleCategoryKeys(new Set(allQuarterCategoryKeys))
  }, [quarterSeriesResetKey])

  const effectiveVisibleCategories = useMemo(() => {
    if (visibleCategoryKeys !== null) return visibleCategoryKeys
    return new Set(allQuarterCategoryKeys)
  }, [visibleCategoryKeys, allQuarterCategoryKeys])

  const hiddenCategoryKeys = useMemo(
    () => allQuarterCategoryKeys.filter((k) => !effectiveVisibleCategories.has(k)),
    [allQuarterCategoryKeys, effectiveVisibleCategories],
  )

  const quarterLineChartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color?: string }> = {
      trimestre: { label: t('annualPage.axisQuarter') },
      [QUARTER_RESTE_A_VIVRE_DATA_KEY]: {
        label: t('annualPage.resteAVivre'),
        color: 'var(--chart-5)',
      },
    }
    allQuarterCategoryKeys.forEach((cat, i) => {
      cfg[cat] = {
        label: categoryLabel(cat, uncategorized),
        color: LINE_COLORS[i % LINE_COLORS.length],
      }
    })
    return cfg
  }, [allQuarterCategoryKeys, t, uncategorized])

  if (!financeLoaded) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="mb-2 h-10 w-72" />
          <Skeleton className="mb-8 h-5 w-full max-w-xl" />
          <Skeleton className="h-80 w-full" />
        </div>
      </main>
    )
  }

  const hasAnyMonthInYear = slices.length > 0

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-balance text-3xl font-bold">{t('annualPage.title')}</h1>
            <p className="mt-1 max-w-3xl text-muted-foreground">{t('annualPage.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Label htmlFor="annual-year" className="text-xs text-muted-foreground">
              {t('annualPage.yearLabel')}
            </Label>
            <Select
              value={String(displayYear)}
              onValueChange={(v) => {
                const n = Number(v)
                setYear(Number.isFinite(n) ? n : displayYear)
              }}
            >
              <SelectTrigger id="annual-year" className="w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        {!hasAnyMonthInYear ? (
          <p className="text-sm text-muted-foreground">{t('annualPage.noMonths')}</p>
        ) : (
          <Tabs defaultValue="annual" className="gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="grid h-auto w-full max-w-lg grid-cols-2 sm:inline-flex sm:h-9 sm:w-auto">
                <TabsTrigger value="annual" className="px-3 py-2 sm:py-1">
                  {t('annualPage.tabAnnual')}
                </TabsTrigger>
                <TabsTrigger value="quarterly" className="px-3 py-2 sm:py-1">
                  {t('annualPage.tabQuarterly')}
                </TabsTrigger>
              </TabsList>
              <p className="text-xs text-muted-foreground sm:max-w-md sm:text-right">{t('annualPage.tabStripHint')}</p>
            </div>

            <TabsContent value="annual" className="mt-0">
              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart data={pieData} title={t('annualPage.pieTitle', { year: displayYear })} showPercentages />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('annualPage.tableTitle')}</CardTitle>
                    <CardDescription>{t('annualPage.tableDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="py-2 pr-4 font-medium">{t('annualPage.colCategory')}</th>
                          <th className="py-2 text-right font-medium tabular-nums">{t('annualPage.colYearTotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pieData.map((row) => (
                          <tr key={row.name} className="border-b border-border/60">
                            <td className="py-2 pr-4">{row.name}</td>
                            <td className="py-2 text-right font-mono tabular-nums">
                              {formatCurrencyAmount(row.value, i18n.language)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{t('annualPage.evolutionTitle')}</CardTitle>
                    <CardDescription>{t('annualPage.evolutionDesc')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topCategoryKeys.length === 0 ? (
                      <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                    ) : (
                      <ChartContainer config={chartConfig} className="h-[min(24rem,50vh)] w-full">
                        <LineChart data={evolutionRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} width={56} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          {topCategoryKeys.map((cat, i) => (
                            <Line
                              key={cat}
                              type="monotone"
                              dataKey={cat}
                              name={categoryLabel(cat, uncategorized)}
                              stroke={LINE_COLORS[i % LINE_COLORS.length]}
                              strokeWidth={2}
                              dot={false}
                            />
                          ))}
                        </LineChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quarterly" className="mt-0 space-y-6">
              <p className="text-sm text-muted-foreground">{t('annualPage.quarterlyIntro')}</p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('annualPage.quarterCategoryCurveTitle')}</CardTitle>
                  <CardDescription>{t('annualPage.quarterCategoryCurveDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCategoryKeys(new Set(allQuarterCategoryKeys))}
                    >
                      {t('annualPage.showAllCategories')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCategoryKeys(new Set())}
                    >
                      {t('annualPage.hideAllCategories')}
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <Checkbox checked={showResteLine} onCheckedChange={(c) => setShowResteLine(c === true)} />
                      {t('annualPage.resteAVivre')}
                    </label>
                    {hiddenCategoryKeys.length > 0 ? (
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:justify-end">
                        <Label htmlFor="quarter-add-series" className="shrink-0 text-xs text-muted-foreground">
                          {t('annualPage.addSeriesLabel')}
                        </Label>
                        <select
                          id="quarter-add-series"
                          className="h-9 max-w-full min-w-[12rem] rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          defaultValue=""
                          onChange={(e) => {
                            const v = e.target.value
                            e.target.value = ''
                            if (!v) return
                            setVisibleCategoryKeys((prev) => {
                              const base = prev !== null ? prev : new Set(allQuarterCategoryKeys)
                              const next = new Set(base)
                              next.add(v)
                              return next
                            })
                          }}
                        >
                          <option value="">{t('annualPage.addSeriesPlaceholder')}</option>
                          {hiddenCategoryKeys.map((cat) => (
                            <option key={cat} value={cat}>
                              {categoryLabel(cat, uncategorized)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>
                  <div className="max-h-[min(40vh,16rem)] overflow-y-auto rounded-md border border-border/60 p-2">
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {allQuarterCategoryKeys.map((cat) => (
                        <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={effectiveVisibleCategories.has(cat)}
                            onCheckedChange={(c) => {
                              setVisibleCategoryKeys((prev) => {
                                const base = prev !== null ? prev : new Set(allQuarterCategoryKeys)
                                const next = new Set(base)
                                if (c === true) next.add(cat)
                                else next.delete(cat)
                                return next
                              })
                            }}
                          />
                          <span>{categoryLabel(cat, uncategorized)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {allQuarterCategoryKeys.length === 0 && !showResteLine ? (
                    <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
                  ) : !showResteLine && allQuarterCategoryKeys.every((k) => !effectiveVisibleCategories.has(k)) ? (
                    <p className="text-sm text-muted-foreground">{t('annualPage.quarterCurveNothingVisible')}</p>
                  ) : (
                    <ChartContainer config={quarterLineChartConfig} className="h-[min(26rem,55vh)] w-full">
                      <LineChart data={quarterLineRows} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="trimestre" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={56} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        {showResteLine ? (
                          <Line
                            type="monotone"
                            dataKey={QUARTER_RESTE_A_VIVRE_DATA_KEY}
                            name={t('annualPage.resteAVivre')}
                            stroke="var(--chart-5)"
                            strokeWidth={2.5}
                            strokeDasharray="6 4"
                            dot={{ r: 3 }}
                          />
                        ) : null}
                        {allQuarterCategoryKeys
                          .filter((cat) => effectiveVisibleCategories.has(cat))
                          .map((cat) => {
                            const colorIndex = allQuarterCategoryKeys.indexOf(cat)
                            return (
                              <Line
                                key={cat}
                                type="monotone"
                                dataKey={cat}
                                name={categoryLabel(cat, uncategorized)}
                                stroke={LINE_COLORS[colorIndex % LINE_COLORS.length]}
                                strokeWidth={2}
                                dot={{ r: 2 }}
                              />
                            )
                          })}
                      </LineChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {quarterAggregates.map((q) => {
                  const rows = quarterRowsForTable(q, uncategorized)
                  const monthList = formatMonthList(displayYear, q.monthsPresent, i18n.language)
                  return (
                    <Card key={q.quarter}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {t('annualPage.quarterCardTitle', { n: q.quarter, year: displayYear })}
                        </CardTitle>
                        <CardDescription>
                          {q.monthsPresent.length > 0
                            ? t('annualPage.quarterMonthsPresent', { list: monthList })
                            : t('annualPage.quarterEmpty')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm font-medium tabular-nums">
                          {t('annualPage.quarterTotalLabel')}{' '}
                          <span className="font-mono">{formatCurrencyAmount(q.total, i18n.language)}</span>
                        </p>
                        {rows.length > 0 ? (
                          <>
                            <p className="text-xs font-medium text-muted-foreground">
                              {t('annualPage.quarterCategoryDetail')}
                            </p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-border text-left text-muted-foreground">
                                    <th className="py-2 pr-4 font-medium">{t('annualPage.colCategory')}</th>
                                    <th className="py-2 text-right font-medium tabular-nums">
                                      {t('annualPage.quarterColAmount')}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {rows.map((row) => (
                                    <tr key={`${q.quarter}-${row.name}`} className="border-b border-border/60">
                                      <td className="py-2 pr-4">{row.name}</td>
                                      <td className="py-2 text-right font-mono tabular-nums">
                                        {formatCurrencyAmount(row.value, i18n.language)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </>
                        ) : null}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  )
}
