import type { AppLocale } from '@/lib/seo-metadata'

export type StrategyBlock = {
  title: string
  interest: string
  profile: string
  advantages: string[]
  sacrifices: string[]
}

export type SevenStrategiesCopy = {
  heroTitle: string
  heroLead: string
  labels: { interest: string; profile: string; advantages: string; sacrifices: string }
  strategies: StrategyBlock[]
  conclusionTitle: string
  conclusionParagraphs: string[]
  recommendationTitle: string
  recommendationBody: string
}

const fr: SevenStrategiesCopy = {
  heroTitle: '7 stratégies de gestion d’argent : panorama, compromis et profils concernés',
  heroLead:
    'Aucune de ces approches n’est « la bonne » pour tout le monde : l’intérêt est de connaître les compromis (temps, discipline, risque, liquidité) avant d’arbitrer. Comparez toujours avec votre situation réelle, votre horizon et votre tolérance au stress financier.',
  labels: {
    interest: 'Intérêt principal',
    profile: 'Profils pour lesquels cette approche est particulièrement adaptée',
    advantages: 'Avantages',
    sacrifices: 'Sacrifices ou limites',
  },
  strategies: [
    {
      title: '1. La règle 50 / 30 / 20',
      interest:
        'Donner une ossature simple au budget : une part pour le nécessaire, une pour le plaisir, une pour l’avenir. Très pédagogique pour passer du « je vis au jour le jour » à « je réserve explicitement une part à l’épargne ».',
      profile:
        'Revenus relativement stables, foyer recherchant une première grille budgétaire sans tableur complexe. Moins adaptée si le logement ou les crédits absorbent déjà bien plus de 50 % du net.',
      advantages: [
        'Lisible en une phrase, transmissible clairement aux autres membres du foyer, y compris les enfants.',
        'Conduit à définir explicitement une part d’épargne avant les dépenses discrétionnaires.',
        'Bon point de départ avant d’affiner avec des enveloppes ou un suivi mensuel.',
      ],
      sacrifices: [
        'Les pourcentages sont indicatifs : les « 50 % besoins » peuvent être irréalistes dans les zones à loyers ou prix d’achat élevés ou avec plusieurs enfants à charge.',
        'Ne précise pas quels supports d’épargne retenir (livret, assurance-vie, actions) : il s’agit d’une répartition, et non d’un plan d’investissement.',
      ],
    },
    {
      title: '2. Pay yourself first (se payer en premier)',
      interest:
        'Automatiser l’épargne et les placements dès l’arrivée des revenus, avant de dépenser le reste. Réduit le risque de clôturer le mois sans épargne planifiée en amont.',
      profile:
        'Personnes avec revenu régulier et discipline d’exécution (virements programmés). Idéal si vous savez déjà un montant minimum à épargner chaque mois.',
      advantages: [
        'Effet cumulé puissant sur plusieurs années sans arbitrage à répéter à chaque versement de revenu.',
        'Compatible avec la règle 50/30/20 : la part « 20 » peut être versée automatiquement.',
        'Diminue la tentation de réduire l’épargne lorsque les dépenses discrétionnaires augmentent.',
      ],
      sacrifices: [
        'Peut tendre fortement le compte courant lorsque les charges ont été sous-estimées ou lorsque le montant automatique est trop ambitieux.',
        'Nécessite une réserve de trésorerie ou une marge pour éviter le découvert en cas d’imprévu.',
      ],
    },
    {
      title: '3. FIRE (indépendance financière, retraite anticipée)',
      interest:
        'Viser un capital ou des revenus passifs suffisants pour que le travail devienne optionnel avant l’âge légal de départ à la retraite. Met l’accent sur le taux d’épargne et la sobriété de dépenses.',
      profile:
        'Personnes prêtes à optimiser fortement dépenses et fiscalité sur la durée, souvent avec revenus moyens à élevés et forte motivation. Moins réaliste si charges incompressibles (santé, aidance familiale).',
      advantages: [
        'Clarifie un objectif chiffrable (capital cible, dépenses annuelles) et accélère l’épargne.',
        'Encourage la connaissance détaillée des postes de dépenses et l’investissement de long terme.',
      ],
      sacrifices: [
        'Souvent des années de vie plus frugale ou de choix de carrière/confort à revoir.',
        'Dépend fortement des hypothèses de rendement, d’inflation et de régimes fiscaux : la trajectoire peut s’avérer plus longue que prévu.',
        'Risque de sur-optimisation : oublier le plaisir du présent ou la flexibilité familiale.',
      ],
    },
    {
      title: '4. Portefeuille « cœur » et satellites (core / satellite)',
      interest:
        'Garder une base large et peu coûteuse (indices mondiaux ou zone euro) pour la majeure partie du capital, et n’exposer qu’une petite part à des thèmes ou titres plus risqués. Clarifie ce qui relève du socle et ce qui relève d’une prise de risque ciblée.',
      profile:
        'Investisseurs qui veulent limiter le temps passé sur le cœur du portefeuille tout en gardant une partie « conviction » ou sectorielle.',
      advantages: [
        'Réduit le risque de mauvaise sélection sur l’essentiel du patrimoine financier.',
        'Les satellites peuvent satisfaire l’envie d’agir sans mettre en danger toute la stratégie.',
      ],
      sacrifices: [
        'Les satellites peuvent sous-performer longtemps : il convient d’accepter une exposition résiduelle, souvent volatile, à incidence limitée sur la performance globale du portefeuille.',
        'Nécessite de fixer des plafonds (ex. 5–10 % du total) et de ne pas les augmenter après une série de gains.',
      ],
    },
    {
      title: '5. La règle des 100 (moins l’âge en actions)',
      interest:
        'Heuristique historique : soustraire son âge de 100 pour suggérer une part d’actifs risqués (actions), le reste en actifs plus stables. Fournit un ordre de grandeur indicatif, utile pour amorcer la discussion entre audace et prudence.',
      profile:
        'Investisseurs long terme qui cherchent un point de départ avant d’affiner avec leur horizon de retrait réel.',
      advantages: [
        'Rappel utile : plus l’horizon de placement est long, plus une exposition aux actifs volatils paraît acceptable.',
        'Simple à communiquer entre conjoints ou avec un conseiller.',
      ],
      sacrifices: [
        'Datée : l’espérance de vie et les taux d’intérêt ont changé ; la « bonne » part actions dépend surtout de la date à laquelle vous vendrez.',
        'N’intègre pas l’épargne salariale, l’immobilier déjà détenu ni les rentes : ces éléments doivent être réconciliés avec le patrimoine global.',
      ],
    },
    {
      title: '6. L’immobilier dans la stratégie patrimoniale',
      interest:
        'Utiliser la pierre (résidence principale, locatif, SCPI) pour diversifier, capter du loyer ou du rendement, parfois avec effet de levier. Peut stabiliser une partie du patrimoine hors marchés actions.',
      profile:
        'Personnes prêtes à la liquidité réduite, aux travaux et à la fiscalité du locatif ; revenus suffisants pour absorber des vacances locatives ou des coûts d’entretien.',
      advantages: [
        'Actif tangible, parfois apprécié psychologiquement par rapport aux seuls comptes-titres.',
        'Le locatif peut générer des flux complémentaires (sous réserve de flux de trésorerie nets réels après crédit et charges).',
      ],
      sacrifices: [
        'Concentration géographique ou sectorielle, frais d’entrée et de sortie élevés.',
        'Effort de temps (gestion, travaux) ou coût d’une délégation à une société de gestion.',
        'Le crédit augmente le risque : une baisse de revenus ou la hausse des taux sur des emprunts à taux variable peuvent peser fortement sur la trésorerie du foyer.',
      ],
    },
  ],
  conclusionTitle: '7. Synthèse : pourquoi connaître ces stratégies ?',
  conclusionParagraphs: [
    'Ces cadres se complètent : le 50/30/20 et le « pay yourself first » aident à libérer de l’épargne ; la règle des 100 et le core/satellite orientent la partie investie ; le FIRE fixe une ambition de taux d’épargne ; l’immobilier ajoute une dimension patrimoniale et illiquide.',
    'L’objectif n’est pas d’appliquer simultanément toutes ces approches, mais de retenir un à trois leviers cohérents avec la personnalité financière du foyer (priorité au présent ou aux projets de long terme, tolérance au risque, temps disponible pour le suivi).',
  ],
  recommendationTitle: 'Recommandation pratique',
  recommendationBody:
    'Contrôlez vos hypothèses dans Finance Pilot : saisissez les flux et les charges, fixez une épargne automatique réaliste, modélisez l’immobilier et les placements sur 10 à 30 ans, puis comparez deux versions (par exemple hausse de l’épargne systématique face à un remboursement anticipé de dettes). Lorsqu’une décision engage une part substantielle du patrimoine ou des revenus, faites-la valider par un professionnel habilité.',
}

