'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyAmount } from '@/lib/i18n/locale'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

interface BreakdownChartProps {
  data: {
    name: string
    value: number
  }[]
  title: string
  showPercentages?: boolean
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function BreakdownChart({ data, title, showPercentages = false }: BreakdownChartProps) {
  const { t, i18n } = useTranslation()
  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)
  const formatPercent = (ratio: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(ratio)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: COLORS[index % COLORS.length],
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  if (data.length === 0 || total === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    const amount = Number(value)
                    if (!showPercentages || total <= 0) return formatCurrency(amount)
                    return `${formatCurrency(amount)} (${formatPercent(amount / total)})`
                  }}
                />
              }
            />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 flex flex-col gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-mono font-medium">
                {formatCurrency(item.value)}
                {showPercentages && total > 0 ? (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {formatPercent(item.value / total)}
                  </span>
                ) : null}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
