'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { Navigation } from '@/components/navigation'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { BreakdownChart } from '@/components/dashboard/breakdown-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TrendingUp,
  PiggyBank,
  Home,
  ArrowDownRight,
  LineChart as LineChartIcon,
  Building2,
  Scale,
} from 'lucide-react'
import { totalAdditionalChargesMonthly } from '@/lib/rental-charges'
import { buildInvestmentProjectionSeries } from '@/lib/investment-projection'
import type { RentalPropertyAddress } from '@/lib/types'
import { formatCompactAmount, formatCurrencyAmount, projectionYearLabel } from '@/lib/i18n/locale'

function formatRentalAddress(address: RentalPropertyAddress): string | null {
  const street = address.street.trim()
  const line2 = [address.postalCode.trim(), address.city.trim()].filter(Boolean).join(' ')
  if (!street && !line2) return null
  return [street, line2].filter(Boolean).join('\n')
}

export default function EstimationsPage() {
  const { t, i18n } = useTranslation()
  const {
    data,
    isLoaded,
    calculateRentalNetResult,
    totalMonthlyRevenue,
    totalFixedExpenses,
    totalAnnexBudgets,
    totalRentalNetResult,
    totalInvestmentValue,
    totalMonthlyContributions,
    availableToInvest,
  } = useFinanceData()

  const [projectionYears, setProjectionYears] = useState<10 | 20 | 30>(20)

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)
  const formatCompact = (amount: number) => formatCompactAmount(amount, i18n.language)

  const projectionData = useMemo(() => {
    return buildInvestmentProjectionSeries(data.investments, projectionYears).map((p) => ({
      year: projectionYearLabel(t, p.year),
      value: p.portfolioValue,
      contributions: p.contributions,
      gains: p.gains,
    }))
  }, [data.investments, projectionYears, t, i18n.language])

  const rentalSummary = useMemo(() => {
    const toMonthly = (expense: { amount: number; frequency: 'monthly' | 'annual' }) => {
      return expense.frequency === 'annual' ? expense.amount / 12 : expense.amount
    }

    return data.rentalProperties.map((property) => {
      const netResult = calculateRentalNetResult(property)
      const monthlyCondoFees = toMonthly(property.condoFees)
      const monthlyTax = toMonthly(property.propertyTax)
      const monthlyHomeInsurance = toMonthly(property.homeInsurance)
      const monthlyBorrowerInsurance = toMonthly(property.borrowerInsurance)
      const monthlyOtherInsurance = toMonthly(property.otherInsurance)
      const monthlyLoanPayment = toMonthly(property.loanPayment)

      let maintenanceAmount: number
      if (property.maintenanceReserve.type === 'percentage') {
        maintenanceAmount = property.monthlyRent * (property.maintenanceReserve.value / 100)
      } else {
        maintenanceAmount =
          property.maintenanceReserve.frequency === 'annual'
            ? property.maintenanceReserve.value / 12
            : property.maintenanceReserve.value
      }

      const additionalMonthly = totalAdditionalChargesMonthly(property)
      const totalCosts =
        monthlyCondoFees +
        monthlyTax +
        monthlyHomeInsurance +
        monthlyBorrowerInsurance +
        monthlyOtherInsurance +
        monthlyLoanPayment +
        maintenanceAmount +
        additionalMonthly

      return {
        name: property.name,
        loyer: property.monthlyRent,
        charges: totalCosts,
        net: netResult,
      }
    })
  }, [data.rentalProperties, calculateRentalNetResult])

  const expenseBreakdownData = useMemo(
    () =>
      [
        { name: t('estimations.chartFixed'), value: totalFixedExpenses },
        { name: t('estimations.chartAnnex'), value: totalAnnexBudgets },
        { name: t('estimations.chartInvestments'), value: totalMonthlyContributions },
      ].filter((item) => item.value > 0),
    [t, totalFixedExpenses, totalAnnexBudgets, totalMonthlyContributions, i18n.language],
  )

  const incomeBreakdownData = useMemo(
    () =>
      [
        { name: t('estimations.chartRevenue'), value: totalMonthlyRevenue },
        { name: t('estimations.chartRental'), value: Math.max(0, totalRentalNetResult) },
      ].filter((item) => item.value > 0),
    [t, totalMonthlyRevenue, totalRentalNetResult, i18n.language],
  )

  const totalOutflows = totalFixedExpenses + totalAnnexBudgets + totalMonthlyContributions
  const totalInflows = totalMonthlyRevenue + (totalRentalNetResult > 0 ? totalRentalNetResult : 0)
  const monthlyBalance = totalInflows - totalOutflows + (totalRentalNetResult < 0 ? totalRentalNetResult : 0)

  const annualSavings = availableToInvest * 12
  const projectedValueEnd = projectionData[projectionData.length - 1]?.value || 0
  const projectedGains = projectionData[projectionData.length - 1]?.gains || 0

  const chartConfig = useMemo(
    () => ({
      value: { label: t('estimations.chartTotalValue'), color: 'var(--chart-1)' },
      contributions: { label: t('estimations.chartContributions'), color: 'var(--chart-2)' },
      gains: { label: t('estimations.chartGains'), color: 'var(--chart-3)' },
      loyer: { label: t('estimations.chartRent'), color: 'var(--chart-1)' },
      charges: { label: t('estimations.chartCharges'), color: 'var(--chart-4)' },
      net: { label: t('estimations.netResultShort'), color: 'var(--chart-5)' },
    }),
    [t, i18n.language],
  )

  const rentalSubtitle =
    data.rentalProperties.length > 0
      ? t('estimations.rentalCount', { count: data.rentalProperties.length })
      : undefined

  if (!isLoaded) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
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
            <h1 className="text-3xl font-bold text-balance">{t('estimations.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('estimations.subtitle')}</p>
          </header>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard
              title={t('estimations.monthlyRevenue')}
              value={totalMonthlyRevenue}
              trend="positive"
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
            />
            <SummaryCard
              title={t('estimations.totalExpenses')}
              value={totalOutflows}
              subtitle={t('estimations.fixedChargesSubtitle', { amount: formatCurrency(totalFixedExpenses) })}
              trend="negative"
              icon={<ArrowDownRight className="h-5 w-5 text-destructive" />}
            />
            <SummaryCard
              title={t('estimations.rentalNet')}
              value={totalRentalNetResult}
              subtitle={rentalSubtitle}
              trend={totalRentalNetResult >= 0 ? 'positive' : 'negative'}
              icon={<Home className="h-5 w-5 text-chart-4" />}
            />
            <SummaryCard
              title={t('estimations.availableForInvesting')}
              value={availableToInvest}
              subtitle={t('estimations.portfolioSubtitle', { amount: formatCurrency(totalInvestmentValue) })}
              trend={availableToInvest >= 0 ? 'positive' : 'negative'}
              icon={<PiggyBank className="h-5 w-5 text-chart-5" />}
            />
          </section>

          <section className="mb-8">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Scale className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('estimations.monthlyBalance')}</p>
                      <p
                        className={`text-3xl font-bold font-mono ${monthlyBalance >= 0 ? 'text-primary' : 'text-destructive'}`}
                      >
                        {formatCurrency(monthlyBalance)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center md:text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('estimations.entries')}</p>
                      <p className="font-mono font-semibold text-primary">{formatCurrency(totalInflows)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('estimations.exits')}</p>
                      <p className="font-mono font-semibold text-destructive">{formatCurrency(totalOutflows)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('estimations.annualSavings')}</p>
                      <p className="font-mono font-semibold">{formatCurrency(annualSavings)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <BreakdownChart data={expenseBreakdownData} title={t('estimations.breakdownExpenses')} />
            <BreakdownChart data={incomeBreakdownData} title={t('estimations.breakdownIncome')} />
          </div>

          {data.rentalProperties.length > 0 && (
            <Card className="bg-card border-border mb-8">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-4/10">
                    <Building2 className="h-5 w-5 text-chart-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{t('estimations.rentalSynthTitle')}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t('estimations.rentalSynthSubtitle', {
                        amount: `${formatCurrency(totalRentalNetResult)}${t('common.perMonth')}`,
                      })}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart data={rentalSummary} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCompact(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={90}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Bar
                      dataKey="loyer"
                      fill="var(--chart-1)"
                      radius={[0, 4, 4, 0]}
                      name={t('estimations.chartRent')}
                    />
                    <Bar
                      dataKey="charges"
                      fill="var(--chart-4)"
                      radius={[0, 4, 4, 0]}
                      name={t('estimations.chartCharges')}
                    />
                  </BarChart>
                </ChartContainer>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.rentalProperties.map((property) => {
                    const netResult = calculateRentalNetResult(property)
                    const addressText = formatRentalAddress(property.address)
                    return (
                      <div key={property.id} className="p-4 rounded-lg bg-secondary/50">
                        <h4 className="font-medium">{property.name}</h4>
                        {addressText && (
                          <p className="text-xs text-muted-foreground mt-1 mb-2 whitespace-pre-line">
                            {addressText}
                          </p>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{t('estimations.rentShort')}</span>
                          <span className="font-mono">{formatCurrency(property.monthlyRent)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-muted-foreground">{t('estimations.netResultShort')}</span>
                          <span className={`font-mono font-medium ${netResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            {formatCurrency(netResult)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {data.investments.length > 0 && (
            <Card className="bg-card border-border mb-8">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LineChartIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">{t('estimations.projectionTitle')}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t('estimations.projectionSubtitle', { amount: formatCurrency(totalInvestmentValue) })}
                    </p>
                  </div>
                </div>
                <Tabs value={projectionYears.toString()} onValueChange={(v) => setProjectionYears(Number(v) as 10 | 20 | 30)}>
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
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValueEstim" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${formatCompact(value)}\u00a0€`}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#colorValueEstim)"
                      name={t('estimations.chartTotalValue')}
                    />
                  </AreaChart>
                </ChartContainer>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">
                      {t('estimations.valueInYears', { years: projectionYears })}
                    </p>
                    <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(projectedValueEnd)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">{t('estimations.estimatedGains')}</p>
                    <p className="text-2xl font-bold font-mono text-chart-3">{formatCurrency(projectedGains)}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground mb-1">{t('estimations.monthlyContributions')}</p>
                    <p className="text-2xl font-bold font-mono">{formatCurrency(totalMonthlyContributions)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">{t('estimations.detailByLine')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.investments.map((inv) => (
                      <div key={inv.id} className="p-3 rounded-lg bg-secondary/50 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{inv.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('estimations.detailLineMeta', {
                              contrib: formatCurrency(inv.monthlyContribution),
                              return: inv.annualReturn,
                            })}
                          </p>
                        </div>
                        <p className="font-mono font-semibold text-chart-5">{formatCurrency(inv.currentValue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.investments.length === 0 && (
            <Card className="bg-card border-border mb-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PiggyBank className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{t('estimations.noInvestmentsTitle')}</p>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  {t('estimations.noInvestmentsBody')}
                </p>
              </CardContent>
            </Card>
          )}

          <footer className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>{t('estimations.footerDisclaimer')}</p>
          </footer>
        </div>
      </main>
    </>
  )
}
