import type { Article } from './types'

/**
 * NEWS seed content — illustrative articles used to design the newsroom.
 * All flagged `placeholder: true`; replace with real announcements in the CMS.
 */
export const articles: Article[] = [
  {
    slug: { fr: 'un-ecosysteme-integre', en: 'one-integrated-ecosystem' },
    title: {
      fr: 'De l’aliment à l’assiette : FFH présente son modèle intégré',
      en: 'From feed to food: FFH presents its integrated model',
    },
    excerpt: {
      fr: 'Sept entreprises, cinq métiers, une seule chaîne de valeur. Le groupe dévoile une nouvelle identité et un nouveau site.',
      en: 'Seven companies, five stages, one value chain. The group unveils a new identity and a new website.',
    },
    category: 'corporate',
    date: '2026-10-01',
    author: 'FFH Communication',
    readingTime: 4,
    featured: true,
    content: {
      fr: [
        "FFH franchit une nouvelle étape dans l'affirmation de son modèle : celui d'un écosystème agro-industriel intégré, qui maîtrise chaque maillon de la filière avicole.",
        "De la nutrition animale avec SOFALIM, à l'accouvage avec SUDINDE, Poussins Essaouira et SONAVIC, à l'élevage avec MAROC DINDE et DAWAJINE SOUALEM, jusqu'à la transformation avec GOLDAVI, le groupe réunit désormais ses entreprises sous une même signature.",
        "Cette intégration permet une traçabilité complète, une régularité de qualité et une capacité d'investissement au service de toute la filière.",
      ],
      en: [
        'FFH takes a new step in asserting its model: an integrated agro-industrial ecosystem that masters every link of the poultry value chain.',
        'From animal nutrition with SOFALIM, to hatching with SUDINDE, Poussins Essaouira and SONAVIC, to farming with MAROC DINDE and DAWAJINE SOUALEM, through to processing with GOLDAVI, the group now brings its companies together under one signature.',
        'This integration delivers full traceability, consistent quality and investment capacity for the entire value chain.',
      ],
    },
    placeholder: true,
  },
  {
    slug: { fr: 'nouvelle-ligne-de-granulation', en: 'new-pelleting-line' },
    title: {
      fr: 'SOFALIM met en service une nouvelle ligne de granulation',
      en: 'SOFALIM commissions a new pelleting line',
    },
    excerpt: {
      fr: 'Une capacité accrue et une meilleure efficacité énergétique pour la nutrition de la filière.',
      en: 'Increased capacity and improved energy efficiency for the chain’s nutrition.',
    },
    category: 'achievement',
    date: '2026-09-12',
    author: 'SOFALIM',
    readingTime: 3,
    stage: 'nutrition',
    business: 'sofalim',
    content: {
      fr: [
        "La nouvelle ligne renforce la capacité de production d'aliments composés et réduit la consommation énergétique par tonne produite.",
        "Elle s'accompagne d'un renforcement du laboratoire de contrôle qualité.",
      ],
      en: [
        'The new line strengthens compound feed production capacity and reduces energy consumption per tonne.',
        'It comes with an upgraded quality control laboratory.',
      ],
    },
    placeholder: true,
  },
  {
    slug: { fr: 'biosecurite-couvoirs', en: 'hatchery-biosecurity' },
    title: {
      fr: 'Biosécurité : les couvoirs du groupe renforcent leurs protocoles',
      en: 'Biosecurity: group hatcheries strengthen their protocols',
    },
    excerpt: {
      fr: 'Zonage, marche en avant et contrôles microbiologiques harmonisés sur tous les sites.',
      en: 'Zoning, forward flow and microbiological controls harmonised across all sites.',
    },
    category: 'announcement',
    date: '2026-08-30',
    author: 'FFH Qualité',
    readingTime: 5,
    stage: 'hatchery',
    content: {
      fr: ['Les trois couvoirs du groupe partagent désormais un référentiel de biosécurité commun.'],
      en: ['The group’s three hatcheries now share a common biosecurity framework.'],
    },
    placeholder: true,
  },
  {
    slug: { fr: 'salon-avicole', en: 'poultry-fair' },
    title: {
      fr: 'FFH au salon de la filière avicole',
      en: 'FFH at the poultry industry fair',
    },
    excerpt: {
      fr: 'Le groupe présente son modèle intégré aux professionnels de la filière.',
      en: 'The group presents its integrated model to industry professionals.',
    },
    category: 'event',
    date: '2026-07-18',
    author: 'FFH Communication',
    readingTime: 2,
    content: {
      fr: ['Rencontres, conférences et démonstrations autour de la filière intégrée.'],
      en: ['Meetings, talks and demonstrations around the integrated value chain.'],
    },
    placeholder: true,
  },
  {
    slug: { fr: 'rapport-rse', en: 'csr-report' },
    title: {
      fr: 'Publication du premier rapport d’engagement du groupe',
      en: 'The group publishes its first commitment report',
    },
    excerpt: {
      fr: 'Bien-être animal, énergie, eau, emploi local : les engagements et indicateurs du groupe.',
      en: 'Animal welfare, energy, water, local employment: the group’s commitments and indicators.',
    },
    category: 'publication',
    date: '2026-06-05',
    author: 'FFH',
    readingTime: 6,
    content: {
      fr: ['Le rapport présente la démarche de responsabilité du groupe sur l’ensemble de la chaîne.'],
      en: ['The report sets out the group’s responsibility approach across the entire chain.'],
    },
    placeholder: true,
  },
  {
    slug: { fr: 'gamme-elabores', en: 'prepared-range' },
    title: {
      fr: 'GOLDAVI élargit sa gamme de produits élaborés',
      en: 'GOLDAVI expands its prepared foods range',
    },
    excerpt: {
      fr: 'De nouvelles références pour la grande distribution et la restauration.',
      en: 'New products for retail and food service.',
    },
    category: 'achievement',
    date: '2026-05-21',
    author: 'GOLDAVI',
    readingTime: 3,
    stage: 'food',
    business: 'goldavi',
    content: {
      fr: ['Marinés, panés et charcuterie de volaille rejoignent la gamme.'],
      en: ['Marinated, breaded and poultry cold cuts join the range.'],
    },
    placeholder: true,
  },
]
