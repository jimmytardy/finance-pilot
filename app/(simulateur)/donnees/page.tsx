'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { RevenueSection } from '@/components/dashboard/revenue-section'
import { FixedExpensesSection } from '@/components/dashboard/fixed-expenses-section'
import { AnnexBudgetSection } from '@/components/dashboard/annex-budget-section'
import { RentalPropertySection } from '@/components/dashboard/rental-property-section'
import { InvestmentsSection } from '@/components/dashboard/investments-section'
import { SummaryCard } from '@/components/dashboard/summary-card'
import { Skeleton } from '@/components/ui/skeleton'
import { FinanceJsonIoToolbar } from '@/components/finance-json-io-toolbar'
import { ArrowDownRight, Scale, TrendingUp } from 'lucide-react'

export default function DataPage() {
  const { t } = useTranslation()
  const {
    data,
    isLoaded,
    // Revenue
    addRevenue,
    updateRevenue,
    deleteRevenue,
    reorderRevenue,
    // Fixed expenses
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    reorderFixedExpense,
    // Annex budgets
    addAnnexBudget,
    updateAnnexBudget,
    deleteAnnexBudget,
    reorderAnnexBudget,
    // Rental properties
    addRentalProperty,
    updateRentalProperty,
    deleteRentalProperty,
    reorderRentalProperty,
    calculateRentalNetResult,
    // Investments
    addInvestment,
    updateInvestment,
    deleteInvestment,
    // Calculated values
    totalMonthlyRevenue,
    totalFixedExpenses,
    totalAnnexBudgets,
    totalRentalNetResult,
    totalInvestmentValue,
    totalMonthlyContributions,
    availableToInvest,
  } = useFinanceData()

  const totalOutflows = totalFixedExpenses + totalAnnexBudgets + totalMonthlyContributions
  const monthlyNet = totalMonthlyRevenue + totalRentalNetResult - totalOutflows

  const categorySuggestions = useMemo(() => {
    const set = new Set<string>()
    for (const e of data.fixedExpenses) {
      const c = e.schedule?.category?.trim()
      if (c) set.add(c)
    }
    for (const b of data.annexBudgets) {
      const c = b.schedule?.category?.trim()
      if (c) set.add(c)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  }, [data.fixedExpenses, data.annexBudgets])

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <Skeleton className="mb-2 h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-balance text-3xl font-bold">{t('dataPage.title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('dataPage.subtitle')}</p>
        </header>

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard
            title={t('dataPage.liveRevenue')}
            value={totalMonthlyRevenue}
            trend="positive"
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
          />
          <SummaryCard
            title={t('dataPage.liveOutflows')}
            value={totalOutflows}
            trend="negative"
            icon={<ArrowDownRight className="h-5 w-5 text-destructive" />}
          />
          <SummaryCard
            title={t('dataPage.liveNet')}
            value={monthlyNet}
            trend={monthlyNet >= 0 ? 'positive' : 'negative'}
            icon={<Scale className="h-5 w-5 text-chart-5" />}
          />
        </section>

        {/* Revenue & Fixed Expenses */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RevenueSection
            revenues={data.revenues}
            onAdd={addRevenue}
            onUpdate={updateRevenue}
            onDelete={deleteRevenue}
            onReorder={reorderRevenue}
            totalMonthly={totalMonthlyRevenue}
          />
          <FixedExpensesSection
            expenses={data.fixedExpenses}
            onAdd={addFixedExpense}
            onUpdate={updateFixedExpense}
            onDelete={deleteFixedExpense}
            onReorder={reorderFixedExpense}
            total={totalFixedExpenses}
            categorySuggestions={categorySuggestions}
          />
        </div>

        {/* Budget Annexe */}
        <div className="mb-6">
          <AnnexBudgetSection
            budgets={data.annexBudgets}
            onAdd={addAnnexBudget}
            onUpdate={updateAnnexBudget}
            onDelete={deleteAnnexBudget}
            onReorder={reorderAnnexBudget}
            total={totalAnnexBudgets}
            categorySuggestions={categorySuggestions}
          />
        </div>

        {/* Rental Properties */}
        <div className="mb-6">
          <RentalPropertySection
            properties={data.rentalProperties}
            onAdd={addRentalProperty}
            onUpdate={updateRentalProperty}
            onDelete={deleteRentalProperty}
            onReorder={reorderRentalProperty}
            calculateNetResult={calculateRentalNetResult}
            totalNetResult={totalRentalNetResult}
          />
        </div>

        {/* Investments */}
        <div className="mb-6">
          <InvestmentsSection
            investments={data.investments}
            onAdd={addInvestment}
            onUpdate={updateInvestment}
            onDelete={deleteInvestment}
            totalValue={totalInvestmentValue}
            totalMonthlyContributions={totalMonthlyContributions}
            availableToInvest={availableToInvest}
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 space-y-4 border-t border-border pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-center text-sm text-muted-foreground sm:max-w-xl sm:text-left">
              {t('dataPage.footer')}
            </p>
            <FinanceJsonIoToolbar />
          </div>
        </footer>
      </div>
    </main>
  )
}
