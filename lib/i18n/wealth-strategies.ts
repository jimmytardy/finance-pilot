import type { AppLocale } from '@/lib/seo-metadata'

export type WealthStrategyBlock = {
  title: string
  summary: string
  paragraphs: string[]
}

export type WealthStrategiesCopy = {
  heroTitle: string
  heroLead: string
  intro: string[]
  strategies: WealthStrategyBlock[]
  howToUseTitle: string
  howToUseBody: string[]
  disclaimerTitle: string
  disclaimerBody: string
  ctaLabel: string
}

const fr: WealthStrategiesCopy = {
  heroTitle: 'Budget et épargne : 50-30-20, enveloppes, fonds d’urgence et dettes',
  heroLead:
    'Guide pratique pour structurer vos choix : répartition des revenus, épargne automatique, enveloppes budgétaires, précaution, remboursement de dettes et objectifs par horizon. Contenu pédagogique, sans personnalisation à votre situation.',
  intro: [
    'Avant de chiffrer un scénario dans Finance Pilot, il est utile de clarifier une méthode : que voulez-vous prioriser (loyer, remboursements, épargne, projets) et sur quel horizon ? Les approches ci-dessous sont des cadres connus ; à vous de les adapter à votre foyer, à votre contrat de prêt et à votre appétit pour le risque sur les placements.',
    'Ces pages ne remplacent pas un conseiller en gestion de patrimoine (CIF) ni un plan personnalisé : elles servent à cadrer des discussions et des hypothèses que vous pourrez ensuite saisir dans l’application.',
  ],
  strategies: [
    {
      title: 'Règle 50-30-20 (besoins, envies, épargne)',
      summary:
        'Répartir le revenu net après impôt en trois parts indicatives : environ la moitié pour les besoins essentiels, 30 % pour le lifestyle, 20 % pour l’épargne et les projets.',
      paragraphs: [
        'La partie « besoins » couvre typiquement le logement, l’alimentation de base, les transports indispensables, les assurances obligatoires et les remboursements de dettes contractuels. La part « envies » regroupe loisirs, sorties, abonnements non vitaux. La part « épargne » inclut fonds d’urgence, projets à moyen terme et placements long terme.',
        'Les pourcentages sont des ordres de grandeur : dans une ville chère ou avec des enfants, la part « besoins » peut dépasser 50 % sans que ce soit « une erreur ». L’intérêt est surtout de vérifier qu’une fraction du revenu est explicitement affectée à l’épargne avant que le reste ne parte en dépenses discrétionnaires.',
      ],
    },
    {
      title: 'Payer d’abord son épargne (pay yourself first)',
      summary:
        'Automatiser des virements vers l’épargne et les placements dès la paie, avant de dépenser le solde disponible.',
      paragraphs: [
        'On fixe un montant ou un pourcentage cible (par exemple 10–15 % du net) vers un livret, une assurance-vie ou un PEA, puis on vit avec ce qui reste sur le compte courant. Cette discipline réduit le risque de finir le mois « par hasard » sans avoir épargné.',
        'Elle se combine bien avec la saisie des enveloppes dans Finance Pilot : vous pouvez modéliser l’effet d’un versement mensuel constant sur plusieurs années dans le module Estimations.',
      ],
    },
    {
      title: 'Méthode des enveloppes budgétaires',
      summary:
        'Attribuer chaque euro à une catégorie (loyer, courses, loisirs, vacances…) et ne dépenser que ce qui est alloué à l’enveloppe concernée.',
      paragraphs: [
        'Version « zéro-based » légère : à chaque début de mois, vous répartissez le revenu attendu entre postes jusqu’à ce que le total soit épuisé. Quand une enveloppe est vide, vous reportez une dépense au mois suivant ou vous réallouez consciemment depuis une autre enveloppe.',
        'Dans l’outil, les budgets annexes et les charges fixes jouent un rôle proche d’enveloppes nommées ; le calendrier mensuel aide à voir quand chaque poste doit sortir.',
      ],
    },
    {
      title: 'Fonds d’urgence (souvent 3 à 6 mois de charges)',
      summary:
        'Réserver de la liquidité facilement accessible avant d’augmenter fortement le risque sur les marchés.',
      paragraphs: [
        'L’objectif est d’absorber un choc (perte d’emploi, gros frais de santé ou de logement) sans vendre des placements au mauvais moment. Le montant cible dépend des revenus variables, du nombre de soutiens de revenu dans le foyer et du confort psychologique souhaité.',
        'Une fois ce socle posé, le « surplus » peut être orienté vers des objectifs de moyen ou long terme avec une logique de risque plus élevée si vous l’acceptez.',
      ],
    },
    {
      title: 'Rembourser les dettes : boule de neige vs avalanche',
      summary:
        'Deux logiques pour accélérer les remboursements : par montant minimal d’abord (motivation) ou par taux d’intérêt décroissant (coût total).',
      paragraphs: [
        'La méthode « boule de neige » attaque d’abord la plus petite dette pour libérer rapidement des mensualités et créer un effet psychologique positif. La méthode « avalanche » priorise la dette au taux le plus élevé pour minimiser les intérêts payés au global.',
        'Dans la pratique, un mélange est possible : sécuriser d’abord les découverts ou cartes au taux très élevé, puis passer à une stratégie plus « neige » sur le reste. Finance Pilot permet de comparer des scénarios avec ou sans crédit grâce au module Comparaison.',
      ],
    },
    {
      title: 'Objectifs par horizon (court, moyen, long terme)',
      summary:
        'Faire correspondre l’instrument (livret, fonds euros, actions) à la date à laquelle vous aurez besoin de l’argent.',
      paragraphs: [
        'Court terme (moins de deux ou trois ans) : privilégier la liquidité et la stabilité. Moyen terme (trois à dix ans) : mix prudent selon votre tolérance au risque. Long terme (retraite, transmission) : horizon qui peut supporter davantage de volatilité si vous acceptez les fluctuations.',
        'L’erreur fréquente est d’investir en actions un budget nécessaire dans les douze prochains mois : le calendrier des besoins doit guider l’allocation, pas l’inverse.',
      ],
    },
    {
      title: 'Versements réguliers sur les placements (effet lissage)',
      summary:
        'Investir une somme fixe chaque mois plutôt que d’essayer de « timer » les marchés.',
      paragraphs: [
        'Sur longue période, la moyenne d’achat peut lisser le prix d’entrée et réduit le stress lié aux pics de volatilité. Ce principe ne garantit ni gain ni absence de perte : il s’agit d’une discipline, pas d’une promesse de performance.',
        'Le module Estimations illustre l’effet cumulé de versements constants avec une hypothèse de rendement moyen : utile pour comprendre l’ordre de grandeur, pas pour prédire le futur.',
      ],
    },
    {
      title: 'Charge de logement et effort d’endettement',
      summary:
        'Repère prudent : une part trop élevée du revenu absorbée par le logement ou par l’ensemble des crédits limite la marge d’épargne.',
      paragraphs: [
        'Certaines banques ou guides citent un plafond indicatif du tiers du revenu net pour le logement, ou des ratios d’endettement global (crédits / revenus). Ce sont des repères de prudence, pas des lois : la situation familiale et les autres charges comptent autant.',
        'Si le logement pèse trop lourd, les leviers passent par le loyer, la surface, la colocation, la renégociation de prêt ou la modulation des autres postes — à modéliser dans vos données avant arbitrage.',
      ],
    },
    {
      title: 'Répartition indicative actions / obligations selon l’âge (règle du 100 moins l’âge)',
      summary:
        'Heuristique historique : soustraire son âge de 100 pour suggérer une part d’actifs risqués, le reste en actifs plus stables.',
      paragraphs: [
        'Exemple : à 40 ans, une répartition théorique 60 % « risqué » / 40 % « défensif ». Ce cadre est critiqué aujourd’hui car l’espérance de vie et les taux ont changé ; il reste utile comme point de départ de discussion, pas comme règle absolue.',
        'Votre véritable « bon » mix dépend de la date à laquelle vous retirerez l’argent, de votre stabilité d’emploi, de votre assurance-vie ou épargne salariale, et de votre capacité à tenir une baisse des marchés sans paniquer.',
      ],
    },
  ],
  howToUseTitle: 'Passer du cadre au chiffrage dans Finance Pilot',
  howToUseBody: [
    'Saisissez vos revenus, charges fixes, enveloppes budgétaires, biens locatifs et supports d’épargne dans Données, puis suivez le calendrier mensuel pour vérifier que votre plan tient dans le temps.',
    'Utilisez Estimations pour visualiser l’impact de versements réguliers sur un horizon long, et Comparaison pour confronter deux versions (par exemple plus d’épargne vs remboursement anticipé de prêt).',
  ],
  disclaimerTitle: 'Important',
  disclaimerBody:
    'Ces textes sont à visée éducative et générale. Ils ne constituent pas une recommandation personnalisée, un conseil en investissement ni une analyse adaptée à votre situation fiscale ou familiale. Faites valider tout projet important par un professionnel habilité si nécessaire.',
  ctaLabel: 'Ouvrir la saisie des données',
}

