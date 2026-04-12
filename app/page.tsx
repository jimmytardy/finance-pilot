'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFinanceData } from '@/hooks/use-finance-data'
import { Navigation } from '@/components/navigation'
import { RevenueSection } from '@/components/dashboard/revenue-section'
import { FixedExpensesSection } from '@/components/dashboard/fixed-expenses-section'
import { AnnexBudgetSection } from '@/components/dashboard/annex-budget-section'
import { RentalPropertySection } from '@/components/dashboard/rental-property-section'
import { InvestmentsSection } from '@/components/dashboard/investments-section'
import { Skeleton } from '@/components/ui/skeleton'
import { FinanceJsonIoToolbar } from '@/components/finance-json-io-toolbar'

export default function DataPage() {
  const { t } = useTranslation()
  const {
    data,
    isLoaded,
    // Revenue
    addRevenue,
    updateRevenue,
    deleteRevenue,
    // Fixed expenses
    addFixedExpense,
    updateFixedExpense,
    deleteFixedExpense,
    // Annex budgets
    addAnnexBudget,
    updateAnnexBudget,
    deleteAnnexBudget,
    // Rental properties
    addRentalProperty,
    updateRentalProperty,
    deleteRentalProperty,
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
      <>
        <Navigation />
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-64" />
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
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-balance">{t('dataPage.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dataPage.subtitle')}</p>
          </header>

          {/* Revenue & Fixed Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RevenueSection
              revenues={data.revenues}
              onAdd={addRevenue}
              onUpdate={updateRevenue}
              onDelete={deleteRevenue}
              totalMonthly={totalMonthlyRevenue}
            />
            <FixedExpensesSection
              expenses={data.fixedExpenses}
              onAdd={addFixedExpense}
              onUpdate={updateFixedExpense}
              onDelete={deleteFixedExpense}
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
    </>
  )
}
