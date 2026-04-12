import type { RentalProperty } from '@/lib/types'
import { totalAdditionalChargesMonthly } from '@/lib/rental-charges'

function toMonthly(expense: { amount: number; frequency: 'monthly' | 'annual' }) {
  return expense.frequency === 'annual' ? expense.amount / 12 : expense.amount
}

function maintenanceReserveMonthly(property: RentalProperty) {
  const { maintenanceReserve } = property
  if (maintenanceReserve.type === 'percentage') {
    return property.monthlyRent * (maintenanceReserve.value / 100)
  }
  return maintenanceReserve.frequency === 'annual'
    ? maintenanceReserve.value / 12
    : maintenanceReserve.value
}

/** Résultat net locatif mensuel (loyer − charges), aligné sur le tableau de bord. */
export function computeRentalNetMonthly(property: RentalProperty): number {
  const monthlyCondoFees = toMonthly(property.condoFees)
  const monthlyTax = toMonthly(property.propertyTax)
  const monthlyHomeInsurance = toMonthly(property.homeInsurance)
  const monthlyBorrowerInsurance = toMonthly(property.borrowerInsurance)
  const monthlyOtherInsurance = toMonthly(property.otherInsurance)
  const monthlyLoanPayment = toMonthly(property.loanPayment)
  const maintenanceReserve = maintenanceReserveMonthly(property)
  const additionalMonthly = totalAdditionalChargesMonthly(property)

  const totalCosts =
    monthlyCondoFees +
    monthlyTax +
    monthlyHomeInsurance +
    monthlyBorrowerInsurance +
    monthlyOtherInsurance +
    monthlyLoanPayment +
    maintenanceReserve +
    additionalMonthly

  return property.monthlyRent - totalCosts
}