const en: WealthStrategiesCopy = {
  heroTitle: 'Budgeting and saving: 50/30/20, envelopes, emergency fund, and debt payoff',
  heroLead:
    'A practical guide to structure choices: income split, automated savings, envelope budgeting, emergency cash, debt snowball vs avalanche, and horizon goals. Educational content only—not personalised advice.',
  intro: [
    'Before modelling a scenario in Finance Pilot, it helps to pick a method: what do you want to prioritise (housing, debt paydown, savings, projects) and over what horizon? The approaches below are well-known patterns; adapt them to your household, loan contracts and risk tolerance for investments.',
    'These pages do not replace a licensed financial planner or tailored advice: they frame discussions and assumptions you can then enter in the app.',
  ],
  strategies: [
    {
      title: 'The 50/30/20 rule (needs, wants, savings)',
      summary:
        'Split take-home pay into three buckets: roughly half for essentials, 30% for lifestyle, 20% for savings and goals.',
      paragraphs: [
        '“Needs” typically cover housing, core groceries, essential transport, mandatory insurance and contractual debt payments. “Wants” cover discretionary spending. “Savings” covers emergency funds, medium-term goals and long-term investing.',
        'Percentages are guides—in a high-cost city or with children, “needs” can exceed 50% without being “wrong”. The point is to earmark part of income to savings before the remainder is spent by default.',
      ],
    },
    {
      title: 'Pay yourself first',
      summary:
        'Automate transfers to savings and investments on payday before spending what is left.',
      paragraphs: [
        'You set a target amount or percentage (for example 10–15% of net pay) to savings, ISA/pension wrappers or brokerage, then live on the current-account balance. That reduces the odds of ending the month without saving.',
        'It pairs well with envelope-style categories in Finance Pilot; Estimations can show the long-run effect of steady monthly contributions.',
      ],
    },
    {
      title: 'Envelope budgeting',
      summary:
        'Assign every pound or euro to a category and spend only from the envelope that matches the purchase.',
      paragraphs: [
        'A light “zero-based” approach: at the start of the month you allocate expected income to line items until nothing is unassigned. When an envelope is empty, you defer spending or consciously reallocate from another envelope.',
        'In the app, annex budgets and fixed expenses behave like named envelopes; the monthly calendar shows when each item is due.',
      ],
    },
    {
      title: 'Emergency fund (often 3–6 months of expenses)',
      summary:
        'Hold liquid, stable cash before increasing market risk.',
      paragraphs: [
        'The goal is to absorb shocks (job loss, major health or housing costs) without selling investments at a bad time. The right size depends on income volatility, earners in the household and personal comfort.',
        'Once the buffer exists, “surplus” cash can flow to medium- or long-term goals with higher risk if you accept volatility.',
      ],
    },
    {
      title: 'Debt payoff: snowball vs avalanche',
      summary:
        'Two accelerators: smallest balance first (motivation) or highest interest first (minimise total interest).',
      paragraphs: [
        'Snowball clears the smallest debt first to free cash flow quickly. Avalanche attacks the highest APR first to reduce lifetime interest.',
        'A hybrid is common: clear overdrafts or high-rate cards first, then snowball the remainder. Finance Pilot’s Compare view can contrast scenarios with different debt paths.',
      ],
    },
    {
      title: 'Goals by time horizon',
      summary:
        'Match the instrument (cash, bonds, equities) to when you need the money.',
      paragraphs: [
        'Short horizon (under ~2–3 years): favour liquidity and stability. Medium (3–10 years): cautious mix depending on risk tolerance. Long horizon (retirement, legacy): can bear more volatility if you can stay invested through drawdowns.',
        'A frequent mistake is investing in equities for cash you must spend within twelve months—needs dates should drive allocation, not the reverse.',
      ],
    },
    {
      title: 'Regular investing (averaging in)',
      summary:
        'Invest a fixed amount each month instead of trying to time markets.',
      paragraphs: [
        'Over long periods, averaging can smooth entry prices and reduce timing stress. It is a discipline, not a guarantee of profit or loss avoidance.',
        'Estimations charts illustrate cumulative effects of constant contributions with a mean-return assumption—useful for orders of magnitude, not forecasts.',
      ],
    },
    {
      title: 'Housing cost and debt-service ratios',
      summary:
        'Prudence rules: if housing or total debt absorbs too much income, savings margin shrinks.',
      paragraphs: [
        'Some lenders or guides cite ~one-third of net pay for housing, or caps on total debt-to-income. These are heuristics, not laws—family size and other obligations matter.',
        'If housing is heavy, levers include rent, space, flatmates, refinancing or trimming other categories—model the trade-offs in your data before deciding.',
      ],
    },
    {
      title: 'Indicative equity/bond split (e.g. “100 minus age”)',
      summary:
        'A historical rule of thumb: subtract age from 100 for a risky-asset share, the rest in steadier assets.',
      paragraphs: [
        'Example: at 40, a notional 60/40 split. Longevity and rates have changed the debate; treat it as a conversation starter, not gospel.',
        'Your true mix depends on when you withdraw, job stability, workplace pensions or ISAs, and whether you can tolerate market falls without selling in panic.',
      ],
    },
  ],
  howToUseTitle: 'From framework to numbers in Finance Pilot',
  howToUseBody: [
    'Enter income, fixed costs, annex budgets, rental properties and investments in Data, then use the monthly calendar to check the plan is realistic month by month.',
    'Use Estimations for long-horizon contribution effects and Compare to pit two versions against each other (e.g. more savings vs faster mortgage paydown).',
  ],
  disclaimerTitle: 'Important',
  disclaimerBody:
    'This content is general education. It is not personalised investment, tax or legal advice. Seek a qualified professional for major decisions.',
  ctaLabel: 'Open data entry',
}

export function wealthStrategiesCopy(locale: AppLocale): WealthStrategiesCopy {
  return locale === 'en' ? en : fr
}
