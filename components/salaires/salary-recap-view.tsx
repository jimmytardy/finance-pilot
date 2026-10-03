'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrencyAmount } from '@/lib/i18n/locale'
import { formatYearMonthLabel } from '@/lib/salary-month-label'
import { PARTAGE_VALEUR_KEYS, type SalaryStats, type YearStats } from '@/lib/salary-stats'
import { fetchOpts, formatPct } from '@/components/salaires/payslip-format'

type Granularity = 'year' | 'month'
type TaxMode = 'apres' | 'avant'

/** Valeurs arrondies à l'euro pour les graphiques (lisibilité des infobulles). */
const r0 = (n: number) => Math.round(n)

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex max-w-md gap-1 rounded-lg border border-border bg-muted/30 p-1">
      {options.map((o) => (
        <Button
          key={o.value}
          type="button"
          size="sm"
          className="flex-1"
          variant={value === o.value ? 'default' : 'ghost'}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export function SalaryRecapView() {
  const { t, i18n } = useTranslation()
  const lng = i18n.language
  const money = useCallback((n: number) => formatCurrencyAmount(n, lng), [lng])
  const [stats, setStats] = useState<SalaryStats | null>(null)
  const [error, setError] = useState(false)
  const [granularity, setGranularity] = useState<Granularity>('year')
  const [taxMode, setTaxMode] = useState<TaxMode>('apres')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/salaires/stats', fetchOpts)
      if (!res.ok) throw new Error('stats')
      setStats(await res.json())
    } catch {
      setError(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const years = stats?.years ?? []
  const last: YearStats | undefined = years[years.length - 1]

  const fixeVariableData = useMemo(() => {
    if (!stats) return []
    if (granularity === 'year') {
      return stats.years.map((y) => ({
        x: String(y.year),
        fixe: r0(y.fixeBrut),
        variable: r0(y.variableBrut),
        partageValeur: r0(PARTAGE_VALEUR_KEYS.reduce((s, k) => s + y.partageValeur[k].brut, 0)),
        evo: y.evoFixeMensuelPct == null ? null : Math.round(y.evoFixeMensuelPct * 10) / 10,
      }))
    }
    return stats.months.map((m) => ({
      x: formatYearMonthLabel(m.key, lng),
      fixe: r0(m.fixeBrut),
      variable: r0(m.variableBrut),
      partageValeur: r0(PARTAGE_VALEUR_KEYS.reduce((s, k) => s + m.partageValeur[k].brut, 0)),
      evo: null,
    }))
  }, [stats, granularity, lng])

  const cumulData = useMemo(
    () =>
      (stats?.cumul ?? []).map((c) => ({
        x: formatYearMonthLabel(c.key, lng),
        netSalaire: r0(c.netSalaire),
        titresRestaurant: r0(c.titresRestaurant),
        partageValeurPercu: r0(c.partageValeurPercu),
        partageValeurPlace: r0(c.partageValeurPlace),
        pas: taxMode === 'avant' ? r0(c.pas) : 0,
      })),
    [stats, taxMode, lng],
  )

  const fixeVariableConfig = useMemo(
    () =>
      ({
        fixe: { label: t('salaries.stats.fixe'), color: 'var(--chart-1)' },
        variable: { label: t('salaries.stats.variable'), color: 'var(--chart-3)' },
        partageValeur: { label: t('salaries.stats.partageValeur'), color: 'var(--chart-4)' },
        evo: { label: t('salaries.stats.evoFixe'), color: 'var(--chart-2)' },
      }) satisfies ChartConfig,
    [t],
  )

  const cumulConfig = useMemo(
    () =>
      ({
        netSalaire: { label: t('salaries.stats.netSalaire'), color: 'var(--chart-1)' },
        titresRestaurant: { label: t('salaries.stats.titresRestaurant'), color: 'var(--chart-3)' },
        partageValeurPercu: { label: t('salaries.stats.partageValeurPercu'), color: 'var(--chart-4)' },
        partageValeurPlace: { label: t('salaries.stats.partageValeurPlace'), color: 'var(--chart-5)' },
        pas: { label: t('salaries.stats.pas'), color: 'var(--chart-2)' },
      }) satisfies ChartConfig,
    [t],
  )

  const loading = stats === null && !error
  const empty = stats !== null && stats.months.length === 0
  const xBusy = cumulData.length > 14

  const placeholder = (h: string) =>
    loading ? (
      <Skeleton className={`${h} w-full rounded-md`} />
    ) : error ? (
      <p className="text-sm text-destructive">{t('salaries.loadError')}</p>
    ) : (
      <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
    )

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-5 md:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('salaries.recapTitle')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('salaries.recapLead')}</p>
      </div>

      {last ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label={t('salaries.stats.kpiNetEnPoche', { year: last.year })}
            value={money(last.netEnPocheApresImpot)}
            hint={t('salaries.stats.kpiEvo', { pct: formatPct(last.evoNetEnPochePct, lng) })}
          />
          <Kpi
            label={t('salaries.stats.kpiCumul')}
            value={money(last.cumulNetEnPocheApresImpot)}
            hint={t('salaries.stats.kpiCumulAvant', { amount: money(last.cumulNetEnPocheAvantImpot) })}
          />
          <Kpi
            label={t('salaries.stats.kpiFixeMensuel', { year: last.year })}
            value={money(last.avgFixeMensuel)}
            hint={t('salaries.stats.kpiEvo', { pct: formatPct(last.evoFixeMensuelPct, lng) })}
          />
          <Kpi
            label={t('salaries.stats.kpiPartVariable', { year: last.year })}
            value={formatPct(last.partVariablePct, lng).replace(/^\+/, '')}
            hint={money(last.variableBrut)}
          />
        </div>
      ) : null}

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-lg">{t('salaries.stats.fixeVariableTitle')}</CardTitle>
            <CardDescription>{t('salaries.stats.fixeVariableLead')}</CardDescription>
          </div>
          <SegmentedToggle
            value={granularity}
            onChange={setGranularity}
            options={[
              { value: 'year', label: t('salaries.chartByYear') },
              { value: 'month', label: t('salaries.chartByMonth') },
            ]}
          />
        </CardHeader>
        <CardContent>
          {loading || error || empty ? (
            placeholder('h-[min(24rem,50vh)]')
          ) : (
            <ChartContainer config={fixeVariableConfig} className="h-[min(24rem,50vh)] w-full">
              <ComposedChart data={fixeVariableData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  angle={granularity === 'month' ? -35 : 0}
                  textAnchor={granularity === 'month' ? 'end' : 'middle'}
                  height={granularity === 'month' ? 64 : 32}
                />
                <YAxis
                  yAxisId="eur"
                  tickLine={false}
                  axisLine={false}
                  width={72}
                  tickFormatter={(v) => money(Number(v))}
                />
                {granularity === 'year' ? (
                  <YAxis
                    yAxisId="pct"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v) => `${v} %`}
                  />
                ) : null}
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar yAxisId="eur" dataKey="fixe" stackId="brut" fill="var(--color-fixe)" />
                <Bar yAxisId="eur" dataKey="variable" stackId="brut" fill="var(--color-variable)" />
                <Bar
                  yAxisId="eur"
                  dataKey="partageValeur"
                  stackId="brut"
                  fill="var(--color-partageValeur)"
                  radius={[4, 4, 0, 0]}
                />
                {granularity === 'year' ? (
                  <Line
                    yAxisId="pct"
                    type="monotone"
                    dataKey="evo"
                    stroke="var(--color-evo)"
                    strokeWidth={2}
                    connectNulls
                  />
                ) : null}
              </ComposedChart>
            </ChartContainer>
          )}
          {stats && stats.raises.length > 0 ? (
            <div className="mt-4">
              <h3 className="mb-1 text-sm font-semibold">{t('salaries.stats.raisesTitle')}</h3>
              <ul className="grid gap-1 text-sm sm:grid-cols-2">
                {stats.raises.map((r) => (
                  <li key={r.key} className="flex justify-between rounded-md bg-muted/30 px-3 py-1.5">
                    <span>{formatYearMonthLabel(r.key, lng)}</span>
                    <span className="tabular-nums">
                      {money(r.from)} → {money(r.to)}{' '}
                      <span className={r.pct >= 0 ? 'text-green-600' : 'text-destructive'}>
                        ({formatPct(r.pct, lng)})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="text-lg">{t('salaries.stats.cumulTitle')}</CardTitle>
            <CardDescription>{t('salaries.stats.cumulLead')}</CardDescription>
          </div>
          <SegmentedToggle
            value={taxMode}
            onChange={setTaxMode}
            options={[
              { value: 'apres', label: t('salaries.stats.apresImpot') },
              { value: 'avant', label: t('salaries.stats.avantImpot') },
            ]}
          />
        </CardHeader>
        <CardContent>
          {loading || error || empty ? (
            placeholder('h-[min(24rem,50vh)]')
          ) : (
            <ChartContainer config={cumulConfig} className="h-[min(24rem,50vh)] w-full">
              <AreaChart data={cumulData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="x"
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  angle={xBusy ? -35 : 0}
                  textAnchor={xBusy ? 'end' : 'middle'}
                  height={xBusy ? 64 : 32}
                />
                <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(v) => money(Number(v))} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {(['netSalaire', 'titresRestaurant', 'partageValeurPercu', 'partageValeurPlace'] as const).map((k) => (
                  <Area
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stackId="poche"
                    stroke={`var(--color-${k})`}
                    fill={`var(--color-${k})`}
                    fillOpacity={0.35}
                  />
                ))}
                {taxMode === 'avant' ? (
                  <Area
                    type="monotone"
                    dataKey="pas"
                    stackId="poche"
                    stroke="var(--color-pas)"
                    fill="var(--color-pas)"
                    fillOpacity={0.2}
                    strokeDasharray="4 3"
                  />
                ) : null}
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('salaries.stats.pvImpotTitle')}</CardTitle>
          <CardDescription>{t('salaries.stats.pvImpotLead')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading || error || empty ? (
            placeholder('h-32')
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.colYear')}</TableHead>
                  {PARTAGE_VALEUR_KEYS.filter((k) => k !== 'autre').map((k) => (
                    <TableHead key={k} className="text-right">
                      {t(`salaries.categories.${k}`)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">{t('salaries.stats.pvNet')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.pvPlace')}</TableHead>
                  <TableHead className="text-right">{t('salaries.totals.netImposable')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.pas')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.tauxPasMoyen')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((y) => {
                  const pvNet = PARTAGE_VALEUR_KEYS.reduce((s, k) => s + y.partageValeur[k].net, 0)
                  return (
                    <TableRow key={y.year}>
                      <TableCell className="font-medium">{y.year}</TableCell>
                      {PARTAGE_VALEUR_KEYS.filter((k) => k !== 'autre').map((k) => (
                        <TableCell key={k} className="text-right tabular-nums">
                          {money(y.partageValeur[k].brut)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right tabular-nums">{money(pvNet)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(y.partageValeurPlaceNet)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(y.netImposable)}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(y.pas)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPct(y.tauxPasMoyen, lng, 2).replace(/^\+/, '')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('salaries.stats.yearTableTitle')}</CardTitle>
          <CardDescription>{t('salaries.stats.yearTableLead')}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading || error || empty ? (
            placeholder('h-32')
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.colYear')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapColMonthsCount')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.fixe')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.variable')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.cotisationsSalariales')}</TableHead>
                  <TableHead className="text-right">{t('salaries.totals.netPaye')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.titresRestaurant')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.netEnPoche')}</TableHead>
                  <TableHead className="text-right">{t('salaries.stats.evoNetEnPoche')}</TableHead>
                  <TableHead className="text-right">{t('salaries.totals.coutEmployeur')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((y) => (
                  <TableRow key={y.year}>
                    <TableCell className="font-medium">{y.year}</TableCell>
                    <TableCell className="text-right tabular-nums">{y.monthsWorked}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.fixeBrut)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.variableBrut)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.cotisationsSalariales)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.netPaye)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.titresRestaurant)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{money(y.netEnPocheApresImpot)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatPct(y.evoNetEnPochePct, lng)}</TableCell>
                    <TableCell className="text-right tabular-nums">{y.coutEmployeur > 0 ? money(y.coutEmployeur) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
