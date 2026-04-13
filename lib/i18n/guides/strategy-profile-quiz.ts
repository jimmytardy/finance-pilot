import type { AppLocale } from '@/lib/seo-metadata'
import { sevenStrategiesCopy } from '@/lib/i18n/guides/sept-strategies-argent'

/** Indices alignés sur les sections du guide « 7 stratégies » (0–5) + synthèse (6). */
export const STRATEGY_PROFILE_SCORE_DIM = 7 as const

/** Écart max. avec le meilleur score pour garder une rubrique dans les propositions. */
const RECOMMEND_WITHIN_POINTS = 3
/** Nombre max. de rubriques proposées (hors égalités exceptionnelles). */
const RECOMMEND_MAX_STRATEGIES = 4

export type StrategyProfileRecommendations = {
  scores: number[]
  /** Indices triés par score décroissant, dans la fenêtre « proche du max ». */
  recommendedIndices: readonly number[]
  /** Premier indice (meilleur score). */
  primaryIndex: number
}

export type StrategyProfileQuizOption = {
  label: string
  weights: readonly number[]
}

export type StrategyProfileQuizQuestion = {
  id: string
  prompt: string
  options: readonly StrategyProfileQuizOption[]
}

export type StrategyProfileQuizModel = {
  heroTitle: string
  heroLead: string
  progressLabel: string
  back: string
  next: string
  seeResult: string
  restart: string
  resultTitle: string
  resultLead: string
  resultReadInGuide: string
  resultOpenFullGuide: string
  resultOpenSimulator: string
  disclaimer: string
  /** Une phrase par indice de stratégie (0–6), ton neutre. */
  resultBlurbs: readonly string[]
  questions: readonly StrategyProfileQuizQuestion[]
}

const w = (...scores: number[]) => scores as readonly number[]

const questionsFr: readonly StrategyProfileQuizQuestion[] = [
  {
    id: 'priorite',
    prompt: 'Quelle priorité vous concerne le plus aujourd’hui ?',
    options: [
      {
        label: 'Organiser mon budget (revenus, charges, enveloppes).',
        weights: w(5, 1, 0, 0, 1, 0, 1),
      },
      {
        label: 'Mettre de l’argent de côté automatiquement chaque mois.',
        weights: w(1, 5, 0, 0, 2, 0, 0),
      },
      {
        label: 'Penser long terme : moins dépenser, placements ou immobilier.',
        weights: w(0, 1, 3, 4, 2, 4, 2),
      },
      {
        label: 'Faire le point : je ne sais pas encore quoi prioriser.',
        weights: w(2, 2, 1, 1, 1, 1, 6),
      },
    ],
  },
  {
    id: 'revenus',
    prompt: 'Comment qualifier la stabilité des revenus du foyer sur les douze prochains mois ?',
    options: [
      {
        label: 'Revenus stables et prévisibles.',
        weights: w(1, 3, 2, 1, 2, 1, 0),
      },
      {
        label: 'Revenus plutôt stables, avec quelques variations.',
        weights: w(2, 2, 1, 1, 2, 1, 1),
      },
      {
        label: 'Revenus variables (activité indépendante, saisonnalité, primes importantes).',
        weights: w(3, 0, 0, 1, 1, 0, 3),
      },
      {
        label: 'Situation en transition (changement d’emploi, formation, interruption d’activité).',
        weights: w(2, 1, 0, 1, 1, 0, 4),
      },
    ],
  },
  {
    id: 'horizon',
    prompt: 'Quel horizon principal pour l’épargne investie (hors réserve de précaution) ?',
    options: [
      {
        label: 'Moins de cinq ans.',
        weights: w(2, 2, 0, 1, 3, 2, 1),
      },
      {
        label: 'Entre cinq et quinze ans.',
        weights: w(2, 2, 2, 2, 2, 2, 1),
      },
      {
        label: 'Plus de quinze ans.',
        weights: w(1, 1, 4, 3, 3, 0, 1),
      },
      {
        label: 'Pas d’exposition souhaitée aux marchés financiers pour l’instant.',
        weights: w(4, 2, 0, 0, 1, 2, 2),
      },
    ],
  },
  {
    id: 'volatilite',
    prompt: 'Si une fraction importante de l’épargne investie perdait environ 20 % sur un an, quelle réaction se rapproche le plus de votre position ?',
    options: [
      {
        label: 'Réévaluer la situation et réduire l’exposition aux actifs risqués.',
        weights: w(2, 2, 0, 2, 2, 2, 3),
      },
      {
        label: 'Maintenir le cap si le plan reste cohérent avec l’horizon fixé.',
        weights: w(1, 1, 1, 3, 2, 1, 2),
      },
      {
        label: 'Considérer la baisse comme acceptable dans une logique de long terme.',
        weights: w(0, 0, 4, 3, 3, 0, 1),
      },
      {
        label: 'Privilégier des supports peu volatils ou des actifs tangibles (hors actions directes).',
        weights: w(3, 2, 0, 0, 2, 3, 2),
      },
    ],
  },
  {
    id: 'temps',
    prompt: 'Quel temps est-il raisonnable de consacrer chaque mois au suivi du budget et des placements ?',
    options: [
      {
        label: 'Très limité (quelques dizaines de minutes).',
        weights: w(3, 4, 0, 1, 3, 0, 1),
      },
      {
        label: 'Quelques heures.',
        weights: w(2, 2, 1, 3, 2, 1, 1),
      },
      {
        label: 'Au moins une demi-journée pour analyser et ajuster.',
        weights: w(1, 1, 2, 5, 2, 2, 0),
      },
    ],
  },
]

