'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { formatCurrencyAmount } from '@/lib/i18n/locale'
import { sumSerializedNetBonuses } from '@/lib/salary-net-with-bonuses'
import type { TooltipProps } from 'recharts'

type Granularity = 'year' | 'month'

type MonthRow = {
  year: number
  month: number
  netPaye: number
  ticketRestaurant: number
  totalNetHorsImpots: number
}

type ChartPoint = {
  xLabel: string
  netPaye: number
  totalNetHorsImpots: number
  monthsWorked?: number
}

function numberLocaleForChart(lng: string): string {
  return lng === 'en' ? 'en-GB' : 'fr-FR'
}

function mapApiToMonthRows(json: unknown): MonthRow[] {
  if (!Array.isArray(json)) return []
  return json.map((raw) => {
    const r = raw as Record<string, unknown>
    const netBonus = sumSerializedNetBonuses(r.bonuses)
    const netPaye = Number(r.netPaye) + netBonus
    const ticketRestaurant = Number(r.ticketRestaurant)
    return {
      year: Number(r.year),
      month: Number(r.month),
      netPaye,
      ticketRestaurant,
      totalNetHorsImpots: netPaye + ticketRestaurant,
    }
  })
}

function monthlyChartPoints(rows: MonthRow[], locale: string): ChartPoint[] {
  const loc = numberLocaleForChart(locale)
  const sorted = [...rows].sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
  return sorted.map((r) => ({
    xLabel: new Date(r.year, r.month - 1, 1).toLocaleDateString(loc, { month: 'short', year: 'numeric' }),
    netPaye: r.netPaye,
    totalNetHorsImpots: r.totalNetHorsImpots,
  }))
}

/** Une ligne par année : moyennes = somme ÷ nombre de bulletins de l’année. */
function yearlyAvgChartPoints(rows: MonthRow[]): ChartPoint[] {
  const byYear = new Map<number, MonthRow[]>()
  for (const r of rows) {
    const arr = byYear.get(r.year) ?? []
    arr.push(r)
    byYear.set(r.year, arr)
  }
  const years = [...byYear.keys()].sort((a, b) => a - b)
  return years.map((year) => {
    const list = byYear.get(year) ?? []
    const n = list.length
    const sumNet = list.reduce((s, m) => s + m.netPaye, 0)
    const sumTot = list.reduce((s, m) => s + m.totalNetHorsImpots, 0)
    return {
      xLabel: String(year),
      netPaye: n > 0 ? sumNet / n : 0,
      totalNetHorsImpots: n > 0 ? sumTot / n : 0,
      monthsWorked: n,
    }
  })
}

function NetCurveTooltip({
  active,
  payload,
  label,
  lng,
  t,
}: TooltipProps<number, string> & { lng: string; t: (k: string, o?: Record<string, unknown>) => string }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as ChartPoint | undefined
  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      {row?.monthsWorked != null && row.monthsWorked > 0 ? (
        <div className="text-muted-foreground">{t('salaries.chartTooltipMonthsWorked', { count: row.monthsWorked })}</div>
      ) : null}
      <div className="grid gap-1">
        {payload.map((item) => (
          <div key={String(item.dataKey)} className="flex items-center justify-between gap-6">
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-mono font-medium tabular-nums text-foreground">
              {formatCurrencyAmount(Number(item.value), lng)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SalairesRecapitulatifPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language
  const [granularity, setGranularity] = useState<Granularity>('year')
  const [rows, setRows] = useState<MonthRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/salaires/months', { credentials: 'include' })
      if (!res.ok) {
        setError(t('salaries.loadError'))
        setRows([])
        return
      }
      const json: unknown = await res.json()
      setRows(mapApiToMonthRows(json))
    } catch {
      setError(t('salaries.loadError'))
      setRows([])
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const chartData = useMemo(() => {
    if (!rows?.length) return []
    return granularity === 'year'
      ? yearlyAvgChartPoints(rows)
      : monthlyChartPoints(rows, locale)
  }, [rows, granularity, locale])

  const chartConfig = useMemo(
    () =>
      ({
        netPaye: {
          label:
            granularity === 'year' ? t('salaries.chartNetPayeMonthlyAvg') : t('salaries.colNetPaye'),
          color: 'var(--chart-1)',
        },
        totalNetHorsImpots: {
          label:
            granularity === 'year'
              ? t('salaries.chartTotalNetHorsImpotsMonthlyAvg')
              : t('salaries.recapTotalNetHorsImpots'),
          color: 'var(--chart-2)',
        },
      }) satisfies ChartConfig,
    [t, granularity],
  )

  const chartDescription =
    granularity === 'year' ? t('salaries.chartLeadYear') : t('salaries.chartLeadMonth')

  const loading = rows === null

  const xBusy = chartData.length > 14

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-5 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('salaries.recapTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('salaries.recapLead')}</p>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-lg">{t('salaries.chartTitle')}</CardTitle>
            <CardDescription>{chartDescription}</CardDescription>
          </div>
          <div className="flex max-w-md gap-1 rounded-lg border border-border bg-muted/30 p-1">
            <Button
              type="button"
              variant={granularity === 'year' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setGranularity('year')}
            >
              {t('salaries.chartByYear')}
            </Button>
            <Button
              type="button"
              variant={granularity === 'month' ? 'default' : 'ghost'}
              size="sm"
              className="flex-1"
              onClick={() => setGranularity('month')}
            >
              {t('salaries.chartByMonth')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[min(24rem,50vh)] w-full rounded-md" />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[min(24rem,50vh)] w-full">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="xLabel"
                  tickLine={false}
                  axisLine={false}
                  interval={granularity === 'month' && chartData.length > 18 ? 'preserveStartEnd' : 0}
                  angle={granularity === 'month' && xBusy ? -35 : 0}
                  textAnchor={granularity === 'month' && xBusy ? 'end' : 'middle'}
                  height={granularity === 'month' && xBusy ? 56 : 32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v) => formatCurrencyAmount(Number(v), locale)}
                />
                <Tooltip content={<NetCurveTooltip lng={locale} t={t} />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="netPaye"
                  name={granularity === 'year' ? t('salaries.chartNetPayeMonthlyAvg') : t('salaries.colNetPaye')}
                  stroke="var(--color-netPaye)"
                  strokeWidth={2}
                  dot={granularity === 'year'}
                />
                <Line
                  type="monotone"
                  dataKey="totalNetHorsImpots"
                  name={
                    granularity === 'year'
                      ? t('salaries.chartTotalNetHorsImpotsMonthlyAvg')
                      : t('salaries.recapTotalNetHorsImpots')
                  }
                  stroke="var(--color-totalNetHorsImpots)"
                  strokeWidth={2}
                  dot={granularity === 'year'}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
