import type { GuideArticleBundle } from '@/lib/i18n/guides/article-types'

export const budgetTresorerieArticle: GuideArticleBundle = {
  fr: {
    heroTitle: 'Budget mensuel et trésorerie : anticiper plutôt que subir',
    heroLead:
      'La trésorerie personnelle, ce n’est pas seulement le solde du compte aujourd’hui : c’est la courbe des entrées et des sorties sur les quatre à huit prochaines semaines. Un budget mensuel utile colle à ce calendrier.',
    imgSrc: '/guides/schema-budget-mensuel-tresorerie.svg',
    imgAlt:
      'Schéma trésorerie mensuelle : calendrier des entrées de salaire et des sorties charges sur quatre semaines',
    figureCaption: 'Illustration d’une trésorerie lissée : salaire, charges et marge disponible sur le mois.',
    sections: [
      {
        title: 'Cartographier les dates, pas seulement les montants',
        paragraphs: [
          'Une charge annuelle (assurance habitation, taxe foncière) pèse peu en moyenne mensuelle mais beaucoup dans le mois où elle tombe. Recensez les montants **et** les dates pour éviter les surprises.',
          'Le calendrier de Gestion mensuelle reprend cette vision : chaque poste a une temporalité, ce qui aide à voir les semaines « rouges » à l’avance.',
        ],
      },
      {
        title: 'Laisser une marge sous le « zéro théorique »',
        paragraphs: [
          'Viser un solde projeté trop juste au dernier jour du mois augmente le risque de découvert dès qu’une facture arrive quelques jours en avance. Une marge de sécurité (même modeste) absorbe ces décalages.',
          'Dans le simulateur, comparez une version « serrée » et une version avec tampon d’épargne sur le compte courant pour voir l’impact sur le disponible à investir.',
        ],
      },
      {
        title: 'Relier budget et objectifs d’épargne',
        paragraphs: [
          'Si le budget mensuel ne laisse aucune place à l’épargne automatique, les objectifs à moyen terme restent sur le papier. Mieux vaut ajuster une enveloppe loisir que d’annuler un virement programmé sans alternative.',
          'Les enveloppes budgétaires de la page Données servent de passerelle entre contraintes du mois et projections longues dans Estimations.',
        ],
      },
      {
        title: 'Réévaluer après chaque mois atypique',
        paragraphs: [
          'Vacances, naissance, déménagement ou prime exceptionnelle : un mois « hors norme » ne doit pas forcément devenir la nouvelle norme, mais il doit mettre à jour certaines hypothèses (charges récurrentes, provisions).',
          'Enregistrer deux projets (avant / après choc) dans l’outil permet d’archiver la situation et de comparer les trajectoires.',
        ],
      },
    ],
    checklistTitle: 'Indicateurs simples pour piloter la trésorerie du foyer',
    checklist: [
      'Solde projeté à J+15 et J+30 (même approximatif)',
      'Liste des prélèvements entre deux dates de salaire',
      'Montant minimum de réserve sur compte courant que vous ne « touchez » pas',
    ],
    closing:
      'Pour passer du schéma aux chiffres : ouvrez le simulateur, complétez vos charges datées, puis activez le suivi mensuel pour cocher les paiements réalisés.',
  },
  en: {
    heroTitle: 'Monthly budget and cash flow: plan ahead',
    heroLead:
      'Household cash flow is not only today’s balance—it is the path of inflows and outflows over the next four to eight weeks. A useful monthly budget mirrors that calendar.',
    imgSrc: '/guides/schema-budget-mensuel-tresorerie.svg',
    imgAlt:
      'Monthly cash-flow diagram: salary inflows and bill outflows across four weeks',
    figureCaption: 'Smoothed cash flow: paydays, bills and slack within the month.',
    sections: [
      {
        title: 'Map dates, not only amounts',
        paragraphs: [
          'Annual costs (home insurance, local taxes) look small as a monthly average but sting in the month they hit. Capture amounts **and** due dates to avoid surprises.',
          'Monthly management mirrors this: each line has timing so you can spot “red” weeks early.',
        ],
      },
      {
        title: 'Keep slack below the theoretical zero line',
        paragraphs: [
          'Targeting a projected balance too tight on the last day of the month raises overdraft risk if a bill lands a few days early. A modest buffer absorbs timing noise.',
          'In the simulator, compare a tight plan vs a plan with a current-account cushion to see the effect on cash available to invest.',
        ],
      },
      {
        title: 'Connect the monthly budget to savings goals',
        paragraphs: [
          'If the monthly budget leaves no room for automated savings, medium-term goals stay theoretical. Trimming a discretionary envelope is often healthier than cancelling the only transfer with no replacement.',
          'Annex budgets in Data bridge month-to-month constraints with long-range Forecasts.',
        ],
      },
      {
        title: 'Reassess after atypical months',
        paragraphs: [
          'Holidays, moving home or a one-off bonus: an unusual month should update some assumptions (recurring costs, provisions) without becoming the default template.',
          'Saving two projects (before / after the shock) archives the situation for comparison.',
        ],
      },
    ],
    checklistTitle: 'Simple indicators to steer household cash flow',
    checklist: [
      'Projected balance at +15 and +30 days (approximate is fine)',
      'List of direct debits between two paydays',
      'Minimum current-account buffer you treat as untouchable',
    ],
    closing:
      'Move from sketch to numbers: open the simulator, add dated bills, then Monthly management to tick payments as they clear.',
  },
}