const questionsEn: readonly StrategyProfileQuizQuestion[] = [
  {
    id: 'priorite',
    prompt: 'Which priority matters most to you right now?',
    options: [
      {
        label: 'Organise my budget (income, bills, sinking funds).',
        weights: w(5, 1, 0, 0, 1, 0, 1),
      },
      {
        label: 'Save automatically every month.',
        weights: w(1, 5, 0, 0, 2, 0, 0),
      },
      {
        label: 'Think long term: spend less, invest, or property.',
        weights: w(0, 1, 3, 4, 2, 4, 2),
      },
      {
        label: 'Still figuring out what to prioritise.',
        weights: w(2, 2, 1, 1, 1, 1, 6),
      },
    ],
  },
  {
    id: 'revenus',
    prompt: 'How would you describe household income stability over the next twelve months?',
    options: [
      {
        label: 'Stable and predictable.',
        weights: w(1, 3, 2, 1, 2, 1, 0),
      },
      {
        label: 'Mostly stable with some variation.',
        weights: w(2, 2, 1, 1, 2, 1, 1),
      },
      {
        label: 'Variable (self-employment, seasonality, large bonuses).',
        weights: w(3, 0, 0, 1, 1, 0, 3),
      },
      {
        label: 'In transition (job change, training, career break).',
        weights: w(2, 1, 0, 1, 1, 0, 4),
      },
    ],
  },
  {
    id: 'horizon',
    prompt: 'What is the main horizon for invested savings (excluding emergency cash)?',
    options: [
      {
        label: 'Under five years.',
        weights: w(2, 2, 0, 1, 3, 2, 1),
      },
      {
        label: 'Between five and fifteen years.',
        weights: w(2, 2, 2, 2, 2, 2, 1),
      },
      {
        label: 'More than fifteen years.',
        weights: w(1, 1, 4, 3, 3, 0, 1),
      },
      {
        label: 'No wish to take listed-market risk for now.',
        weights: w(4, 2, 0, 0, 1, 2, 2),
      },
    ],
  },
  {
    id: 'volatilite',
    prompt: 'If a material share of invested savings fell by about 20% in a year, which stance is closest?',
    options: [
      {
        label: 'Reassess and reduce exposure to risky assets.',
        weights: w(2, 2, 0, 2, 2, 2, 3),
      },
      {
        label: 'Hold the course if the plan still matches the stated horizon.',
        weights: w(1, 1, 1, 3, 2, 1, 2),
      },
      {
        label: 'Treat the drawdown as acceptable within a long-term logic.',
        weights: w(0, 0, 4, 3, 3, 0, 1),
      },
      {
        label: 'Prefer low-volatility sleeves or tangible assets (not direct equities).',
        weights: w(3, 2, 0, 0, 2, 3, 2),
      },
    ],
  },
  {
    id: 'temps',
    prompt: 'How much time can realistically be spent each month tracking budget and investments?',
    options: [
      {
        label: 'Very limited (a few tens of minutes).',
        weights: w(3, 4, 0, 1, 3, 0, 1),
      },
      {
        label: 'A few hours.',
        weights: w(2, 2, 1, 3, 2, 1, 1),
      },
      {
        label: 'At least half a day to analyse and adjust.',
        weights: w(1, 1, 2, 5, 2, 2, 0),
      },
    ],
  },
]

