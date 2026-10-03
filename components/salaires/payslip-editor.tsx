'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  blocLabelKey,
  categoriesForBloc,
  categoryLabelKey,
  PAYSLIP_BLOCS,
  PAYSLIP_FREQUENCES,
  PAYSLIP_MODES_EPARGNE,
  type PayslipBlocId,
} from '@/lib/payslip-categories'
import { checkPayslipConsistency } from '@/lib/payslip-consistency'
import { formatMonthLongName } from '@/lib/salary-month-label'
import { PAYSLIP_TOTAL_FIELDS, type PayslipDraft, type PayslipLineDto } from '@/lib/payslip-types'
import { emptyLine, formatAmount } from '@/components/salaires/payslip-format'

const MONTH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

/** Totaux non nullables côté API (les autres passent à null quand le champ est vidé). */
const REQUIRED_TOTALS = ['brut', 'netAvantImpot', 'netImposable', 'netPaye', 'prelevementSource'] as const

/** Colonnes numériques éditables selon le bloc (cf. conventions de `lib/payslip-categories.ts`). */
const BLOC_COLUMNS: Record<PayslipBlocId, (keyof PayslipLineDto)[]> = {
  REMUNERATION: ['base', 'quantite', 'montant'],
  FIN_CONTRAT: ['base', 'montant'],
  PARTAGE_VALEUR: ['montant', 'csgCrds'],
  COTISATION: ['base', 'tauxSalarial', 'montantSalarial', 'tauxPatronal', 'montantPatronal'],
  IMPOT: ['base', 'tauxSalarial', 'montantSalarial'],
  AJUSTEMENT_NET: ['quantite', 'montantSalarial', 'montantPatronal', 'montant'],
}

type PayslipEditorProps = {
  draft: PayslipDraft
  onChange: (draft: PayslipDraft) => void
}

