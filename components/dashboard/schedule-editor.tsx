'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { ExpenseSchedule } from '@/lib/types'

type Props = {
  value: ExpenseSchedule | undefined
  onChange: (next: ExpenseSchedule | undefined) => void
  categoryListId: string
  categorySuggestions: string[]
}

function ScheduleCategoryCombobox({
  value,
  onChange,
  idPrefix,
  categorySuggestions,
}: {
  value: ExpenseSchedule
  onChange: (next: ExpenseSchedule) => void
  idPrefix: string
  categorySuggestions: string[]
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(value.category)

  const q = search.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!q) return categorySuggestions
    return categorySuggestions.filter((c) => c.toLowerCase().includes(q))
  }, [categorySuggestions, q])

  const hasExactMatch = useMemo(
    () => categorySuggestions.some((c) => c.toLowerCase() === search.trim().toLowerCase()),
    [categorySuggestions, search],
  )

  const canCreate = search.trim().length > 0 && !hasExactMatch

  const applyCategory = (category: string) => {
    onChange({ ...value, category })
    setSearch(category)
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setSearch(value.category)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={`${idPrefix}-cat`}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-10 w-full justify-between font-normal',
            !value.category.trim() && 'text-muted-foreground',
          )}
        >
          <span className="truncate text-left">
            {value.category.trim() ? value.category : t('schedule.categoryPick')}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[16rem] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder={t('schedule.categorySearch')} value={search} onValueChange={setSearch} />
          <CommandList>
            {!canCreate && filtered.length === 0 && (
              <CommandEmpty>{t('schedule.categoryNoMatch')}</CommandEmpty>
            )}
            {filtered.length > 0 && (
              <CommandGroup>
                {filtered.map((c) => (
                  <CommandItem
                    key={c}
                    value={c}
                    keywords={[c.toLowerCase()]}
                    onSelect={() => {
                      applyCategory(c)
                    }}
                  >
                    {c}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {canCreate && (
              <>
                {filtered.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem
                    value={`__create__${search.trim()}`}
                    onSelect={() => applyCategory(search.trim())}
                  >
                    {t('schedule.categoryCreate', { name: search.trim() })}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ScheduleEditor({ value, onChange, categoryListId, categorySuggestions }: Props) {
  const { t } = useTranslation()
  const enabled = !!value

  const setEnabled = (on: boolean) => {
    if (on) {
      onChange({
        category: value?.category ?? '',
        paymentMode: value?.paymentMode ?? 'automatic',
        dayOfMonth: value?.dayOfMonth ?? 1,
      })
    } else {
      onChange(undefined)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-start gap-2">
        <Checkbox
          id={`${categoryListId}-sch-enable`}
          checked={enabled}
          onCheckedChange={(c) => setEnabled(c === true)}
          className="mt-1"
        />
        <div className="space-y-1">
          <Label htmlFor={`${categoryListId}-sch-enable`} className="cursor-pointer font-medium">
            {t('schedule.enable')}
          </Label>
          <p className="text-xs text-muted-foreground leading-snug">{t('schedule.hint')}</p>
        </div>
      </div>

      {enabled && value && (
        <div className="grid gap-3 pt-1">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${categoryListId}-cat`}>{t('schedule.category')}</Label>
            <ScheduleCategoryCombobox
              value={value}
              onChange={onChange}
              idPrefix={categoryListId}
              categorySuggestions={categorySuggestions}
            />
            <p className="text-xs text-muted-foreground">{t('schedule.categoryPlaceholder')}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t('schedule.paymentMode')}</Label>
            <Select
              value={value.paymentMode}
              onValueChange={(v) =>
                onChange({ ...value, paymentMode: v as 'manual' | 'automatic' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{t('schedule.manual')}</SelectItem>
                <SelectItem value="automatic">{t('schedule.automatic')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${categoryListId}-day`}>{t('schedule.dayOfMonth')}</Label>
            <Input
              id={`${categoryListId}-day`}
              type="number"
              min={1}
              max={31}
              value={value.dayOfMonth}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onChange({
                  ...value,
                  dayOfMonth: Number.isFinite(n) ? Math.min(31, Math.max(1, n)) : 1,
                })
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
