import type { Investment } from '@/lib/types'

export type InvestmentYearPoint = {
  year: number
  portfolioValue: number
  contributions: number
  gains: number
}

/** Projection de la valeur du portefeuille (capital + versements, rendement mensualisé composé). */
export function buildInvestmentProjectionSeries(
  investments: Investment[],
  maxYears: number,
): InvestmentYearPoint[] {
  const points: InvestmentYearPoint[] = []

  for (let year = 0; year <= maxYears; year++) {
    let totalProjectedValue = 0
    let totalContributions = 0

    investments.forEach((inv) => {
      const monthlyRate = inv.annualReturn / 100 / 12
      const months = year * 12

      const fvCurrent = inv.currentValue * Math.pow(1 + monthlyRate, months)
      const fvContributions =
        monthlyRate > 0
          ? inv.monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
          : inv.monthlyContribution * months

      totalProjectedValue += fvCurrent + fvContributions
      totalContributions += inv.currentValue + inv.monthlyContribution * months
    })

    points.push({
      year,
      portfolioValue: Math.round(totalProjectedValue),
      contributions: Math.round(totalContributions),
      gains: Math.round(totalProjectedValue - totalContributions),
    })
  }

  return points
}
