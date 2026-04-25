'use client'

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import type {
  AnnexBudget,
  FinanceData,
  FixedExpense,
  Investment,
  RentalProperty,
  Revenue,
} from '@/lib/types'
import { normalizeFinanceData } from '@/lib/normalize-finance-data'
import { getFinanceMetrics } from '@/lib/finance-metrics'
import { computeRentalNetMonthly } from '@/lib/rental-net'
import i18n from '@/lib/i18n/i18n'
import { getLocalizedExampleFinanceData } from '@/lib/example-finance-localized'
import { useSimulatorWorkspace } from '@/contexts/simulator-workspace-context'

function reorderByIds<T extends { id: string }>(list: T[], activeId: string, overId: string): T[] {
  const from = list.findIndex((item) => item.id === activeId)
  const to = list.findIndex((item) => item.id === overId)
  if (from === -1 || to === -1 || from === to) return list
  const next = [...list]
  const [row] = next.splice(from, 1)
  next.splice(to, 0, row)
  return next
}

type FinanceDataContextValue = {
  data: FinanceData
  isLoaded: boolean
  importFinanceData: (next: FinanceData) => void
  startNewDraft: () => void
  addRevenue: (revenue: Omit<Revenue, 'id'>) => void
  updateRevenue: (id: string, updates: Partial<Revenue>) => void
  deleteRevenue: (id: string) => void
  moveRevenue: (id: string, direction: 'up' | 'down') => void
  addFixedExpense: (expense: Omit<FixedExpense, 'id'>) => void
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void
  deleteFixedExpense: (id: string) => void
  moveFixedExpense: (id: string, direction: 'up' | 'down') => void
  reorderRevenue: (activeId: string, overId: string) => void
  reorderFixedExpense: (activeId: string, overId: string) => void
  reorderAnnexBudget: (activeId: string, overId: string) => void
  addAnnexBudget: (budget: Omit<AnnexBudget, 'id'>) => void
  updateAnnexBudget: (id: string, updates: Partial<AnnexBudget>) => void
  deleteAnnexBudget: (id: string) => void
  addRentalProperty: (property: Omit<RentalProperty, 'id'>) => void
  updateRentalProperty: (id: string, updates: Partial<RentalProperty>) => void
  deleteRentalProperty: (id: string) => void
  reorderRentalProperty: (activeId: string, overId: string) => void
  addInvestment: (investment: Omit<Investment, 'id'>) => void
  updateInvestment: (id: string, updates: Partial<Investment>) => void
  deleteInvestment: (id: string) => void
  calculateRentalNetResult: (property: RentalProperty) => number
  totalMonthlyRevenue: number
  totalFixedExpenses: number
  totalAnnexBudgets: number
  totalRentalNetResult: number
  totalRentalSecurityReserve: number
  totalInvestmentValue: number
  totalMonthlyContributions: number
  availableToInvest: number
}

