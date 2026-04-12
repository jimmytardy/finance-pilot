import type { AnnexBudget, ExpenseSchedule, FinanceData, FixedExpense, Investment, Revenue } from '@/lib/types'
import { EXAMPLE_FINANCE_DATA } from '@/lib/finance-defaults'
import fr from '@/locales/fr.json'
import en from '@/locales/en.json'

type ExampleFinanceJson = {
  revenueNet: string
  fixRent: string
  fixElectricity: string
  fixWater: string
  fixInternet: string
  fixPhone: string
  fixHomeInsurance: string
  fixHealth: string
  fixTransport: string
  fixBankFees: string
  annTravel: string
  annLeisure: string
  annSport: string
  annGroceries: string
  annCulture: string
  invPea: string
  exScheduleCatHousing: string
  exScheduleCatEnergy: string
  exScheduleCatTelecom: string
  exScheduleCatInsurance: string
  exScheduleCatTransport: string
  exScheduleCatBank: string
  exScheduleCatTravel: string
  exScheduleCatLeisure: string
  exScheduleCatSport: string
  exScheduleCatGroceries: string
  exScheduleCatCulture: string
}

function readLabels(locale: string): ExampleFinanceJson {
  const pack = (locale.startsWith('en') ? en : fr) as { exampleFinance: ExampleFinanceJson }
  return pack.exampleFinance
}

function sch(category: string, paymentMode: ExpenseSchedule['paymentMode'], dayOfMonth: number): ExpenseSchedule {
  return { category, paymentMode, dayOfMonth }
}

/** Données d’exemple (~2 000 €/mois) avec libellés selon la langue d’affichage. */
export function getLocalizedExampleFinanceData(locale: string): FinanceData {
  const L = readLabels(locale)
  return {
    revenues: [
      {
        id: 'ex-rev-salaire',
        label: L.revenueNet,
        amount: 2000,
        frequency: 'monthly',
      },
    ],
    fixedExpenses: [
      {
        id: 'ex-fix-loyer',
        label: L.fixRent,
        amount: 600,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatHousing, 'automatic', 5),
      },
      {
        id: 'ex-fix-elec',
        label: L.fixElectricity,
        amount: 85,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatEnergy, 'automatic', 10),
      },
      {
        id: 'ex-fix-eau',
        label: L.fixWater,
        amount: 25,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatEnergy, 'automatic', 12),
      },
      {
        id: 'ex-fix-internet',
        label: L.fixInternet,
        amount: 25,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatTelecom, 'automatic', 15),
      },
      {
        id: 'ex-fix-mobile',
        label: L.fixPhone,
        amount: 10,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatTelecom, 'automatic', 15),
      },
      {
        id: 'ex-fix-ass-hab',
        label: L.fixHomeInsurance,
        amount: 22,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatInsurance, 'automatic', 3),
      },
      {
        id: 'ex-fix-mutuelle',
        label: L.fixHealth,
        amount: 45,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatInsurance, 'automatic', 8),
      },
      {
        id: 'ex-fix-transport',
        label: L.fixTransport,
        amount: 75,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatTransport, 'manual', 1),
      },
      {
        id: 'ex-fix-banque',
        label: L.fixBankFees,
        amount: 8,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatBank, 'automatic', 28),
      },
    ],
    annexBudgets: [
      {
        id: 'ex-ann-voyage',
        label: L.annTravel,
        amount: 150,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatTravel, 'manual', 25),
      },
      {
        id: 'ex-ann-loisirs',
        label: L.annLeisure,
        amount: 120,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatLeisure, 'manual', 5),
      },
      {
        id: 'ex-ann-sport',
        label: L.annSport,
        amount: 50,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatSport, 'automatic', 10),
      },
      {
        id: 'ex-ann-courses',
        label: L.annGroceries,
        amount: 380,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatGroceries, 'automatic', 5),
      },
      {
        id: 'ex-ann-culture',
        label: L.annCulture,
        amount: 25,
        frequency: 'monthly',
        schedule: sch(L.exScheduleCatCulture, 'automatic', 20),
      },
    ],
    rentalProperties: [],
    investments: [
      {
        id: 'ex-inv-pea',
        label: L.invPea,
        currentValue: 2500,
        monthlyContribution: 150,
        annualReturn: 6,
      },
    ],
  }
}

function revenueFingerprint(r: Revenue) {
  return `${r.id}|${r.amount}|${r.frequency}`
}

function fixedFingerprint(e: FixedExpense) {
  return `${e.id}|${e.amount}|${e.frequency}`
}

function annexFingerprint(b: AnnexBudget) {
  return `${b.id}|${b.amount}|${b.frequency}`
}

function invFingerprint(i: Investment) {
  return `${i.id}|${i.currentValue}|${i.monthlyContribution}|${i.annualReturn}`
}

/** Indique si les montants / fréquences / ids correspondent au modèle d’exemple livré avec l’app (libellés ignorés). */
export function matchesBuiltInExample(data: FinanceData): boolean {
  const ref = EXAMPLE_FINANCE_DATA
  if (data.rentalProperties.length !== ref.rentalProperties.length) return false
  if (data.revenues.length !== ref.revenues.length) return false
  if (data.fixedExpenses.length !== ref.fixedExpenses.length) return false
  if (data.annexBudgets.length !== ref.annexBudgets.length) return false
  if (data.investments.length !== ref.investments.length) return false

  const refRev = [...ref.revenues].map(revenueFingerprint).sort().join(';')
  const dataRev = [...data.revenues].map(revenueFingerprint).sort().join(';')
  if (refRev !== dataRev) return false

  const refFix = [...ref.fixedExpenses].map(fixedFingerprint).sort().join(';')
  const dataFix = [...data.fixedExpenses].map(fixedFingerprint).sort().join(';')
  if (refFix !== dataFix) return false

  const refAnn = [...ref.annexBudgets].map(annexFingerprint).sort().join(';')
  const dataAnn = [...data.annexBudgets].map(annexFingerprint).sort().join(';')
  if (refAnn !== dataAnn) return false

  const refInv = [...ref.investments].map(invFingerprint).sort().join(';')
  const dataInv = [...data.investments].map(invFingerprint).sort().join(';')
  return refInv === dataInv
}
