import type { GuideArticleBundle } from '@/lib/i18n/guides/article-types'

export const finances4EtapesArticle: GuideArticleBundle = {
  fr: {
    heroTitle: 'Bien gérer ses finances en 4 étapes',
    heroLead:
      'Quatre étapes reprises dans de nombreux blogs et médias grand public : elles ne remplacent pas un conseiller, mais donnent un fil conducteur avant d’utiliser un simulateur comme Finance Pilot.',
    imgSrc: '/guides/diagramme-finances-4-etapes-budget.svg',
    imgAlt:
      'Schéma budget personnel en quatre étapes : connaître ses flux, fixer des priorités, automatiser l’épargne et ajuster chaque mois',
    figureCaption: 'Vue synthétique des quatre étapes pour structurer son budget personnel.',
    sections: [
      {
        title: 'Étape 1 — Prendre la mesure de ses flux',
        paragraphs: [
          'Listez les revenus nets récurrents (salaire, allocations, loyers perçus) et les charges fixes (loyer ou crédit, assurances, transports, abonnements). Ajoutez une estimation réaliste des dépenses variables (courses, loisirs).',
          'Sans cette photo du mois, tout le reste repose sur des intuitions. Dans Finance Pilot, cette étape correspond à la page Données : une fois les montants saisis, le tableau met à jour le disponible et les agrégats utiles pour la suite.',
        ],
      },
      {
        title: 'Étape 2 — Fixer des priorités et un minimum d’épargne',
        paragraphs: [
          'Décidez ce qui est non négociable ce mois-ci : loyer, remboursements, cotisations, fonds d’urgence à alimenter. Ensuite seulement, répartissez le reste entre projets (vacances, équipement) et loisirs.',
          'Une règle connue comme le 50-30-20 (besoins, envies, épargne) peut servir de grille de lecture, même si vos pourcentages réels diffèrent selon votre ville ou votre famille.',
        ],
      },
      {
        title: 'Étape 3 — Automatiser ce qui peut l’être',
        paragraphs: [
          'Virements automatiques vers un livret ou un support d’épargne, prélèvements alignés sur les dates de paie, rappels pour les factures moins fréquentes : l’objectif est de réduire la charge mentale et les oublis coûteux.',
          'Le module Gestion mensuelle de l’application reprend cette logique d’échéancier : vous visualisez ce qui doit sortir et ce qui est déjà réglé.',
        ],
      },
      {
        title: 'Étape 4 — Ajuster chaque mois sans culpabiliser',
        paragraphs: [
          'Un budget est une hypothèse : une dépense imprévue ou un revenu en retard arrive toujours. Reconduisez l’exercice en fin de mois : qu’est-ce qui a dérivé ? Faut-il revoir une enveloppe ou une échéance ?',
          'L’important est la régularité du suivi, pas la perfection du premier jet. Les vues Estimations et Comparaison permettent ensuite de traduire ces ajustements en projections sur plusieurs années.',
        ],
      },
    ],
    checklistTitle: 'Check-list rapide avant d’ouvrir le simulateur',
    checklist: [
      'Relevés ou exports bancaires des deux derniers mois',
      'Montants des crédits en cours (mensualité, taux si vous les avez)',
      'Une idée de vos objectifs (épargne de précaution, projet à 12 mois, horizon retraite)',
    ],
    closing:
      'Prêt à passer à la pratique ? Utilisez le bouton « Accéder au simulateur » en haut de page pour ouvrir la saisie des données, puis enchaînez avec la gestion mensuelle pour suivre vos échéances.',
  },
  en: {
    heroTitle: 'Manage your money in four practical steps',
    heroLead:
      'Four steps you will see across many personal-finance guides: they are not personalised advice, but a simple roadmap before you use a tool like Finance Pilot.',
    imgSrc: '/guides/diagramme-finances-4-etapes-budget.svg',
    imgAlt:
      'Diagram of four personal budget steps: know your flows, set priorities, automate savings, review monthly',
    figureCaption: 'A compact view of the four-step budgeting frame.',
    sections: [
      {
        title: 'Step 1 — Measure your inflows and outflows',
        paragraphs: [
          'List net recurring income (salary, benefits, rent received) and fixed costs (housing, insurance, transport, subscriptions). Add a realistic estimate for variable spending (groceries, leisure).',
          'Without this snapshot, the rest is guesswork. In Finance Pilot this maps to the Data page: once amounts are entered, the sheet updates cash available and helpful aggregates.',
        ],
      },
      {
        title: 'Step 2 — Set priorities and a minimum savings rate',
        paragraphs: [
          'Decide what is non-negotiable this month: housing, repayments, contributions, topping up an emergency buffer. Only then allocate the remainder to projects and discretionary spend.',
          'Rules like 50/30/20 (needs, wants, savings) can be a useful lens even if your actual split differs by city or household size.',
        ],
      },
      {
        title: 'Step 3 — Automate what you can',
        paragraphs: [
          'Automatic transfers to savings, bill dates aligned with paydays, reminders for infrequent invoices: the goal is fewer forgotten payments and less mental load.',
          'The Monthly management module mirrors this with a payment calendar and checkboxes when items clear.',
        ],
      },
      {
        title: 'Step 4 — Review monthly without guilt',
        paragraphs: [
          'A budget is a hypothesis: surprises happen. Run a short month-end review: what drifted? Should an envelope or a due date change?',
          'Consistency beats a perfect first draft. Forecasts and Compare then translate those tweaks into multi-year projections.',
        ],
      },
    ],
    checklistTitle: 'Quick checklist before opening the simulator',
    checklist: [
      'Bank statements or exports for the last two months',
      'Loan payments (installment and rate if you know it)',
      'A rough list of goals (emergency buffer, 12-month project, retirement horizon)',
    ],
    closing:
      'Ready to model it? Use “Open the simulator” at the top to start Data entry, then Monthly management to track due dates.',
  },
}
