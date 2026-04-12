import type { AdditionalCharge, RentalProperty } from '@/lib/types'

/** Coût mensualisé d'une charge additionnelle (% du loyer ou montant fixe). */
export function additionalChargeToMonthly(charge: AdditionalCharge, monthlyRent: number): number {
  if (charge.type === 'percentage') {
    if (monthlyRent <= 0) return 0
    return monthlyRent * (charge.value / 100)
  }
  return charge.frequency === 'annual' ? charge.value / 12 : charge.value
}

export function totalAdditionalChargesMonthly(property: RentalProperty): number {
  const list = property.additionalCharges ?? []
  const rent = property.monthlyRent ?? 0
  return list.reduce((sum, c) => sum + additionalChargeToMonthly(c, rent), 0)
}
