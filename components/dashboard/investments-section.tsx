'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, PiggyBank, TrendingUp } from 'lucide-react'
import type { Investment } from '@/lib/types'
import { formatCurrencyAmount } from '@/lib/i18n/locale'

interface InvestmentsSectionProps {
  investments: Investment[]
  onAdd: (investment: Omit<Investment, 'id'>) => void
  onUpdate: (id: string, updates: Partial<Investment>) => void
  onDelete: (id: string) => void
  totalValue: number
  totalMonthlyContributions: number
  availableToInvest: number
}

export function InvestmentsSection({
  investments,
  onAdd,
  onUpdate,
  onDelete,
  totalValue,
  totalMonthlyContributions,
  availableToInvest,
}: InvestmentsSectionProps) {
  const { t, i18n } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [annualReturn, setAnnualReturn] = useState('')

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)

  const handleSubmit = () => {
    if (!label.trim()) return

    const investmentData = {
      label: label.trim(),
      currentValue: parseFloat(currentValue) || 0,
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      annualReturn: parseFloat(annualReturn) || 0,
    }

    if (editingId) {
      onUpdate(editingId, investmentData)
    } else {
      onAdd(investmentData)
    }
    resetForm()
  }

  const resetForm = () => {
    setLabel('')
    setCurrentValue('')
    setMonthlyContribution('')
    setAnnualReturn('')
    setIsAddOpen(false)
    setEditingId(null)
  }

  const startEdit = (investment: Investment) => {
    setEditingId(investment.id)
    setLabel(investment.label)
    setCurrentValue(investment.currentValue.toString())
    setMonthlyContribution(investment.monthlyContribution.toString())
    setAnnualReturn(investment.annualReturn.toString())
    setIsAddOpen(true)
  }

  const weightedAvgReturn = useMemo(() => {
    if (totalValue === 0) return 0
    return investments.reduce((sum, inv) => {
      return sum + (inv.annualReturn * inv.currentValue / totalValue)
    }, 0)
  }, [investments, totalValue])

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-5/10">
            <PiggyBank className="h-5 w-5 text-chart-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('investments.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('investments.portfolioTotal')}{' '}
              <span className="font-mono font-medium text-chart-5">{formatCurrency(totalValue)}</span>
            </p>
          </div>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsAddOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              <Plus className="h-4 w-4 mr-1" />
              {t('common.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? t('investments.dialogEdit') : t('investments.dialogAdd')}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-label">{t('common.category')}</Label>
                <Input
                  id="inv-label"
                  placeholder={t('investments.placeholder')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-value">{t('investments.currentValue')}</Label>
                <Input
                  id="inv-value"
                  type="number"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-contribution">{t('investments.monthlyContribution')}</Label>
                <Input
                  id="inv-contribution"
                  type="number"
                  placeholder="0"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="inv-return">{t('investments.annualReturn')}</Label>
                <Input
                  id="inv-return"
                  type="number"
                  step="0.1"
                  placeholder={t('investments.returnPh')}
                  value={annualReturn}
                  onChange={(e) => setAnnualReturn(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} className="mt-2">
                {editingId ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">{t('investments.summaryContributions')}</p>
            <p className="font-mono font-semibold text-lg">{formatCurrency(totalMonthlyContributions)}</p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs text-muted-foreground">{t('investments.availableForInvesting')}</p>
            <p className={`font-mono font-semibold text-lg ${availableToInvest >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(availableToInvest)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 col-span-2 md:col-span-1">
            <p className="text-xs text-muted-foreground">{t('investments.weightedReturn')}</p>
            <p className="font-mono font-semibold text-lg">{weightedAvgReturn.toFixed(1)}%</p>
          </div>
        </div>

        {investments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('investments.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {investments.map((investment) => (
              <div
                key={investment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{investment.label}</span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {formatCurrency(investment.monthlyContribution)}
                      {t('investments.perMonthShort')}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {investment.annualReturn}%{t('investments.perYearShort')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-chart-5">
                    {formatCurrency(investment.currentValue)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(investment)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(investment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
