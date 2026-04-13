import type { GuideArticleBundle } from '@/lib/i18n/guides/article-types'

export const gererFinancesPersonnellesArticle: GuideArticleBundle = {
  fr: {
    heroTitle: 'Gérer ses finances personnelles : par où commencer ?',
    heroLead:
      'Clarifier le vocabulaire et l’ordre des priorités (comptes courants et projets, épargne de précaution, dettes, horizons court et long terme). Ce guide est général : il aide à structurer vos questions avant de les saisir dans le simulateur Finance Pilot — sans remplacer un conseiller.',
    imgSrc: '/guides/infographie-gestion-finances-personnelles-revenus-depenses.svg',
    imgAlt:
      'Infographie équilibre finances personnelles : flèches revenus, charges fixes, épargne et reste à vivre',
    figureCaption: 'Schéma revenus, charges et épargne pour visualiser l’équilibre du foyer.',
    sections: [
      {
        title: 'Séparer comptes « courant » et « projets »',
        paragraphs: [
          'Garder l’intégralité de l’épargne sur le compte courant rend les arbitrages flous. Même sans multiplier les banques, des sous-comptes ou livrets dédiés aident à voir ce qui est verrouillé pour un objectif.',
          'Dans l’application, les budgets annexes et les lignes d’investissement jouent un rôle proche de bacs mentaux séparés, tout en restant sur une seule vue de synthèse.',
        ],
      },
      {
        title: 'Constituer une épargne de précaution avant d’investir agressif',
        paragraphs: [
          'Avant d’augmenter fortement la part actions ou unités de compte, une liquidité accessible couvre les chocs (perte d’emploi, gros frais). Les guides citent souvent trois à six mois de charges : le bon montant dépend de votre stabilité de revenu.',
          'Une fois ce socle posé, le « surplus » peut être orienté vers des horizons plus longs, modélisés dans le module Estimations.',
        ],
      },
      {
        title: 'Limiter le coût des dettes à taux élevé',
        paragraphs: [
          'Découvert, carte revolving ou crédit conso coûteux absorbent une part importante du budget sans créer de patrimoine. Les stratégies « boule de neige » ou « avalanche » (voir la page stratégies patrimoine) aident à choisir un ordre de remboursement.',
          'Le simulateur permet de comparer un scénario avec dettes lourdes contre un scénario après remboursement accéléré.',
        ],
      },
      {
        title: 'Fixer trois horizons : moins d’un an, 1 à 7 ans, au-delà',
        paragraphs: [
          'Court terme : liquidité. Moyen terme : projets concrets (véhicule, apport immobilier). Long terme : retraite ou transmission. Cette segmentation évite d’investir en actions un budget nécessaire dans les douze prochains mois.',
          'La comparaison entre deux projets enregistrés dans Finance Pilot illustre bien l’impact d’un choix d’horizon sur les courbes.',
        ],
      },
    ],
    checklistTitle: 'Signaux que vos finances personnelles méritent un coup de projecteur',
    checklist: [
      'Solde courant qui diminue plusieurs mois d’affilée sans raison claire',
      'Recours régulier au découvert ou report de factures « non prioritaires »',
      'Absence totale d’épargne automatique malgré un revenu stable',
    ],
    closing:
      'Si un ou plusieurs points vous parlent, passez au simulateur : saisissez vos postes réels, puis utilisez la gestion mensuelle pour suivre les échéances au fil des semaines.',
  },
  en: {
    heroTitle: 'Managing personal finances: where to start',
    heroLead:
      'Clarify vocabulary and priorities (everyday vs goal cash, emergency savings, debt, short- and long-term horizons). This overview is general—it helps you frame questions before you enter numbers in Finance Pilot; it is not personalised advice.',
    imgSrc: '/guides/infographie-gestion-finances-personnelles-revenus-depenses.svg',
    imgAlt:
      'Infographic of personal finance balance: income arrows, fixed costs, savings and discretionary cash',
    figureCaption: 'Income, spending and savings on one schematic view.',
    sections: [
      {
        title: 'Split “everyday” cash from “goal” cash',
        paragraphs: [
          'Keeping all savings in the current account blurs trade-offs. Even without multiple banks, dedicated pots or savings accounts make it obvious what is earmarked.',
          'In Finance Pilot, annex budgets and investment lines act like labelled jars while still rolling up to one summary.',
        ],
      },
      {
        title: 'Build a buffer before taking high market risk',
        paragraphs: [
          'Before raising equity exposure, hold accessible cash for shocks (job loss, large repairs). Guides often cite three to six months of expenses—the right size depends on income volatility.',
          'Once the buffer exists, surplus cash can target longer horizons in Forecasts.',
        ],
      },
      {
        title: 'Cap the cost of expensive debt',
        paragraphs: [
          'Overdrafts, high-APR cards or costly consumer loans eat budget without building wealth. Snowball vs avalanche payoff strategies (see the wealth strategies page) help pick an order.',
          'The simulator can contrast heavy-debt vs accelerated-paydown scenarios.',
        ],
      },
      {
        title: 'Use three horizons: under a year, 1–7 years, beyond',
        paragraphs: [
          'Short: liquidity. Medium: concrete projects (car, house deposit). Long: retirement or legacy. This avoids investing in equities for cash you must spend within twelve months.',
          'Comparing two saved projects shows horizon choices on the curves.',
        ],
      },
    ],
    checklistTitle: 'Signals your household finances need attention',
    checklist: [
      'Current-account balance drifting down for several months without a clear cause',
      'Regular overdraft or deferring “non-urgent” bills',
      'No automated savings despite stable income',
    ],
    closing:
      'If any signal resonates, open the simulator: enter your real lines, then Monthly management to track due dates week by week.',
  },
}
