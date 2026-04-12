'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react'
import type { Revenue } from '@/lib/types'
import { formatCurrencyAmount } from '@/lib/i18n/locale'

interface RevenueSectionProps {
  revenues: Revenue[]
  onAdd: (revenue: Omit<Revenue, 'id'>) => void
  onUpdate: (id: string, updates: Partial<Revenue>) => void
  onDelete: (id: string) => void
  totalMonthly: number
}

export function RevenueSection({ revenues, onAdd, onUpdate, onDelete, totalMonthly }: RevenueSectionProps) {
  const { t, i18n } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'annual'>('monthly')

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)

  const getMonthlyAmount = (revenue: Revenue) => {
    return revenue.frequency === 'annual' ? revenue.amount / 12 : revenue.amount
  }

  const handleSubmit = () => {
    if (!label.trim() || !amount) return

    if (editingId) {
      onUpdate(editingId, {
        label: label.trim(),
        amount: parseFloat(amount),
        frequency,
      })
    } else {
      onAdd({
        label: label.trim(),
        amount: parseFloat(amount),
        frequency,
      })
    }
    resetForm()
  }

  const resetForm = () => {
    setLabel('')
    setAmount('')
    setFrequency('monthly')
    setIsAddOpen(false)
    setEditingId(null)
  }

  const startEdit = (revenue: Revenue) => {
    setEditingId(revenue.id)
    setLabel(revenue.label)
    setAmount(revenue.amount.toString())
    setFrequency(revenue.frequency)
    setIsAddOpen(true)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('revenue.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('revenue.totalMonthly')}{' '}
              <span className="font-mono font-medium text-primary">{formatCurrency(totalMonthly)}</span>
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
              <DialogTitle>{editingId ? t('revenue.dialogEdit') : t('revenue.dialogAdd')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="revenue-label">{t('common.label')}</Label>
                <Input
                  id="revenue-label"
                  placeholder={t('revenue.placeholder')}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="revenue-amount">{t('common.amountEur')}</Label>
                <Input
                  id="revenue-amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="revenue-frequency">{t('common.frequency')}</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as 'monthly' | 'annual')}>
                  <SelectTrigger id="revenue-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
                    <SelectItem value="annual">{t('common.annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} className="mt-2">
                {editingId ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {revenues.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('revenue.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {revenues.map((revenue) => (
              <div
                key={revenue.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{revenue.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {revenue.frequency === 'monthly' ? t('common.monthly') : t('common.annual')}
                    {revenue.frequency === 'annual' && ` (${formatCurrency(getMonthlyAmount(revenue))}${t('common.perMonth')})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-primary">
                    {formatCurrency(revenue.amount)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(revenue)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => onDelete(revenue.id)}
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
