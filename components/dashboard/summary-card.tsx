'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatCurrencyAmount } from '@/lib/i18n/locale'

interface SummaryCardProps {
  title: string
  value: number
  subtitle?: string
  trend?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
}

export function SummaryCard({ title, value, subtitle, trend = 'neutral', icon }: SummaryCardProps) {
  const { i18n } = useTranslation()
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn(
              "text-2xl font-bold font-mono tracking-tight",
              trend === 'positive' && "text-primary",
              trend === 'negative' && "text-destructive",
              trend === 'neutral' && "text-foreground"
            )}>
              {formatCurrency(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-secondary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