const frModel: StrategyProfileQuizModel = {
  heroTitle: 'Quelles stratégies correspondent le mieux à votre profil ?',
  heroLead:
    'Cinq questions : les réponses donnent des scores aux sept familles d’approches du guide. Plusieurs rubriques peuvent être proposées lorsque les scores restent proches ; tout cela est indicatif et ne remplace pas un conseil personnalisé.',
  progressLabel: 'Question {{current}} sur {{total}}',
  back: 'Retour',
  next: 'Suivant',
  seeResult: 'Voir le résultat',
  restart: 'Recommencer',
  resultTitle: 'Propositions',
  resultLead:
    'Selon vos réponses, les rubriques du guide ci-dessous ressortent avec les scores les plus élevés (jusqu’à quatre pistes lorsque plusieurs scores restent proches) :',
  resultReadInGuide: 'Ouvrir dans le guide',
  resultOpenSimulator: 'Ouvrir le simulateur',
  disclaimer:
    'Ce résultat est pédagogique : il s’appuie sur des pondérations simplifiées. Adaptez la démarche à votre situation juridique et fiscale ; en cas de doute, consultez un professionnel habilité.',
  resultBlurbs: [
    'Les réponses mettent l’accent sur une grille budgétaire lisible (règle 50 / 30 / 20) pour structurer les flux avant d’affiner.',
    'Les réponses orientent vers l’épargne systématique dès l’encaissement des revenus (« pay yourself first »).',
    'Les réponses suggèrent une ambition forte de taux d’épargne et d’autonomie à long terme (logique FIRE).',
    'Les réponses privilégient un portefeuille en deux niveaux : socle large et convictions limitées (cœur / satellites).',
    'Les réponses pointent vers une heuristique d’allocation actions / actifs prudents (règle des 100, à recaler avec le patrimoine global).',
    'Les réponses insistent sur la dimension immobilière ou les actifs tangibles dans la stratégie patrimoniale.',
    'Les réponses sont proches de plusieurs approches : la synthèse du guide permet d’en comparer les compromis avant de choisir.',
  ],
  questions: questionsFr,
}

const enModel: StrategyProfileQuizModel = {
  heroTitle: 'Which strategies best fit your profile?',
  heroLead:
    'Five questions score the seven approaches in the guide. Several sections may be suggested when scores stay close; this is indicative only—not personalised advice.',
  progressLabel: 'Question {{current}} of {{total}}',
  back: 'Back',
  next: 'Next',
  seeResult: 'See result',
  restart: 'Start over',
  resultTitle: 'Suggestions',
  resultLead:
    'Based on your answers, the guide sections below have the highest scores (up to four when several scores stay close):',
  resultReadInGuide: 'Open in guide',
  resultOpenFullGuide: 'Open the full guide',
  resultOpenSimulator: 'Open the simulator',
  disclaimer:
    'This outcome is educational: it uses simplified weights. Adapt any decision to your legal and tax context; seek a licensed professional when in doubt.',
  resultBlurbs: [
    'Your answers emphasise a readable budget grid (50/30/20) to structure flows before refining.',
    'Your answers point to systematic savings on income days (“pay yourself first”).',
    'Your answers suggest a high savings-rate, long-term autonomy path (FIRE-style framing).',
    'Your answers favour a two-layer portfolio: a broad core and limited conviction sleeves.',
    'Your answers align with an equity/steady-asset heuristic (“100 minus age”), to reconcile with total wealth.',
    'Your answers stress property or tangible assets in the wealth mix.',
    'Your answers sit near several approaches: read the synthesis to compare trade-offs before choosing.',
  ],
  questions: questionsEn,
}

export function strategyProfileQuizModel(locale: AppLocale): StrategyProfileQuizModel {
  return locale === 'en' ? enModel : frModel
}

export function strategyProfileResultTitles(locale: AppLocale): readonly string[] {
  const s = sevenStrategiesCopy(locale)
  return [...s.strategies.map((x) => x.title), s.conclusionTitle]
}

export function strategyProfileArticleHash(strategyIndex: number): string {
  if (strategyIndex >= 0 && strategyIndex <= 5) return `#strat-${strategyIndex}-title`
  return '#conclusion-title'
}

export function computeStrategyProfileRecommendations(
  questions: Pick<StrategyProfileQuizQuestion, 'options'>[],
  answers: readonly number[],
): StrategyProfileRecommendations {
  const scores = Array.from({ length: STRATEGY_PROFILE_SCORE_DIM }, () => 0)
  for (let i = 0; i < questions.length; i++) {
    const choice = answers[i]
    const opts = questions[i]?.options
    const opt = typeof choice === 'number' && opts?.[choice]
    if (!opt) continue
    for (let j = 0; j < STRATEGY_PROFILE_SCORE_DIM; j++) {
      scores[j] += opt.weights[j] ?? 0
    }
  }

  const ranked = scores
    .map((s, j) => ({ j, s }))
    .sort((a, b) => b.s - a.s)

  const maxScore = ranked[0]?.s ?? 0
  if (maxScore <= 0) {
    return { scores, recommendedIndices: [0], primaryIndex: 0 }
  }

  const withinBand = ranked.filter(({ s }) => s >= maxScore - RECOMMEND_WITHIN_POINTS)
  const capped = withinBand.slice(0, RECOMMEND_MAX_STRATEGIES)
  const recommendedIndices = capped.map(({ j }) => j)
  const primaryIndex = recommendedIndices[0] ?? 0

  return { scores, recommendedIndices, primaryIndex }
}

