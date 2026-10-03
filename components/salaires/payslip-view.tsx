'use client'

import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { blocLabelKey, categoryLabelKey, type PayslipBlocId } from '@/lib/payslip-categories'
import type { PayslipDto, PayslipLineDto } from '@/lib/payslip-types'
import { formatAmount, formatOptionalAmount, parseAmount } from '@/components/salaires/payslip-format'

const GAIN_BLOCS: PayslipBlocId[] = ['REMUNERATION', 'PARTAGE_VALEUR', 'FIN_CONTRAT', 'AJUSTEMENT_NET']

/** Bulletin reconstitué en lecture seule : gains, cotisations, net, impôt, ajustements. */
export function PayslipView({ payslip }: { payslip: PayslipDto }) {
  const { t, i18n } = useTranslation()
  const lng = i18n.language
  const linesOf = (bloc: PayslipBlocId) => payslip.lines.filter((l) => l.bloc === bloc)
  const cotisations = linesOf('COTISATION')
  const impot = linesOf('IMPOT')
  const sum = (lines: PayslipLineDto[], pick: (l: PayslipLineDto) => string | null) =>
    lines.reduce((s, l) => s + parseAmount(pick(l)), 0)

  const summary: [string, string | null][] = [
    ['brut', payslip.brut],
    ['totalCotisationsSalariales', payslip.totalCotisationsSalariales],
    ['netAvantImpot', payslip.netAvantImpot],
    ['netImposable', payslip.netImposable],
    ['netSocial', payslip.netSocial],
    ['prelevementSource', payslip.prelevementSource],
    ['tauxPas', payslip.tauxPas],
    ['netPaye', payslip.netPaye],
    ['totalCotisationsPatronales', payslip.totalCotisationsPatronales],
    ['coutEmployeur', payslip.coutEmployeur],
  ]

  return (
    <div className="space-y-6 text-sm">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
        {summary.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{t(`salaries.totals.${key}`)}</dt>
            <dd className={key === 'netPaye' ? 'font-semibold tabular-nums' : 'tabular-nums'}>
              {formatOptionalAmount(value, lng)}
              {key === 'tauxPas' && value != null ? ' %' : ''}
            </dd>
          </div>
        ))}
      </dl>

      {GAIN_BLOCS.map((bloc) => {
        const lines = linesOf(bloc)
        if (lines.length === 0) return null
        return (
          <section key={bloc}>
            <h3 className="mb-1 font-semibold">{t(blocLabelKey(bloc))}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('salaries.lineLibelle')}</TableHead>
                  <TableHead>{t('salaries.lineCategorie')}</TableHead>
                  <TableHead className="text-right">{t('salaries.lineFields.base')}</TableHead>
                  <TableHead className="text-right">{t('salaries.lineFields.quantite')}</TableHead>
                  <TableHead className="text-right">{t('salaries.lineFields.montant')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={l.id ?? i}>
                    <TableCell>{l.libelle || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{t(categoryLabelKey(l.bloc, l.categorie))}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.base, lng)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.quantite, lng)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.montant, lng)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>{t('salaries.total')}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(sum(lines, (l) => l.montant), lng)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </section>
        )
      })}

      {[...cotisations, ...impot].length > 0 ? (
        <section>
          <h3 className="mb-1 font-semibold">{t(blocLabelKey('COTISATION'))}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('salaries.lineLibelle')}</TableHead>
                <TableHead>{t('salaries.lineCategorie')}</TableHead>
                <TableHead className="text-right">{t('salaries.lineFields.base')}</TableHead>
                <TableHead className="text-right">{t('salaries.lineFields.tauxSalarial')}</TableHead>
                <TableHead className="text-right">{t('salaries.lineFields.montantSalarial')}</TableHead>
                <TableHead className="text-right">{t('salaries.lineFields.tauxPatronal')}</TableHead>
                <TableHead className="text-right">{t('salaries.lineFields.montantPatronal')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...cotisations, ...impot].map((l, i) => (
                <TableRow key={l.id ?? i}>
                  <TableCell>{l.libelle || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{t(categoryLabelKey(l.bloc, l.categorie))}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.base, lng)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.tauxSalarial, lng)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.montantSalarial, lng)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.tauxPatronal, lng)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatOptionalAmount(l.montantPatronal, lng)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>{t('salaries.totalCotisations')}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatAmount(sum(cotisations, (l) => l.montantSalarial), lng)}
                </TableCell>
                <TableCell />
                <TableCell className="text-right tabular-nums">
                  {formatAmount(sum(cotisations, (l) => l.montantPatronal), lng)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>
      ) : null}

      {payslip.notes ? <p className="text-muted-foreground">{payslip.notes}</p> : null}
    </div>
  )
}
