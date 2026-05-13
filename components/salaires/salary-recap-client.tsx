'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type YearAgg = {
  year: number
  netImposable: number
  netPaye: number
  prelevementSource: number
  fixeBrut: number
  variableBrut: number
  variableNet: number
  totalBrut: number
  totalNet: number
  totalNetHorsImpots: number
}

type Evo = {
  year: number
  netPayeMoyenSansPrelevement: number
  netPayeMoyenReel: number
  augmentationPct: number | null
}

function fmt(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function SalaryRecapClient() {
  const { t } = useTranslation()
  const [byYear, setByYear] = useState<YearAgg[]>([])
  const [evolution, setEvolution] = useState<Evo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/salaires/summary')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setByYear(data.byYear ?? [])
      setEvolution(data.evolution ?? [])
    } catch {
      toast.error(t('salaries.loadError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  const chartData = byYear.map((r) => ({
    year: String(r.year),
    netPaye: r.netPaye,
    totalNetHorsImpots: r.totalNetHorsImpots,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('salaries.recapTitle')}</CardTitle>
          <CardDescription>{t('salaries.recapLead')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('salaries.loading')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.colYear')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapNetImposable')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colNetPaye')}</TableHead>
                  <TableHead className="text-right">{t('salaries.colPrelevement')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapFixeBrut')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapVariableBrut')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapVariableNet')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapTotalBrut')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapTotalNet')}</TableHead>
                  <TableHead className="text-right">{t('salaries.recapTotalNetHorsImpots')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byYear.map((r) => (
                  <TableRow key={r.year}>
                    <TableCell>{r.year}</TableCell>
                    <TableCell className="text-right">{fmt(r.netImposable)}</TableCell>
                    <TableCell className="text-right">{fmt(r.netPaye)}</TableCell>
                    <TableCell className="text-right">{fmt(r.prelevementSource)}</TableCell>
                    <TableCell className="text-right">{fmt(r.fixeBrut)}</TableCell>
                    <TableCell className="text-right">{fmt(r.variableBrut)}</TableCell>
                    <TableCell className="text-right">{fmt(r.variableNet)}</TableCell>
                    <TableCell className="text-right">{fmt(r.totalBrut)}</TableCell>
                    <TableCell className="text-right">{fmt(r.totalNet)}</TableCell>
                    <TableCell className="text-right">{fmt(r.totalNetHorsImpots)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('salaries.evolutionTitle')}</CardTitle>
          <CardDescription>{t('salaries.evolutionLead')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!loading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.colYear')}</TableHead>
                  <TableHead className="text-right">{t('salaries.evoSansPrel')}</TableHead>
                  <TableHead className="text-right">{t('salaries.evoReel')}</TableHead>
                  <TableHead className="text-right">{t('salaries.evoAugmentation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evolution.map((r) => (
                  <TableRow key={r.year}>
                    <TableCell>{r.year}</TableCell>
                    <TableCell className="text-right">{fmt(r.netPayeMoyenSansPrelevement)}</TableCell>
                    <TableCell className="text-right">{fmt(r.netPayeMoyenReel)}</TableCell>
                    <TableCell className="text-right">
                      {r.augmentationPct == null ? '—' : `${r.augmentationPct.toFixed(1)} %`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('salaries.chartTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          {!loading && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="netPaye" name={t('salaries.colNetPaye')} fill="hsl(var(--primary))" />
                <Bar dataKey="totalNetHorsImpots" name={t('salaries.recapTotalNetHorsImpots')} fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            !loading && <p className="text-sm text-muted-foreground">{t('salaries.noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
