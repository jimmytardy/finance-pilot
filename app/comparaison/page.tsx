'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useFinanceData } from '@/hooks/use-finance-data'
import { useSavedProjects } from '@/hooks/use-saved-projects'
import { buildInvestmentProjectionSeries } from '@/lib/investment-projection'
import { getFinanceMetrics } from '@/lib/finance-metrics'
import { formatCompactAmount, formatCurrencyAmount, projectionYearLabel } from '@/lib/i18n/locale'
import { AlertTriangle, GitCompare } from 'lucide-react'

const DRAFT_SOURCE = 'draft'

type HorizonYears = 10 | 20 | 30

export default function ComparaisonPage() {
  const { t, i18n } = useTranslation()
  const { data: draftData, isLoaded: financeLoaded } = useFinanceData()
  const { projects, isLoaded: projectsLoaded } = useSavedProjects()

  const [sourceA, setSourceA] = useState(DRAFT_SOURCE)
  const [sourceB, setSourceB] = useState('')
  const [horizonYears, setHorizonYears] = useState<HorizonYears>(20)

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)
  const formatCompact = (amount: number) => formatCompactAmount(amount, i18n.language)

  useEffect(() => {
    if (!financeLoaded || !projectsLoaded || sourceB) return
    setSourceB(projects[0]?.id ?? DRAFT_SOURCE)
  }, [financeLoaded, projectsLoaded, projects, sourceB])

  const labelFor = (id: string) => {
    if (id === DRAFT_SOURCE) return t('comparaison.draft')
    return projects.find((p) => p.id === id)?.name ?? t('comparaison.projectFallback')
  }

  const dataA = useMemo(() => {
    if (sourceA === DRAFT_SOURCE) return draftData
    return projects.find((p) => p.id === sourceA)?.data ?? draftData
  }, [sourceA, draftData, projects])

  const dataB = useMemo(() => {
    if (sourceB === DRAFT_SOURCE) return draftData
    return projects.find((p) => p.id === sourceB)?.data ?? draftData
  }, [sourceB, draftData, projects])

  const nameA = labelFor(sourceA)
  const nameB = labelFor(sourceB)

  const metricsA = useMemo(() => getFinanceMetrics(dataA), [dataA])
  const metricsB = useMemo(() => getFinanceMetrics(dataB), [dataB])

  const seriesA = useMemo(
    () => buildInvestmentProjectionSeries(dataA.investments, horizonYears),
    [dataA.investments, horizonYears],
  )
  const seriesB = useMemo(
    () => buildInvestmentProjectionSeries(dataB.investments, horizonYears),
    [dataB.investments, horizonYears],
  )

  const chartRows = useMemo(() => {
    return seriesA.map((row, i) => ({
      yearLabel: projectionYearLabel(t, row.year),
      portfolioA: row.portfolioValue,
      portfolioB: seriesB[i]?.portfolioValue ?? 0,
      delta: row.portfolioValue - (seriesB[i]?.portfolioValue ?? 0),
    }))
  }, [seriesA, seriesB, t, i18n.language])

  const endA = seriesA[seriesA.length - 1]?.portfolioValue ?? 0
  const endB = seriesB[seriesB.length - 1]?.portfolioValue ?? 0

  const chartConfig = useMemo(
    () => ({
      portfolioA: { label: nameA, color: 'var(--chart-1)' },
      portfolioB: { label: nameB, color: 'var(--chart-2)' },
    }),
    [nameA, nameB],
  )

  const sameSource = sourceA === sourceB
  const noInvestmentsBoth = dataA.investments.length === 0 && dataB.investments.length === 0

  const ready = financeLoaded && projectsLoaded && sourceB !== ''

  if (!ready) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-full max-w-xl mb-8" />
            <Skeleton className="h-[420px] w-full" />
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
          <header className="mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <GitCompare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-balance">{t('comparaison.title')}</h1>
                <p className="text-muted-foreground mt-1 max-w-2xl">{t('comparaison.subtitle')}</p>
              </div>
            </div>
          </header>

          {projects.length === 0 && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('comparaison.alertNoProjectsTitle')}</AlertTitle>
              <AlertDescription>{t('comparaison.alertNoProjectsBody')}</AlertDescription>
            </Alert>
          )}

          {sameSource && (
            <Alert variant="default" className="mb-6 border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle>{t('comparaison.alertSameTitle')}</AlertTitle>
              <AlertDescription>{t('comparaison.alertSameBody')}</AlertDescription>
            </Alert>
          )}

          <section className="mb-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('comparaison.scenarioA')}</CardTitle>
                <CardDescription>{t('comparaison.scenarioADesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="source-a" className="text-xs text-muted-foreground">
                  {t('comparaison.source')}
                </Label>
                <Select value={sourceA} onValueChange={setSourceA}>
                  <SelectTrigger id="source-a" className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DRAFT_SOURCE}>{t('comparaison.draft')}</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t('comparaison.scenarioB')}</CardTitle>
                <CardDescription>{t('comparaison.scenarioBDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="source-b" className="text-xs text-muted-foreground">
                  {t('comparaison.source')}
                </Label>
                <Select value={sourceB} onValueChange={setSourceB}>
                  <SelectTrigger id="source-b" className="w-full max-w-md">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DRAFT_SOURCE}>{t('comparaison.draft')}</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </section>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCompareCard
              title={t('comparaison.cardMonthlyBalance')}
              a={metricsA.monthlyBalance}
              b={metricsB.monthlyBalance}
              format={formatCurrency}
            />
            <MetricCompareCard
              title={t('comparaison.cardAvailable')}
              a={metricsA.availableToInvest}
              b={metricsB.availableToInvest}
              format={formatCurrency}
            />
            <MetricCompareCard
              title={t('comparaison.cardRental')}
              a={metricsA.totalRentalNetResult}
              b={metricsB.totalRentalNetResult}
              format={formatCurrency}
            />
            <MetricCompareCard
              title={t('comparaison.cardPortfolioToday')}
              a={metricsA.totalInvestmentValue}
              b={metricsB.totalInvestmentValue}
              format={formatCurrency}
            />
          </section>

          <Card className="mb-8">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">{t('comparaison.projectionTitle')}</CardTitle>
                <CardDescription>{t('comparaison.projectionDesc')}</CardDescription>
              </div>
              <Tabs
                value={String(horizonYears)}
                onValueChange={(v) => setHorizonYears(Number(v) as HorizonYears)}
              >
                <TabsList className="h-8">
                  <TabsTrigger value="10" className="text-xs px-3">
                    {t('estimations.horizon10')}
                  </TabsTrigger>
                  <TabsTrigger value="20" className="text-xs px-3">
                    {t('estimations.horizon20')}
                  </TabsTrigger>
                  <TabsTrigger value="30" className="text-xs px-3">
                    {t('estimations.horizon30')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {noInvestmentsBoth ? (
                <p className="text-sm text-muted-foreground py-8 text-center">{t('comparaison.noInvestmentsBoth')}</p>
              ) : (
                <ChartContainer config={chartConfig} className="aspect-[16/9] min-h-[280px] w-full">
                  <LineChart data={chartRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="yearLabel"
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${formatCompact(Number(v))}\u00a0€`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="portfolioA"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      dot={false}
                      name={nameA}
                    />
                    <Line
                      type="monotone"
                      dataKey="portfolioB"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={false}
                      name={nameB}
                    />
                  </LineChart>
                </ChartContainer>
              )}

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('comparaison.endHorizon', { name: nameA })}</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(endA)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">{t('comparaison.endHorizon', { name: nameB })}</p>
                  <p className="text-xl font-bold font-mono">{formatCurrency(endB)}</p>
                </div>
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {t('comparaison.gapTitle', { years: horizonYears })}
                  </p>
                  <p
                    className={`text-xl font-bold font-mono ${
                      endA - endB >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(endA - endB)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t('comparaison.gapHint')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('comparaison.tableTitle')}</CardTitle>
              <CardDescription>{t('comparaison.tableDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[min(24rem,50vh)] rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium">{t('comparaison.tablePeriod')}</th>
                      <th className="p-3 font-medium text-right">{nameA}</th>
                      <th className="p-3 font-medium text-right">{nameB}</th>
                      <th className="p-3 font-medium text-right">{t('comparaison.tableGap')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartRows.map((row) => (
                      <tr key={row.yearLabel} className="border-b border-border/60 last:border-0">
                        <td className="p-3 text-muted-foreground">{row.yearLabel}</td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {formatCurrency(row.portfolioA)}
                        </td>
                        <td className="p-3 text-right font-mono tabular-nums">
                          {formatCurrency(row.portfolioB)}
                        </td>
                        <td
                          className={`p-3 text-right font-mono tabular-nums ${
                            row.delta >= 0 ? 'text-primary' : 'text-destructive'
                          }`}
                        >
                          {formatCurrency(row.delta)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>

          <footer className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            <p>{t('comparaison.footerDisclaimer')}</p>
          </footer>
        </div>
      </main>
    </>
  )
}

function MetricCompareCard({
  title,
  a,
  b,
  format,
}: {
  title: string
  a: number
  b: number
  format: (n: number) => string
}) {
  const { t } = useTranslation()
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">{t('comparaison.scenarioLabelA')}</span>
          <span className="font-mono text-right tabular-nums">{format(a)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">{t('comparaison.scenarioLabelB')}</span>
          <span className="font-mono text-right tabular-nums">{format(b)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
