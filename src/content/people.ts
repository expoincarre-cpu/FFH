import type { Person } from './types'

/**
 * PEOPLE seed content — names and biographies are placeholders to be replaced
 * with the validated governance information supplied by the group.
 */
const role = (fr: string, en: string) => ({ fr, en })

export const people: Person[] = [
  {
    id: 'chairman',
    name: 'Abdelmoula Fettah',
    position: role('Président-Directeur Général', 'Chairman & Chief Executive Officer'),
    department: role('Conseil d’administration & Direction générale', 'Board of Directors & Executive Management'),
    biography: {
      fr: "Fondateur de Fettah Financial Holding, Abdelmoula Fettah a conduit l'intégration progressive de la filière, de la nutrition animale à la transformation. Il préside le Conseil d'administration et dirige le groupe. Biographie détaillée à compléter.",
      en: 'Founder of Fettah Financial Holding, Abdelmoula Fettah has led the progressive integration of the value chain, from animal nutrition to processing. He chairs the Board of Directors and leads the group. Detailed biography to be completed.',
    },
    portrait: undefined,
    body: 'board',
    order: 1,
    placeholder: true,
  },
  {
    id: 'cfo',
    name: 'Prénom Nom',
    position: role('Direction Administrative et Financière', 'Chief Financial Officer'),
    department: role('Finance', 'Finance'),
    biography: {
      fr: 'En charge des finances, du contrôle de gestion et des investissements industriels. Biographie à compléter.',
      en: 'In charge of finance, management control and industrial investment. Biography to be completed.',
    },
    body: 'executive',
    order: 3,
    placeholder: true,
  },
  {
    id: 'coo',
    name: 'Prénom Nom',
    position: role('Direction des Opérations', 'Chief Operating Officer'),
    department: role('Opérations industrielles', 'Industrial Operations'),
    biography: {
      fr: 'Supervise la performance industrielle, de la fabrication d’aliments à la transformation. Biographie à compléter.',
      en: 'Oversees industrial performance, from feed manufacturing to processing. Biography to be completed.',
    },
    body: 'executive',
    order: 4,
    placeholder: true,
  },
  {
    id: 'quality',
    name: 'Prénom Nom',
    position: role('Direction Qualité & Sécurité Sanitaire', 'Head of Quality & Food Safety'),
    department: role('Qualité', 'Quality'),
    biography: {
      fr: 'Garantit la traçabilité et la conformité sanitaire sur l’ensemble de la chaîne. Biographie à compléter.',
      en: 'Ensures traceability and sanitary compliance across the entire chain. Biography to be completed.',
    },
    body: 'executive',
    order: 5,
    placeholder: true,
  },
  {
    id: 'hr',
    name: 'Prénom Nom',
    position: role('Direction des Ressources Humaines', 'Chief People Officer'),
    department: role('Ressources humaines', 'Human Resources'),
    biography: {
      fr: 'Porte la politique talents, formation et culture du groupe. Biographie à compléter.',
      en: 'Leads the group’s talent, training and culture policy. Biography to be completed.',
    },
    body: 'executive',
    order: 6,
    placeholder: true,
  },
]
