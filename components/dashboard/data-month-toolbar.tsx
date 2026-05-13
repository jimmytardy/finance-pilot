'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSimulatorWorkspace } from '@/contexts/simulator-workspace-context'
import { sortMonthKeysAsc, formatMonthKeyLabel } from '@/lib/schedule-utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function DataMonthToolbar({
  className,
  onPendingMonthChange,
}: {
  className?: string
  /** Appelé quand l’utilisateur choisit un mois sans instantané (création en attente) ou revient à un mois existant. */
  onPendingMonthChange?: (pendingMonthKey: string | null) => void
}) {
  const { t, i18n } = useTranslation()
  const {
    activeMonthKey,
    sortedMonthKeys,
    monthlySnapshots,
    setActiveMonthKey,
    duplicateMonthFrom,
    createEmptyMonth,
  } = useSimulatorWorkspace()

  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [copySource, setCopySource] = useState<string>('')

  const existingSorted = useMemo(() => sortMonthKeysAsc(Object.keys(monthlySnapshots)), [monthlySnapshots])

  const copyOptions = useMemo(
    () => (pendingKey ? existingSorted.filter((k) => k !== pendingKey) : []),
    [existingSorted, pendingKey],
  )

  const handleMonthInput = (value: string) => {
    if (!value) return
    if (monthlySnapshots[value]) {
      setActiveMonthKey(value)
      setPendingKey(null)
    } else {
      setPendingKey(value)
      const first = existingSorted.find((k) => k !== value) ?? ''
      setCopySource(first)
    }
  }

  const applyCreateEmpty = () => {
    if (!pendingKey) return
    createEmptyMonth(pendingKey)
    setPendingKey(null)
  }

  const applyCopy = () => {
    if (!pendingKey || !copySource || copySource === pendingKey) return
    duplicateMonthFrom(pendingKey, copySource)
    setPendingKey(null)
  }

  useEffect(() => {
    onPendingMonthChange?.(pendingKey)
  }, [pendingKey, onPendingMonthChange])

  return (
    <div className={cn('space-y-4 rounded-lg border border-border bg-card p-4', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Label htmlFor="data-month-input" className="text-sm font-medium">
            {t('dataPage.periodLabel')}
          </Label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="data-month-input"
              type="month"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={pendingKey ?? activeMonthKey}
              min="2000-01"
              max="2100-12"
              onChange={(e) => handleMonthInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {pendingKey
                ? t('dataPage.periodHintPending', { label: formatMonthKeyLabel(pendingKey, i18n.language) })
                : t('dataPage.periodHint', { label: formatMonthKeyLabel(activeMonthKey, i18n.language) })}
            </p>
          </div>
        </div>
      </div>

      {existingSorted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t('dataPage.savedMonths')}</p>
          <div className="flex flex-wrap gap-2">
            {existingSorted.map((k) => (
              <Button
                key={k}
                type="button"
                size="sm"
                variant={k === activeMonthKey ? 'default' : 'outline'}
                className="shrink-0"
                onClick={() => {
                  setActiveMonthKey(k)
                  setPendingKey(null)
                }}
              >
                {formatMonthKeyLabel(k, i18n.language)}
              </Button>
            ))}
          </div>
        </div>
      )}

      {pendingKey && (
        <Alert>
          <AlertDescription className="flex flex-col gap-3 text-sm">
            <span>{t('dataPage.missingMonth', { label: formatMonthKeyLabel(pendingKey, i18n.language) })}</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              {copyOptions.length > 0 ? (
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="text-xs">{t('dataPage.copyFromMonth')}</Label>
                  <Select value={copySource} onValueChange={setCopySource}>
                    <SelectTrigger className="w-full sm:max-w-xs">
                      <SelectValue placeholder={t('dataPage.pickSourceMonth')} />
                    </SelectTrigger>
                    <SelectContent>
                      {copyOptions.map((k) => (
                        <SelectItem key={k} value={k}>
                          {formatMonthKeyLabel(k, i18n.language)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={applyCreateEmpty}>
                  {t('dataPage.createEmpty')}
                </Button>
                {copyOptions.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={!copySource || copySource === pendingKey}
                    onClick={applyCopy}
                  >
                    {t('dataPage.createFromCopy')}
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="sm" onClick={() => setPendingKey(null)}>
                  {t('dataPage.cancelPending')}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
