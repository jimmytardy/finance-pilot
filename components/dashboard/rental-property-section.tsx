'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Home, TrendingUp, TrendingDown } from 'lucide-react'
import type {
  RentalProperty,
  Frequency,
  RentalPropertyExpense,
  MaintenanceReserve,
  AdditionalCharge,
  RentalPropertyAddress,
} from '@/lib/types'
import { additionalChargeToMonthly, totalAdditionalChargesMonthly } from '@/lib/rental-charges'
import { formatCurrencyAmount } from '@/lib/i18n/locale'

interface RentalPropertySectionProps {
  properties: RentalProperty[]
  onAdd: (property: Omit<RentalProperty, 'id'>) => void
  onUpdate: (id: string, updates: Partial<RentalProperty>) => void
  onDelete: (id: string) => void
  calculateNetResult: (property: RentalProperty) => number
  totalNetResult: number
}

interface ExpenseInput {
  amount: string
  frequency: Frequency
}

const defaultExpense: ExpenseInput = { amount: '', frequency: 'monthly' }
const defaultMaintenanceReserve = { type: 'percentage' as const, value: '10', frequency: 'monthly' as Frequency }

interface AdditionalChargeDraft {
  id: string
  label: string
  type: 'fixed' | 'percentage'
  value: string
  frequency: Frequency
}

function formatAddressForDisplay(address: RentalPropertyAddress): string | null {
  const street = address.street.trim()
  const line2 = [address.postalCode.trim(), address.city.trim()].filter(Boolean).join(' ')
  if (!street && !line2) return null
  return [street, line2].filter(Boolean).join('\n')
}

function emptyAdditionalDraft(): AdditionalChargeDraft {
  return {
    id: crypto.randomUUID(),
    label: '',
    type: 'fixed',
    value: '',
    frequency: 'monthly',
  }
}

