import type { ExpenseSchedule, FinanceData } from '@/lib/types'

const sch = (category: string, paymentMode: ExpenseSchedule['paymentMode'], dayOfMonth: number): ExpenseSchedule => ({
  category,
  paymentMode,
  dayOfMonth,
})

/** Jeu vide (réinitialisation, données invalides). */
export const EMPTY_FINANCE_DATA: FinanceData = {
  revenues: [],
  fixedExpenses: [],
  annexBudgets: [],
  rentalProperties: [],
  investments: [],
}

/**
 * Exemple cohérent avec un salaire net d’environ 2 000 €/mois : charges courantes,
 * enveloppes budget annexe et épargne type PEA.
 */
export const EXAMPLE_FINANCE_DATA: FinanceData = {
  revenues: [
    {
      id: 'ex-rev-salaire',
      label: 'Salaire net',
      amount: 2000,
      frequency: 'monthly',
    },
  ],
  fixedExpenses: [
    { id: 'ex-fix-loyer', label: 'Loyer', amount: 600, frequency: 'monthly', schedule: sch('Logement', 'automatic', 5) },
    { id: 'ex-fix-elec', label: 'Électricité', amount: 85, frequency: 'monthly', schedule: sch('Énergie & eau', 'automatic', 10) },
    { id: 'ex-fix-eau', label: 'Eau', amount: 25, frequency: 'monthly', schedule: sch('Énergie & eau', 'automatic', 12) },
    { id: 'ex-fix-internet', label: 'Abonnement internet', amount: 25, frequency: 'monthly', schedule: sch('Télécommunications', 'automatic', 15) },
    { id: 'ex-fix-mobile', label: 'Abonnement téléphone', amount: 10, frequency: 'monthly', schedule: sch('Télécommunications', 'automatic', 15) },
    { id: 'ex-fix-ass-hab', label: 'Assurance habitation', amount: 22, frequency: 'monthly', schedule: sch('Assurances', 'automatic', 3) },
    { id: 'ex-fix-mutuelle', label: 'Mutuelle santé', amount: 45, frequency: 'monthly', schedule: sch('Assurances', 'automatic', 8) },
    { id: 'ex-fix-transport', label: 'Transports (Navigo, carburant…)', amount: 75, frequency: 'monthly', schedule: sch('Mobilité', 'manual', 1) },
    { id: 'ex-fix-banque', label: 'Frais bancaires', amount: 8, frequency: 'monthly', schedule: sch('Banque', 'automatic', 28) },
  ],
  annexBudgets: [
    { id: 'ex-ann-voyage', label: 'Voyages', amount: 150, frequency: 'monthly', schedule: sch('Voyages', 'manual', 25) },
    { id: 'ex-ann-loisirs', label: 'Loisirs & sorties', amount: 120, frequency: 'monthly', schedule: sch('Loisirs', 'manual', 5) },
    { id: 'ex-ann-sport', label: 'Sport & bien-être', amount: 50, frequency: 'monthly', schedule: sch('Sport & bien-être', 'automatic', 10) },
    { id: 'ex-ann-courses', label: 'Courses & alimentation', amount: 380, frequency: 'monthly', schedule: sch('Alimentation', 'automatic', 5) },
    { id: 'ex-ann-culture', label: 'Culture & abonnements', amount: 25, frequency: 'monthly', schedule: sch('Culture', 'automatic', 20) },
  ],
  rentalProperties: [],
  investments: [
    {
      id: 'ex-inv-pea',
      label: 'PEA (actions / ETF)',
      currentValue: 2500,
      monthlyContribution: 150,
      annualReturn: 6,
    },
  ],
}

/** Valeur de départ de l’app et modèle pour un premier usage. */
export const DEFAULT_FINANCE_DATA: FinanceData = structuredClone(EXAMPLE_FINANCE_DATA)

export function isFinanceDataEmpty(d: FinanceData): boolean {
  return (
    d.revenues.length === 0 &&
    d.fixedExpenses.length === 0 &&
    d.annexBudgets.length === 0 &&
    d.rentalProperties.length === 0 &&
    d.investments.length === 0
  )
}