export function PayslipEditor({ draft, onChange }: PayslipEditorProps) {
  const { t, i18n } = useTranslation()
  const [tab, setTab] = useState<PayslipBlocId>('REMUNERATION')
  const warnings = useMemo(() => checkPayslipConsistency(draft), [draft])

  const set = <K extends keyof PayslipDraft>(key: K, value: PayslipDraft[K]) => onChange({ ...draft, [key]: value })

  const updateLine = (index: number, patch: Partial<PayslipLineDto>) => {
    onChange({ ...draft, lines: draft.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)) })
  }
  const removeLine = (index: number) => onChange({ ...draft, lines: draft.lines.filter((_, i) => i !== index) })
  const addLine = (bloc: PayslipBlocId) =>
    onChange({ ...draft, lines: [...draft.lines, emptyLine(bloc, categoriesForBloc(bloc)[0].id)] })

  const countFor = (bloc: PayslipBlocId) => draft.lines.filter((l) => l.bloc === bloc).length

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <Label>{t('salaries.kind')}</Label>
          <Select value={draft.kind} onValueChange={(v) => set('kind', v as PayslipDraft['kind'])}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BULLETIN">{t('salaries.kindBulletin')}</SelectItem>
              <SelectItem value="EPARGNE_SALARIALE">{t('salaries.kindEpargne')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('salaries.colYear')}</Label>
          <Input
            className="mt-1.5"
            type="number"
            value={draft.year}
            onChange={(e) => set('year', Number(e.target.value))}
          />
        </div>
        <div>
          <Label>{t('salaries.colMonth')}</Label>
          <Select value={String(draft.month)} onValueChange={(v) => set('month', Number(v))}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NUMBERS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {formatMonthLongName(m, i18n.language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('salaries.label')}</Label>
          <Input
            className="mt-1.5"
            value={draft.label ?? ''}
            placeholder={draft.kind === 'EPARGNE_SALARIALE' ? t('salaries.labelPlaceholder') : ''}
            onChange={(e) => set('label', e.target.value || null)}
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('salaries.totalsTitle')}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PAYSLIP_TOTAL_FIELDS.map((field) => (
            <div key={field}>
              <Label className="text-xs text-muted-foreground">{t(`salaries.totals.${field}`)}</Label>
              <Input
                className="mt-1 h-8 text-right tabular-nums"
                inputMode="decimal"
                value={draft[field] ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  const required = (REQUIRED_TOTALS as readonly string[]).includes(field)
                  set(field, (!required && v === '' ? null : v) as PayslipDraft[typeof field])
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {warnings.length > 0 ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {warnings.map((w) => (
            <p key={w.code} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <span>
                {t(`salaries.warnings.${w.code}`, {
                  expected: formatAmount(w.expected, i18n.language),
                  actual: formatAmount(w.actual, i18n.language),
                })}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as PayslipBlocId)}>
        <TabsList className="h-auto flex-wrap justify-start">
          {PAYSLIP_BLOCS.map((bloc) => (
            <TabsTrigger key={bloc} value={bloc} className="gap-1.5">
              {t(blocLabelKey(bloc))}
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {countFor(bloc)}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>
        {PAYSLIP_BLOCS.map((bloc) => (
          <TabsContent key={bloc} value={bloc} className="mt-3">
            <BlocLinesTable
              bloc={bloc}
              lines={draft.lines}
              onUpdate={updateLine}
              onRemove={removeLine}
            />
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => addLine(bloc)}>
              <Plus className="h-4 w-4" />
              {t('salaries.addLine')}
            </Button>
          </TabsContent>
        ))}
      </Tabs>

      <div>
        <Label>{t('salaries.notes')}</Label>
        <Input
          className="mt-1.5"
          value={draft.notes ?? ''}
          onChange={(e) => set('notes', e.target.value || null)}
        />
      </div>
    </div>
  )
}

type BlocLinesTableProps = {
  bloc: PayslipBlocId
  lines: PayslipLineDto[]
  onUpdate: (index: number, patch: Partial<PayslipLineDto>) => void
  onRemove: (index: number) => void
}

function BlocLinesTable({ bloc, lines, onUpdate, onRemove }: BlocLinesTableProps) {
  const { t } = useTranslation()
  const columns = BLOC_COLUMNS[bloc]
  const categories = categoriesForBloc(bloc)
  const indexed = lines.map((l, index) => ({ l, index })).filter(({ l }) => l.bloc === bloc)
  const showFrequence = bloc === 'REMUNERATION'
  const showMode = bloc === 'PARTAGE_VALEUR'

  if (indexed.length === 0) {
    return <p className="py-3 text-sm text-muted-foreground">{t('salaries.noLines')}</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">{t('salaries.lineLibelle')}</TableHead>
            <TableHead className="min-w-44">{t('salaries.lineCategorie')}</TableHead>
            {columns.map((c) => (
              <TableHead key={c} className="min-w-24 text-right">
                {t(`salaries.lineFields.${c}`)}
              </TableHead>
            ))}
            {showFrequence ? <TableHead className="min-w-32">{t('salaries.lineFields.frequence')}</TableHead> : null}
            {showMode ? <TableHead className="min-w-32">{t('salaries.lineFields.modeEpargne')}</TableHead> : null}
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {indexed.map(({ l, index }) => (
            <TableRow key={index}>
              <TableCell className="p-1">
                <Input
                  className="h-8 text-xs"
                  value={l.libelle}
                  onChange={(e) => onUpdate(index, { libelle: e.target.value })}
                />
              </TableCell>
              <TableCell className="p-1">
                <Select value={l.categorie} onValueChange={(v) => onUpdate(index, { categorie: v })}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {t(categoryLabelKey(bloc, c.id))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              {columns.map((c) => (
                <TableCell key={c} className="p-1">
                  <Input
                    className="h-8 text-right text-xs tabular-nums"
                    inputMode="decimal"
                    value={(l[c] as string | null) ?? ''}
                    onChange={(e) => onUpdate(index, { [c]: e.target.value === '' ? null : e.target.value })}
                  />
                </TableCell>
              ))}
              {showFrequence ? (
                <TableCell className="p-1">
                  <Select
                    value={l.frequence ?? 'default'}
                    onValueChange={(v) =>
                      onUpdate(index, { frequence: v === 'default' ? null : (v as PayslipLineDto['frequence']) })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">{t('salaries.frequences.default')}</SelectItem>
                      {PAYSLIP_FREQUENCES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {t(`salaries.frequences.${f}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              ) : null}
              {showMode ? (
                <TableCell className="p-1">
                  <Select
                    value={l.modeEpargne ?? 'INCONNU'}
                    onValueChange={(v) => onUpdate(index, { modeEpargne: v as PayslipLineDto['modeEpargne'] })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYSLIP_MODES_EPARGNE.map((m) => (
                        <SelectItem key={m} value={m}>
                          {t(`salaries.modesEpargne.${m}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              ) : null}
              <TableCell className="p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={t('salaries.removeLine')}
                  onClick={() => onRemove(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
