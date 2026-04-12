export interface Revenue {
  id: string
  label: string
  amount: number
  frequency: 'monthly' | 'annual'
}

/** Planification mensuelle (charges fixes & budgets annexes) pour le suivi avancé. */
export interface ExpenseSchedule {
  category: string
  /** Manuel = virement / paiement à faire ; automatique = prélèvement à date. */
  paymentMode: 'manual' | 'automatic'
  /** Jour du mois prévu (1–31 ; adapté au nombre de jours du mois à l’usage). */
  dayOfMonth: number
}

export interface FixedExpense {
  id: string
  label: string
  amount: number
  frequency: 'monthly' | 'annual'
  schedule?: ExpenseSchedule
}

export interface AnnexBudget {
  id: string
  label: string
  amount: number
  frequency: 'monthly' | 'annual'
  schedule?: ExpenseSchedule
}

export type Frequency = 'monthly' | 'annual'

export interface RentalPropertyExpense {
  amount: number
  frequency: Frequency
}

export interface MaintenanceReserve {
  type: 'percentage' | 'fixed'
  value: number
  frequency: Frequency
}

/** Charge libellée (agence, comptable…). `fixed` = EUR / mois ou / an ; `percentage` = % du loyer mensuel. */
export interface AdditionalCharge {
  id: string
  label: string
  type: 'percentage' | 'fixed'
  value: number
  frequency: Frequency
}

export interface RentalPropertyAddress {
  street: string
  postalCode: string
  city: string
}

export interface RentalProperty {
  id: string
  name: string
  address: RentalPropertyAddress
  monthlyRent: number
  condoFees: RentalPropertyExpense
  propertyTax: RentalPropertyExpense
  homeInsurance: RentalPropertyExpense
  borrowerInsurance: RentalPropertyExpense
  otherInsurance: RentalPropertyExpense
  loanPayment: RentalPropertyExpense
  maintenanceReserve: MaintenanceReserve
  additionalCharges: AdditionalCharge[]
}

export interface Investment {
  id: string
  label: string
  currentValue: number
  monthlyContribution: number
  annualReturn: number
}

export interface FinanceData {
  revenues: Revenue[]
  fixedExpenses: FixedExpense[]
  annexBudgets: AnnexBudget[]
  rentalProperties: RentalProperty[]
  investments: Investment[]
}

/** Instantané nommé des données financières (liste gérée à part du brouillon auto-sauvegardé). */
export interface SavedProject {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  data: FinanceData
}
