'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import type { AnnexBudget, ExpenseSchedule } from '@/lib/types'
import { formatCurrencyAmount } from '@/lib/i18n/locale'
import { ScheduleEditor } from '@/components/dashboard/schedule-editor'

interface AnnexBudgetSectionProps {
  budgets: AnnexBudget[]
  onAdd: (budget: Omit<AnnexBudget, 'id'>) => void
  onUpdate: (id: string, updates: Partial<AnnexBudget>) => void
  onDelete: (id: string) => void
  total: number
  categorySuggestions?: string[]
}

export function AnnexBudgetSection({
  budgets,
  onAdd,
  onUpdate,
  onDelete,
  total,
  categorySuggestions = [],
}: AnnexBudgetSectionProps) {
  const { t, i18n } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly')
  const [scheduleForm, setScheduleForm] = useState<ExpenseSchedule | undefined>(undefined)

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)

  const buildSchedule = (): ExpenseSchedule | undefined => {
    if (!scheduleForm) return undefined
    const cat = scheduleForm.category.trim() || label.trim()
    if (!cat) return undefined
    return {
      category: cat,
      paymentMode: scheduleForm.paymentMode,
      dayOfMonth: Math.min(31, Math.max(1, scheduleForm.dayOfMonth)),
    }
  }

  const handleSubmit = () => {
    if (!label.trim() || !amount) return

    const schedule = buildSchedule()
    const payload = {
      label: label.trim(),
      amount: parseFloat(amount),
      frequency,
      ...(schedule ? { schedule } : { schedule: undefined }),
    }

    if (editingId) {
      onUpdate(editingId, payload)
    } else {
      onAdd(payload)
    }
    resetForm()
  }

  const resetForm = () => {
    setLabel('')
    setAmount('')
    setFrequency('monthly')
    setScheduleForm(undefined)
    setIsAddOpen(false)
    setEditingId(null)
  }

  const startEdit = (budget: AnnexBudget) => {
    setEditingId(budget.id)
    setLabel(budget.label)
    setAmount(budget.amount.toString())
    setFrequency(budget.frequency || 'monthly')
    setScheduleForm(budget.schedule ? { ...budget.schedule } : undefined)
    setIsAddOpen(true)
  }

  const getMonthlyAmount = (budget: AnnexBudget) => {
    return budget.frequency === 'annual' ? budget.amount / 12 : budget.amount
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-3/10">
            <Wallet className="h-5 w-5 text-chart-3" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('annexBudget.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('annexBudget.totalMonthly')}{' '}
              <span className="font-mono font-medium text-chart-3">{formatCurrency(total)}</span>
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('annexBudget.dialogEdit') : t('annexBudget.dialogAdd')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget-label">{t('common.category')}</Label>
                <Input
                  id="budget-label"
                  placeholder={t('annexBudget.placeholder')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="budget-amount">{t('common.amountEur')}</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>{t('common.frequency')}</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'monthly' | 'annual')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
                    <SelectItem value="annual">{t('common.annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScheduleEditor
                value={scheduleForm}
                onChange={setScheduleForm}
                categoryListId="annex-budget-categories"
                categorySuggestions={categorySuggestions}
              />

              <Button onClick={handleSubmit} className="mt-2">
                {editingId ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('annexBudget.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{budget.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {budget.frequency === 'annual' ? t('common.annual') : t('common.monthly')}
                    {budget.frequency === 'annual' && (
                      <span className="ml-1">({formatCurrency(getMonthlyAmount(budget))}{t('common.perMonth')})</span>
                    )}
                    {budget.schedule && (
                      <span className="mt-0.5 block text-[11px] text-primary/90">
                        {budget.schedule.category} ·{' '}
                        {budget.schedule.paymentMode === 'manual' ? t('schedule.manualShort') : t('schedule.autoShort')}{' '}
                        · {t('schedule.dayOfMonthShort', { day: budget.schedule.dayOfMonth })}
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-chart-3">
                    {formatCurrency(budget.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(budget)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(budget.id)}
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
