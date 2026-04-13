import type { AppLocale } from '@/lib/seo-metadata'

export type GuidesHubCard = {
  href: string
  title: string
  description: string
}

export type GuidesHubCopy = {
  heroTitle: string
  heroLead: string
  cards: GuidesHubCard[]
}

const fr: GuidesHubCopy = {
  heroTitle: 'Guides pour mieux gérer son argent au quotidien',
  heroLead:
    'Ces pages expliquent des méthodes courantes (étapes, budget, trésorerie, stratégies patrimoine). Ce sont des repères généraux : passez ensuite au simulateur Finance Pilot pour saisir vos montants et comparer des scénarios sur votre appareil.',
  cards: [
    {
      href: '/guides/finances-en-4-etapes',
      title: 'Finances en 4 étapes',
      description: 'Un chemin clair : voir ses flux, prioriser, automatiser, ajuster — inspiré des bonnes pratiques de planification budgétaire.',
    },
    {
      href: '/guides/7-strategies-gestion-argent',
      title: '7 stratégies de gestion d’argent',
      description:
        '50/30/20, épargne prioritaire, FIRE, cœur/satellite, règle des 100, immobilier : pour qui, avantages et compromis, puis recommandation pour passer à l’action.',
    },
    {
      href: '/guides/quelle-strategie-pour-mon-profil',
      title: 'Quelles stratégies pour votre profil ?',
      description:
        'Questionnaire en cinq questions : plusieurs rubriques du guide peuvent être proposées si les scores restent proches, avec liens vers chaque section.',
    },
    {
      href: '/guides/budget-tresorerie',
      title: 'Budget mensuel et trésorerie',
      description: 'Anticiper les sorties, lisser les pics et garder de la marge : le lien direct avec les modules Données et Gestion mensuelle.',
    },
    {
      href: '/strategies-patrimoine',
      title: 'Budget, épargne et dettes : méthodes clés',
      description:
        'Guide pratique : 50-30-20, épargne automatique, enveloppes, fonds d’urgence, remboursement de dettes et objectifs par horizon avant la saisie dans le simulateur.',
    },
  ],
}

const en: GuidesHubCopy = {
  heroTitle: 'Guides to manage everyday money more confidently',
  heroLead:
    'These articles explain common methods (steps, budgeting, cash flow, wealth strategies). They are general education—then open Finance Pilot to enter your own numbers and compare scenarios locally.',
  cards: [
    {
      href: '/guides/finances-en-4-etapes',
      title: 'Money in four steps',
      description: 'A clear path: see your flows, prioritise, automate, review—grounded in practical budgeting habits.',
    },
    {
      href: '/guides/7-strategies-gestion-argent',
      title: 'Seven money-management strategies',
      description:
        '50/30/20, pay yourself first, FIRE, core/satellite, “100 minus age”, property—profiles, upsides and trade-offs, plus how to act next.',
    },
    {
      href: '/guides/quelle-strategie-pour-mon-profil',
      title: 'Which strategies fit your profile?',
      description:
        'Five-question quiz: several guide sections may be suggested when scores stay close, with links to each chapter.',
    },
    {
      href: '/guides/budget-tresorerie',
      title: 'Monthly budget and cash flow',
      description: 'Anticipate bills, smooth spikes and keep slack—aligned with Data and Monthly management modules.',
    },
    {
      href: '/strategies-patrimoine',
      title: 'Budget, saving and debt: key methods',
      description:
        'Practical guide: 50/30/20, pay yourself first, envelopes, emergency funds, debt snowball vs avalanche, and horizon goals before you model them in the app.',
    },
  ],
}

export function guidesHubCopy(locale: AppLocale): GuidesHubCopy {
  return locale === 'en' ? en : fr
}
