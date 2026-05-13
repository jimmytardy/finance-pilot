import type { FinanceData } from '@/lib/types'
import { toMonthlyCashflowAmount } from '@/lib/cashflow-frequency'
import { computeRentalNetMonthly } from '@/lib/rental-net'

/** Agrégats mensuels dérivés des données financières (même logique que le contexte). */
export function getFinanceMetrics(data: FinanceData) {
  const totalMonthlyRevenue = data.revenues.reduce((sum, r) => {
    return sum + toMonthlyCashflowAmount(r.amount, r.frequency)
  }, 0)

  const totalFixedExpenses = data.fixedExpenses.reduce((sum, e) => {
    return sum + toMonthlyCashflowAmount(e.amount, e.frequency)
  }, 0)

  const totalAnnexBudgets = data.annexBudgets.reduce((sum, b) => {
    return sum + toMonthlyCashflowAmount(b.amount, b.frequency)
  }, 0)

  const totalRentalNetResult = data.rentalProperties.reduce(
    (sum, p) => sum + computeRentalNetMonthly(p),
    0,
  )

  const totalRentalSecurityReserve = data.rentalProperties.reduce((sum, p) => {
    return sum + p.monthlyRent * 2
  }, 0)

  const totalInvestmentValue = data.investments.reduce((sum, i) => sum + i.currentValue, 0)

  const totalMonthlyContributions = data.investments.reduce((sum, i) => sum + i.monthlyContribution, 0)

  const availableToInvest =
    totalMonthlyRevenue -
    totalFixedExpenses -
    totalAnnexBudgets +
    totalRentalNetResult -
    totalMonthlyContributions

  const totalOutflows = totalFixedExpenses + totalAnnexBudgets + totalMonthlyContributions
  const totalInflows = totalMonthlyRevenue + Math.max(0, totalRentalNetResult)
  const monthlyBalance =
    totalInflows - totalOutflows + (totalRentalNetResult < 0 ? totalRentalNetResult : 0)

  return {
    totalMonthlyRevenue,
    totalFixedExpenses,
    totalAnnexBudgets,
    totalRentalNetResult,
    totalRentalSecurityReserve,
    totalInvestmentValue,
    totalMonthlyContributions,
    availableToInvest,
    monthlyBalance,
  }
}