const FinanceDataContext = createContext<FinanceDataContextValue | null>(null)

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { financeData: data, financeLoaded: isLoaded, setFinanceData: setData } = useSimulatorWorkspace()

  const importFinanceData = useCallback((next: FinanceData) => {
    setData(normalizeFinanceData(next))
  }, [setData])

  const startNewDraft = useCallback(() => {
    setData(structuredClone(getLocalizedExampleFinanceData(i18n.language)))
  }, [setData])

  const addRevenue = useCallback((revenue: Omit<Revenue, 'id'>) => {
    const newRevenue: Revenue = { ...revenue, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, revenues: [...prev.revenues, newRevenue] }))
  }, [setData])

  const updateRevenue = useCallback((id: string, updates: Partial<Revenue>) => {
    setData((prev) => ({
      ...prev,
      revenues: prev.revenues.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  }, [setData])

  const deleteRevenue = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      revenues: prev.revenues.filter((r) => r.id !== id),
    }))
  }, [setData])

  const moveRevenue = useCallback((id: string, direction: 'up' | 'down') => {
    setData((prev) => {
      const index = prev.revenues.findIndex((r) => r.id === id)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.revenues.length) return prev
      const next = [...prev.revenues]
      const [row] = next.splice(index, 1)
      next.splice(targetIndex, 0, row)
      return { ...prev, revenues: next }
    })
  }, [setData])

  const reorderRevenue = useCallback((activeId: string, overId: string) => {
    setData((prev) => {
      const next = reorderByIds(prev.revenues, activeId, overId)
      if (next === prev.revenues) return prev
      return { ...prev, revenues: next }
    })
  }, [setData])

  const addFixedExpense = useCallback((expense: Omit<FixedExpense, 'id'>) => {
    const newExpense: FixedExpense = { ...expense, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, fixedExpenses: [...prev.fixedExpenses, newExpense] }))
  }, [setData])

  const updateFixedExpense = useCallback((id: string, updates: Partial<FixedExpense>) => {
    setData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }))
  }, [setData])

  const deleteFixedExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((e) => e.id !== id),
    }))
  }, [setData])

  const moveFixedExpense = useCallback((id: string, direction: 'up' | 'down') => {
    setData((prev) => {
      const index = prev.fixedExpenses.findIndex((e) => e.id === id)
      if (index === -1) return prev
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.fixedExpenses.length) return prev
      const next = [...prev.fixedExpenses]
      const [row] = next.splice(index, 1)
      next.splice(targetIndex, 0, row)
      return { ...prev, fixedExpenses: next }
    })
  }, [setData])

  const reorderFixedExpense = useCallback((activeId: string, overId: string) => {
    setData((prev) => {
      const next = reorderByIds(prev.fixedExpenses, activeId, overId)
      if (next === prev.fixedExpenses) return prev
      return { ...prev, fixedExpenses: next }
    })
  }, [setData])

  const addAnnexBudget = useCallback((budget: Omit<AnnexBudget, 'id'>) => {
    const newBudget: AnnexBudget = { ...budget, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, annexBudgets: [...prev.annexBudgets, newBudget] }))
  }, [setData])

  const updateAnnexBudget = useCallback((id: string, updates: Partial<AnnexBudget>) => {
    setData((prev) => ({
      ...prev,
      annexBudgets: prev.annexBudgets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }))
  }, [setData])

  const deleteAnnexBudget = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      annexBudgets: prev.annexBudgets.filter((b) => b.id !== id),
    }))
  }, [setData])

  const reorderAnnexBudget = useCallback((activeId: string, overId: string) => {
    setData((prev) => {
      const next = reorderByIds(prev.annexBudgets, activeId, overId)
      if (next === prev.annexBudgets) return prev
      return { ...prev, annexBudgets: next }
    })
  }, [setData])

  const addRentalProperty = useCallback((property: Omit<RentalProperty, 'id'>) => {
    const newProperty: RentalProperty = { ...property, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, rentalProperties: [...prev.rentalProperties, newProperty] }))
  }, [setData])

  const updateRentalProperty = useCallback((id: string, updates: Partial<RentalProperty>) => {
    setData((prev) => ({
      ...prev,
      rentalProperties: prev.rentalProperties.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }, [setData])

  const deleteRentalProperty = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      rentalProperties: prev.rentalProperties.filter((p) => p.id !== id),
    }))
  }, [setData])

  const reorderRentalProperty = useCallback((activeId: string, overId: string) => {
    setData((prev) => {
      const next = reorderByIds(prev.rentalProperties, activeId, overId)
      if (next === prev.rentalProperties) return prev
      return { ...prev, rentalProperties: next }
    })
  }, [setData])

  const addInvestment = useCallback((investment: Omit<Investment, 'id'>) => {
    const newInvestment: Investment = { ...investment, id: crypto.randomUUID() }
    setData((prev) => ({ ...prev, investments: [...prev.investments, newInvestment] }))
  }, [setData])

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    setData((prev) => ({
      ...prev,
      investments: prev.investments.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }))
  }, [setData])

  const deleteInvestment = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      investments: prev.investments.filter((i) => i.id !== id),
    }))
  }, [setData])

  const calculateRentalNetResult = useCallback((property: RentalProperty) => {
    return computeRentalNetMonthly(property)
  }, [])

  const {
    totalMonthlyRevenue,
    totalFixedExpenses,
    totalAnnexBudgets,
    totalRentalNetResult,
    totalRentalSecurityReserve,
    totalInvestmentValue,
    totalMonthlyContributions,
    availableToInvest,
  } = useMemo(() => getFinanceMetrics(data), [data])

  const value = useMemo(
    () => ({
      data,
      isLoaded,
      importFinanceData,
      startNewDraft,
      addRevenue,
      updateRevenue,
      deleteRevenue,
      moveRevenue,
      reorderRevenue,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      moveFixedExpense,
      reorderFixedExpense,
      reorderAnnexBudget,
      addAnnexBudget,
      updateAnnexBudget,
      deleteAnnexBudget,
      addRentalProperty,
      updateRentalProperty,
      deleteRentalProperty,
      reorderRentalProperty,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      calculateRentalNetResult,
      totalMonthlyRevenue,
      totalFixedExpenses,
      totalAnnexBudgets,
      totalRentalNetResult,
      totalRentalSecurityReserve,
      totalInvestmentValue,
      totalMonthlyContributions,
      availableToInvest,
    }),
    [
      data,
      isLoaded,
      importFinanceData,
      startNewDraft,
      addRevenue,
      updateRevenue,
      deleteRevenue,
      moveRevenue,
      reorderRevenue,
      addFixedExpense,
      updateFixedExpense,
      deleteFixedExpense,
      moveFixedExpense,
      reorderFixedExpense,
      reorderAnnexBudget,
      addAnnexBudget,
      updateAnnexBudget,
      deleteAnnexBudget,
      addRentalProperty,
      updateRentalProperty,
      deleteRentalProperty,
      reorderRentalProperty,
      addInvestment,
      updateInvestment,
      deleteInvestment,
      calculateRentalNetResult,
      totalMonthlyRevenue,
      totalFixedExpenses,
      totalAnnexBudgets,
      totalRentalNetResult,
      totalRentalSecurityReserve,
      totalInvestmentValue,
      totalMonthlyContributions,
      availableToInvest,
    ],
  )

  return <FinanceDataContext.Provider value={value}>{children}</FinanceDataContext.Provider>
}

export function useFinanceData() {
  const ctx = useContext(FinanceDataContext)
  if (!ctx) {
    throw new Error(i18n.t('errors.financeContext'))
  }
  return ctx
}
