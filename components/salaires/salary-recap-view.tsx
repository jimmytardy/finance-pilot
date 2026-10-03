'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
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
import { formatMonthLongName, formatYearMonthLabel, formatYearMonthShort } from '@/lib/salary-month-label'
import { PARTAGE_VALEUR_KEYS, type SalaryStats, type YearStats } from '@/lib/salary-stats'
import { fetchOpts, formatPct } from '@/components/salaires/payslip-format'

type Granularity = 'year' | 'month'

/** Infobulle : libellé complet du point survolé (l'axe affiche une forme courte). */
function tooltipLabel(_: unknown, payload: ReadonlyArray<{ payload?: { label?: string } }> | undefined) {
  return payload?.[0]?.payload?.label ?? null
}

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

  /** « janv.–sept. » : période de janvier au mois donné. */
  const periodeLabel = useCallback(
    (mois: number) => {
      const short = (m: number) => new Date(2000, m - 1, 1).toLocaleDateString(lng, { month: 'short' })
      return mois === 1 ? short(1) : `${short(1)}–${short(mois)}`
    },
    [lng],
  )

  const fixeVariableData = useMemo(() => {
    if (!stats) return []
    if (granularity === 'year') {
      return stats.years.map((y) => ({
        x: String(y.year),
        label: String(y.year),
        fixe: r0(y.fixeBrut),
        variable: r0(y.variableBrut),
        partageValeur: r0(PARTAGE_VALEUR_KEYS.reduce((s, k) => s + y.partageValeur[k].brut, 0)),
        finContrat: r0(y.finContratBrut),
        evo: y.evoFixeMensuelPct == null ? null : Math.round(y.evoFixeMensuelPct * 10) / 10,
      }))
    }
    return stats.months.map((m) => ({
      x: formatYearMonthShort(m.key, lng),
      label: formatYearMonthLabel(m.key, lng),
      fixe: r0(m.fixeBrut),
      variable: r0(m.variableBrut),
      partageValeur: r0(PARTAGE_VALEUR_KEYS.reduce((s, k) => s + m.partageValeur[k].brut, 0)),
      finContrat: r0(m.finContratBrut),
      evo: null,
    }))
  }, [stats, granularity, lng])

  const fixeVariableConfig = useMemo(
    () =>
      ({
        fixe: { label: t('salaries.stats.fixe'), color: 'var(--chart-1)' },
        variable: { label: t('salaries.stats.variable'), color: 'var(--chart-3)' },
        partageValeur: { label: t('salaries.stats.partageValeur'), color: 'var(--chart-4)' },
        finContrat: { label: t('salaries.stats.finContrat'), color: 'var(--chart-5)' },
        evo: { label: t('salaries.stats.evoFixe'), color: 'var(--chart-2)' },
      }) satisfies ChartConfig,
    [t],
  )

  const loading = stats === null && !error
  const empty = stats !== null && stats.months.length === 0

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
            label={
              last.comparaisonJusquAuMois
                ? t('salaries.stats.kpiNetEnPochePeriode', { year: last.year, periode: periodeLabel(last.comparaisonJusquAuMois) })
                : t('salaries.stats.kpiNetEnPoche', { year: last.year })
            }
            value={money(last.netEnPocheApresImpot)}
            hint={
              last.comparaisonJusquAuMois
                ? t('salaries.stats.kpiEvoPeriode', {
                    pct: formatPct(last.evoNetEnPochePct, lng),
                    periode: periodeLabel(last.comparaisonJusquAuMois),
                    year: last.year - 1,
                  })
                : t('salaries.stats.kpiEvo', { pct: formatPct(last.evoNetEnPochePct, lng) })
            }
          />
          <Kpi
            label={t('salaries.stats.kpiMoisCouverts', { year: last.year })}
            value={`${last.monthsWorked}/12`}
            hint={t('salaries.stats.kpiDernierBulletin', { mois: formatMonthLongName(last.dernierMois, lng) })}
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
                  interval={0}
                  angle={granularity === 'month' ? -60 : 0}
                  textAnchor={granularity === 'month' ? 'end' : 'middle'}
                  height={granularity === 'month' ? 56 : 32}
                  tick={{ fontSize: granularity === 'month' ? 11 : 12 }}
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
                <ChartTooltip content={<ChartTooltipContent labelFormatter={tooltipLabel} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar yAxisId="eur" dataKey="fixe" stackId="brut" fill="var(--color-fixe)" />
                <Bar yAxisId="eur" dataKey="variable" stackId="brut" fill="var(--color-variable)" />
                <Bar yAxisId="eur" dataKey="partageValeur" stackId="brut" fill="var(--color-partageValeur)" />
                <Bar
                  yAxisId="eur"
                  dataKey="finContrat"
                  stackId="brut"
                  fill="var(--color-finContrat)"
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
              <ul className="grid max-w-xl gap-1 text-sm">
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
          <CardDescription>
            {t('salaries.stats.yearTableLead')}
            {years.some((y) => y.comparaisonJusquAuMois && y.evoNetEnPochePct != null)
              ? ` ${t('salaries.stats.yearTableEvoNote')}`
              : ''}
          </CardDescription>
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
                  <TableHead className="text-right">{t('salaries.stats.finContrat')}</TableHead>
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
                    <TableCell className="text-right tabular-nums">{y.monthsWorked}/12</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.fixeBrut)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.variableBrut)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {y.finContratBrut !== 0 ? money(y.finContratBrut) : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.cotisationsSalariales)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.netPaye)}</TableCell>
                    <TableCell className="text-right tabular-nums">{money(y.titresRestaurant)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{money(y.netEnPocheApresImpot)}</TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      title={
                        y.comparaisonJusquAuMois
                          ? t('salaries.stats.evoMemePeriode', { periode: periodeLabel(y.comparaisonJusquAuMois), year: y.year - 1 })
                          : undefined
                      }
                    >
                      {formatPct(y.evoNetEnPochePct, lng)}
                      {y.comparaisonJusquAuMois && y.evoNetEnPochePct != null ? '*' : ''}
                    </TableCell>
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