const en: SevenStrategiesCopy = {
  heroTitle: 'Seven money-management strategies worth knowing',
  heroLead:
    'None of these is universally “the right one”: the point is to understand trade-offs (time, discipline, risk, liquidity) before you commit. Always map them to your real income, horizon and stress tolerance.',
  labels: {
    interest: 'Main benefit',
    profile: 'Who it tends to suit',
    advantages: 'Upsides',
    sacrifices: 'Trade-offs or downsides',
  },
  strategies: [
    {
      title: '1. The 50/30/20 rule',
      interest:
        'A simple budget skeleton: needs, wants, future. Great for moving from “I spend what’s left” to “I earmark savings on purpose.”',
      profile:
        'Stable earners who want a first grid without a heavy spreadsheet. Less helpful if housing or debt already eats far more than half of take-home pay.',
      advantages: [
        'Easy to explain to a partner or family.',
        'Forces a savings slice before discretionary spend.',
        'A good stepping stone before envelopes or a monthly calendar.',
      ],
      sacrifices: [
        'Percentages are indicative: “50% needs” may be unrealistic in high-cost areas or with children.',
        'It does not tell you which products to buy (cash, funds, equities)—allocation only, not an investment plan.',
      ],
    },
    {
      title: '2. Pay yourself first',
      interest:
        'Automate savings and investments on payday before spending what remains. Cuts the odds of ending the month without saving.',
      profile:
        'People with predictable income and execution discipline (standing orders). Works well when you already know a minimum monthly amount to set aside.',
      advantages: [
        'Compounds quietly over years without a monthly willpower battle.',
        'Pairs with 50/30/20: the “20” can leave automatically.',
        'Reduces the temptation to trim savings when lifestyle inflation appears.',
      ],
      sacrifices: [
        'Can squeeze the current account if bills are underestimated or the auto amount is too aggressive.',
        'Needs a buffer to avoid overdrafts when surprises hit.',
      ],
    },
    {
      title: '3. FIRE (financial independence, retire early)',
      interest:
        'Target passive income or capital so work becomes optional before statutory retirement age. Emphasises savings rate and spending restraint.',
      profile:
        'People willing to optimise spending and taxes for many years—often mid-to-high earners with strong motivation. Harder if costs are structurally high (health, caregiving).',
      advantages: [
        'Makes the goal numeric (capital target, annual spend) and accelerates saving.',
        'Builds deep awareness of spending and long-horizon investing.',
      ],
      sacrifices: [
        'Often years of leaner living or trade-offs on career and comfort.',
        'Highly sensitive to return, inflation and tax assumptions—the path may be longer than spreadsheets suggest.',
        'Risk of over-optimisation: missing present enjoyment or family flexibility.',
      ],
    },
    {
      title: '4. Core and satellite portfolios',
      interest:
        'Keep a broad, low-cost core (global or regional index funds) for most capital, and only a small sleeve for riskier themes or single names. Separates “bet” from foundation.',
      profile:
        'Investors who want minimal upkeep on the core but still keep a “conviction” bucket.',
      advantages: [
        'Limits stock-picking damage on the bulk of wealth.',
        'Satellites satisfy the urge to act without betting the whole plan.',
      ],
      sacrifices: [
        'Satellites may lag for long stretches—you must accept a volatile or “hobby” sleeve.',
        'Requires caps (e.g. 5–10% of total) and discipline not to raise them after wins.',
      ],
    },
    {
      title: '5. The “100 minus age” rule (equities share)',
      interest:
        'A classic heuristic: subtract your age from 100 for a rough equity share, the rest in steadier assets. A conversation starter between youth and prudence.',
      profile:
        'Long-term investors who want a starting point before refining with their real withdrawal date.',
      advantages: [
        'Reminds you that longer horizons can tolerate more volatility.',
        'Simple to align with a partner or adviser.',
      ],
      sacrifices: [
        'Dated: longevity and rates have changed; the right equity share depends on when you actually sell.',
        'Ignores workplace pensions, rental property or annuities—recalibrate for total wealth.',
      ],
    },
    {
      title: '6. Property in the wealth mix',
      interest:
        'Use bricks-and-mortar (home, buy-to-let, REITs/SCPI-style wrappers) to diversify, capture rent or yield, sometimes with leverage. Can anchor part of wealth off pure equity markets.',
      profile:
        'People comfortable with lower liquidity, maintenance and landlord tax rules; income that can weather void periods and repairs.',
      advantages: [
        'Tangible asset—some households prefer it to screens of tickers.',
        'Rental can add cash flow (after mortgage, tax and maintenance—cash flow must be real).',
      ],
      sacrifices: [
        'Geographic or sector concentration; high entry and exit costs.',
        'Time cost (DIY management) or money cost (property managers).',
        'Leverage raises risk if income falls or variable rates bite.',
      ],
    },
  ],
  conclusionTitle: '7. Pulling it together',
  conclusionParagraphs: [
    'These frameworks complement each other: 50/30/20 and pay-yourself-first free cash to save; “100 minus age” and core/satellite shape the invested slice; FIRE pushes the savings-rate ambition; property adds an illiquid, tangible leg.',
    'You rarely should do everything at once—pick one to three levers that match your personality (present enjoyment vs long projects, risk taste, time available).',
  ],
  recommendationTitle: 'Practical recommendation',
  recommendationBody:
    'Stress-test assumptions in Finance Pilot: enter income and bills, set a realistic auto-saving amount, model property and portfolios over 10–30 years, then compare two versions (e.g. more saving vs faster mortgage paydown). If a choice locks up a large share of wealth or income, validate it with a licensed professional.',
}

export function sevenStrategiesCopy(locale: AppLocale): SevenStrategiesCopy {
  return locale === 'en' ? en : fr
}