function RentalAdditionalChargeRow({
  draft,
  onChange,
  onRemove,
}: {
  draft: AdditionalChargeDraft
  onChange: (next: AdditionalChargeDraft) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const baseId = `add-charge-${draft.id}`
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3 space-y-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${baseId}-label`}>{t('common.label')}</Label>
        <Input
          id={`${baseId}-label`}
          placeholder={t('rental.chargeLabelPh')}
          value={draft.label}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-2">
          <Label>{t('rental.chargeType')}</Label>
          <Select
            value={draft.type}
            onValueChange={(ty: 'fixed' | 'percentage') =>
              onChange({ ...draft, type: ty, frequency: ty === 'percentage' ? 'monthly' : draft.frequency })
            }
          >
            <SelectTrigger className="w-full sm:min-w-[11rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">{t('rental.chargeFixedEur')}</SelectItem>
              <SelectItem value="percentage">{t('rental.chargePctRent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor={`${baseId}-value`}>
            {draft.type === 'percentage' ? t('rental.maintenancePct') : t('rental.chargeAmount')}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${baseId}-value`}
              type="number"
              placeholder={draft.type === 'percentage' ? t('rental.chargePctPh') : '0'}
              value={draft.value}
              onChange={(e) => onChange({ ...draft, value: e.target.value })}
              className="min-w-0 flex-1"
            />
            {draft.type === 'fixed' && (
              <Select
                value={draft.frequency}
                onValueChange={(f: Frequency) => onChange({ ...draft, frequency: f })}
              >
                <SelectTrigger className="w-28 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('common.slashMonth')}</SelectItem>
                  <SelectItem value="annual">{t('common.perYear')}</SelectItem>
                </SelectContent>
              </Select>
            )}
            {draft.type === 'percentage' && (
              <span className="flex h-9 items-center px-2 text-sm text-muted-foreground">%</span>
            )}
          </div>
        </div>
        <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function RentalExpenseField({
  label,
  value,
  onChange,
  id,
}: {
  label: string
  value: ExpenseInput
  onChange: (value: ExpenseInput) => void
  id: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type="number"
          placeholder="0"
          value={value.amount}
          onChange={(e) => onChange({ ...value, amount: e.target.value })}
          className="flex-1"
        />
        <Select value={value.frequency} onValueChange={(f: Frequency) => onChange({ ...value, frequency: f })}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
            <SelectItem value="annual">{t('common.annual')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function RentalPropertySection({
  properties,
  onAdd,
  onUpdate,
  onDelete,
  calculateNetResult,
  totalNetResult,
}: RentalPropertySectionProps) {
  const { t, i18n } = useTranslation()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressPostalCode, setAddressPostalCode] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [condoFees, setCondoFees] = useState<ExpenseInput>(defaultExpense)
  const [propertyTax, setPropertyTax] = useState<ExpenseInput>({ amount: '', frequency: 'annual' })
  const [homeInsurance, setHomeInsurance] = useState<ExpenseInput>({ amount: '', frequency: 'annual' })
  const [borrowerInsurance, setBorrowerInsurance] = useState<ExpenseInput>(defaultExpense)
  const [otherInsurance, setOtherInsurance] = useState<ExpenseInput>(defaultExpense)
  const [loanPayment, setLoanPayment] = useState<ExpenseInput>(defaultExpense)
  const [maintenanceReserve, setMaintenanceReserve] = useState(defaultMaintenanceReserve)
  const [additionalDrafts, setAdditionalDrafts] = useState<AdditionalChargeDraft[]>([])

  const formatCurrency = (amount: number) => formatCurrencyAmount(amount, i18n.language)

  const toMonthly = (expense: RentalPropertyExpense) => {
    return expense.frequency === 'annual' ? expense.amount / 12 : expense.amount
  }

  const handleSubmit = () => {
    if (!name.trim() || !monthlyRent) return

    const parseExpense = (input: ExpenseInput): RentalPropertyExpense => ({
      amount: parseFloat(input.amount) || 0,
      frequency: input.frequency,
    })

    const additionalCharges: AdditionalCharge[] = additionalDrafts
      .filter((d) => d.label.trim() && d.value.trim() !== '')
      .map((d) => ({
        id: d.id,
        label: d.label.trim(),
        type: d.type,
        value: parseFloat(d.value) || 0,
        frequency: d.type === 'percentage' ? 'monthly' : d.frequency,
      }))

    const propertyData: Omit<RentalProperty, 'id'> = {
      name: name.trim(),
      address: {
        street: addressStreet.trim(),
        postalCode: addressPostalCode.trim(),
        city: addressCity.trim(),
      },
      monthlyRent: parseFloat(monthlyRent) || 0,
      condoFees: parseExpense(condoFees),
      propertyTax: parseExpense(propertyTax),
      homeInsurance: parseExpense(homeInsurance),
      borrowerInsurance: parseExpense(borrowerInsurance),
      otherInsurance: parseExpense(otherInsurance),
      loanPayment: parseExpense(loanPayment),
      maintenanceReserve: {
        type: maintenanceReserve.type,
        value: parseFloat(maintenanceReserve.value) || 0,
        frequency: maintenanceReserve.frequency,
      } as MaintenanceReserve,
      additionalCharges,
    }

    if (editingId) {
      onUpdate(editingId, propertyData)
    } else {
      onAdd(propertyData)
    }
    resetForm()
  }

  const resetForm = () => {
    setName('')
    setAddressStreet('')
    setAddressPostalCode('')
    setAddressCity('')
    setMonthlyRent('')
    setCondoFees(defaultExpense)
    setPropertyTax({ amount: '', frequency: 'annual' })
    setHomeInsurance({ amount: '', frequency: 'annual' })
    setBorrowerInsurance(defaultExpense)
    setOtherInsurance(defaultExpense)
    setLoanPayment(defaultExpense)
    setMaintenanceReserve(defaultMaintenanceReserve)
    setAdditionalDrafts([])
    setIsAddOpen(false)
    setEditingId(null)
  }

  const startEdit = (property: RentalProperty) => {
    setEditingId(property.id)
    setName(property.name)
    setAddressStreet(property.address.street)
    setAddressPostalCode(property.address.postalCode)
    setAddressCity(property.address.city)
    setMonthlyRent(property.monthlyRent.toString())
    setCondoFees({ amount: property.condoFees.amount.toString(), frequency: property.condoFees.frequency })
    setPropertyTax({ amount: property.propertyTax.amount.toString(), frequency: property.propertyTax.frequency })
    setHomeInsurance({ amount: property.homeInsurance.amount.toString(), frequency: property.homeInsurance.frequency })
    setBorrowerInsurance({
      amount: property.borrowerInsurance.amount.toString(),
      frequency: property.borrowerInsurance.frequency,
    })
    setOtherInsurance({ amount: property.otherInsurance.amount.toString(), frequency: property.otherInsurance.frequency })
    setLoanPayment({ amount: property.loanPayment.amount.toString(), frequency: property.loanPayment.frequency })
    setMaintenanceReserve({
      type: property.maintenanceReserve.type,
      value: property.maintenanceReserve.value.toString(),
      frequency: property.maintenanceReserve.frequency,
    })
    setAdditionalDrafts(
      (property.additionalCharges ?? []).map((c) => ({
        id: c.id || crypto.randomUUID(),
        label: c.label,
        type: c.type,
        value: c.value.toString(),
        frequency: c.frequency,
      })),
    )
    setIsAddOpen(true)
  }

  const getPropertyDetails = (property: RentalProperty) => {
    const monthlyCondoFees = toMonthly(property.condoFees)
    const monthlyTax = toMonthly(property.propertyTax)
    const monthlyHomeInsurance = toMonthly(property.homeInsurance)
    const monthlyBorrowerInsurance = toMonthly(property.borrowerInsurance)
    const monthlyOtherInsurance = toMonthly(property.otherInsurance)
    const monthlyLoanPayment = toMonthly(property.loanPayment)

    let maintenanceAmount: number
    if (property.maintenanceReserve.type === 'percentage') {
      maintenanceAmount = property.monthlyRent * (property.maintenanceReserve.value / 100)
    } else {
      maintenanceAmount =
        property.maintenanceReserve.frequency === 'annual'
          ? property.maintenanceReserve.value / 12
          : property.maintenanceReserve.value
    }

    const totalInsurance = monthlyHomeInsurance + monthlyBorrowerInsurance + monthlyOtherInsurance
    const additionalMonthly = totalAdditionalChargesMonthly(property)
    const totalCosts =
      monthlyCondoFees +
      monthlyTax +
      totalInsurance +
      monthlyLoanPayment +
      maintenanceAmount +
      additionalMonthly
    const netResult = calculateNetResult(property)

    const additionalBreakdown = (property.additionalCharges ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      monthly: additionalChargeToMonthly(c, property.monthlyRent),
      type: c.type,
    }))

    return {
      monthlyCondoFees,
      monthlyTax,
      monthlyHomeInsurance,
      monthlyBorrowerInsurance,
      monthlyOtherInsurance,
      totalInsurance,
      monthlyLoanPayment,
      maintenanceAmount,
      additionalMonthly,
      additionalBreakdown,
      netResult,
      totalCosts,
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-chart-4/10">
            <Home className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{t('rental.title')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('rental.totalNetMonthly')}{' '}
              <span className={`font-mono font-medium ${totalNetResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(totalNetResult)}
              </span>
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? t('rental.dialogEdit') : t('rental.dialogAdd')}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="property-name">{t('rental.propertyName')}</Label>
                <Input
                  id="property-name"
                  placeholder={t('rental.propertyNamePh')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="property-street">{t('rental.address')}</Label>
                <Input
                  id="property-street"
                  placeholder={t('rental.streetPh')}
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="property-postal">{t('rental.postalCode')}</Label>
                    <Input
                      id="property-postal"
                      placeholder={t('rental.postalPh')}
                      value={addressPostalCode}
                      onChange={(e) => setAddressPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="property-city">{t('rental.city')}</Label>
                    <Input
                      id="property-city"
                      placeholder={t('rental.cityPh')}
                      value={addressCity}
                      onChange={(e) => setAddressCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="property-rent">{t('rental.monthlyRent')}</Label>
                <Input
                  id="property-rent"
                  type="number"
                  placeholder="0"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(e.target.value)}
                />
              </div>

              <div className="h-px bg-border my-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('rental.sectionCharges')}</p>

              <RentalExpenseField
                label={t('rental.condoFees')}
                value={condoFees}
                onChange={setCondoFees}
                id="condo-fees"
              />
              <RentalExpenseField
                label={t('rental.propertyTax')}
                value={propertyTax}
                onChange={setPropertyTax}
                id="property-tax"
              />

              <div className="h-px bg-border my-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('rental.sectionInsurance')}</p>

              <RentalExpenseField
                label={t('rental.homeInsurance')}
                value={homeInsurance}
                onChange={setHomeInsurance}
                id="home-insurance"
              />
              <RentalExpenseField
                label={t('rental.borrowerInsurance')}
                value={borrowerInsurance}
                onChange={setBorrowerInsurance}
                id="borrower-insurance"
              />
              <RentalExpenseField
                label={t('rental.otherInsurance')}
                value={otherInsurance}
                onChange={setOtherInsurance}
                id="other-insurance"
              />

              <div className="h-px bg-border my-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('rental.sectionCredit')}</p>

              <RentalExpenseField
                label={t('rental.loanPayment')}
                value={loanPayment}
                onChange={setLoanPayment}
                id="loan-payment"
              />

              <div className="h-px bg-border my-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('rental.sectionMaintenance')}</p>

              <div className="flex flex-col gap-2">
                <Label htmlFor="maintenance-type">{t('rental.maintenanceType')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={maintenanceReserve.type}
                    onValueChange={(ty: 'percentage' | 'fixed') =>
                      setMaintenanceReserve({ ...maintenanceReserve, type: ty })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">{t('rental.maintenancePct')}</SelectItem>
                      <SelectItem value="fixed">{t('rental.maintenanceFixed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder={maintenanceReserve.type === 'percentage' ? '10' : '0'}
                    value={maintenanceReserve.value}
                    onChange={(e) => setMaintenanceReserve({ ...maintenanceReserve, value: e.target.value })}
                    className="flex-1"
                  />
                  {maintenanceReserve.type === 'fixed' && (
                    <Select
                      value={maintenanceReserve.frequency}
                      onValueChange={(f: Frequency) =>
                        setMaintenanceReserve({ ...maintenanceReserve, frequency: f })
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">{t('common.monthly')}</SelectItem>
                        <SelectItem value="annual">{t('common.annual')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {maintenanceReserve.type === 'percentage'
                    ? t('rental.maintenanceHintPct')
                    : t('rental.maintenanceHintFixed')}
                </p>
              </div>

              <div className="h-px bg-border my-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('rental.sectionOther')}</p>
              <p className="text-xs text-muted-foreground">{t('rental.otherChargesHint')}</p>

              <div className="flex flex-col gap-3">
                {additionalDrafts.map((draft) => (
                  <RentalAdditionalChargeRow
                    key={draft.id}
                    draft={draft}
                    onChange={(next) =>
                      setAdditionalDrafts((prev) => prev.map((d) => (d.id === next.id ? next : d)))
                    }
                    onRemove={() => setAdditionalDrafts((prev) => prev.filter((d) => d.id !== draft.id))}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setAdditionalDrafts((prev) => [...prev, emptyAdditionalDraft()])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('rental.addCharge')}
                </Button>
              </div>

              <Button onClick={handleSubmit} className="mt-2">
                {editingId ? t('common.save') : t('common.add')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {properties.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {t('rental.empty')}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {properties.map((property) => {
              const details = getPropertyDetails(property)
              const addressText = formatAddressForDisplay(property.address)
              return (
                <div key={property.id} className="p-4 rounded-lg bg-secondary/50 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{property.name}</h4>
                      {addressText && (
                        <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">
                          {addressText}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('rental.rentLabel', { amount: formatCurrency(property.monthlyRent) })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(property)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(property.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailCondo')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.monthlyCondoFees)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailTax')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.monthlyTax)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailInsurance')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.totalInsurance)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailLoan')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.monthlyLoanPayment)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailMaintenance')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.maintenanceAmount)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailOther')}</span>
                      <span className="font-mono">
                        {formatCurrency(details.additionalMonthly)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground">{t('rental.detailTotalCharges')}</span>
                      <span className="font-mono text-destructive">
                        {formatCurrency(details.totalCosts)}
                        {t('common.perMonth')}
                      </span>
                    </div>
                  </div>

                  {details.additionalBreakdown.length > 0 && (
                    <div className="rounded-md border border-border/60 bg-background/50 px-3 py-2 text-xs">
                      <p className="font-medium text-muted-foreground mb-1.5">{t('rental.additionalDetailTitle')}</p>
                      <ul className="space-y-1">
                        {details.additionalBreakdown.map((row) => (
                          <li key={row.id} className="flex justify-between gap-2">
                            <span className="truncate text-muted-foreground">{row.label}</span>
                            <span className="shrink-0 font-mono">
                              {formatCurrency(row.monthly)}
                              {t('common.perMonth')}
                              {row.type === 'percentage' && (
                                <span className="text-muted-foreground"> {t('rental.rentPctTag')}</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {details.netResult >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-primary" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-destructive" />
                        )}
                        <span className="text-sm font-medium">{t('rental.netMonthlyResult')}</span>
                      </div>
                      <span className={`font-mono font-bold ${details.netResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
                        {formatCurrency(details.netResult)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}

            {properties.length > 1 && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t('rental.totalAllProperties')}</span>
                  <span className={`font-mono font-bold ${totalNetResult >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatCurrency(totalNetResult)}
                    {t('common.perMonth')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
