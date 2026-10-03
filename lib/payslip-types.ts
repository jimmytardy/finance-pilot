import type {
  PayslipBlocId,
  PayslipFrequenceId,
  PayslipKindId,
  PayslipModeEpargneId,
  PayslipRegimeSocialId,
} from '@/lib/payslip-categories'

/** Ligne de bulletin telle que renvoyée par l'API (montants en chaînes décimales). */
export type PayslipLineDto = {
  id?: string
  position?: number
  bloc: PayslipBlocId
  categorie: string
  libelle: string
  base: string | null
  quantite: string | null
  tauxSalarial: string | null
  montantSalarial: string | null
  tauxPatronal: string | null
  montantPatronal: string | null
  montant: string | null
  frequence: PayslipFrequenceId | null
  regimeSocial: PayslipRegimeSocialId | null
  imposable: boolean | null
  exonerationIr: boolean | null
  verseEnNumeraire: boolean
  modeEpargne: PayslipModeEpargneId | null
  csgCrds: string | null
  periodeRattachement: string | null
}

/** Totaux d'un document (bulletin ou fiche d'épargne salariale). */
export type PayslipTotals = {
  brut: string
  netAvantImpot: string
  netImposable: string
  netSocial: string | null
  netPaye: string
  prelevementSource: string
  tauxPas: string | null
  totalCotisationsSalariales: string | null
  totalCotisationsPatronales: string | null
  coutEmployeur: string | null
  heuresTravaillees: string | null
  plafondSS: string | null
}

export type PayslipDto = PayslipTotals & {
  id: string
  employerId: string | null
  kind: PayslipKindId
  year: number
  month: number
  label: string | null
  cumuls: Record<string, string | number> | null
  notes: string | null
  extractedBy: string | null
  createdAt: string
  updatedAt: string
  lines: PayslipLineDto[]
}

/** Brouillon éditable côté client (création ou relecture d'une extraction IA). */
export type PayslipDraft = Omit<PayslipDto, 'id' | 'employerId' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export const PAYSLIP_TOTAL_FIELDS = [
  'brut',
  'netAvantImpot',
  'netImposable',
  'netSocial',
  'netPaye',
  'prelevementSource',
  'tauxPas',
  'totalCotisationsSalariales',
  'totalCotisationsPatronales',
  'coutEmployeur',
  'heuresTravaillees',
  'plafondSS',
] as const satisfies readonly (keyof PayslipTotals)[]
