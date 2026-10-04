import type { Job } from './types'

/** CAREERS seed content — sample positions to illustrate the listing. */
export const jobs: Job[] = [
  {
    id: 'nutritionist',
    title: { fr: 'Ingénieur(e) nutritionniste', en: 'Animal Nutritionist' },
    location: 'Berrechid',
    business: 'sofalim',
    department: { fr: 'Production', en: 'Production' },
    contract: 'CDI',
    description: {
      fr: 'Concevoir et optimiser les formules d’aliments pour volailles en lien avec les équipes élevage et qualité.',
      en: 'Design and optimise poultry feed formulas together with the farming and quality teams.',
    },
    requirements: {
      fr: ['Ingénieur agronome ou zootechnicien', '3 ans d’expérience en formulation', 'Maîtrise des logiciels de formulation'],
      en: ['Agronomy or animal science engineer', '3 years of formulation experience', 'Proficiency with formulation software'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-15',
  },
  {
    id: 'hatchery-manager',
    title: { fr: 'Responsable de couvoir', en: 'Hatchery Manager' },
    location: 'Essaouira',
    business: 'poussins-essaouira',
    department: { fr: 'Production', en: 'Production' },
    contract: 'CDI',
    description: {
      fr: 'Piloter l’activité d’incubation et d’éclosion, garantir la performance et la biosécurité du site.',
      en: 'Run incubation and hatching operations, ensuring site performance and biosecurity.',
    },
    requirements: {
      fr: ['Formation vétérinaire ou agronome', 'Expérience en accouvage', 'Management d’équipe'],
      en: ['Veterinary or agronomy background', 'Hatchery experience', 'Team management'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-02',
  },
  {
    id: 'vet',
    title: { fr: 'Vétérinaire d’élevage', en: 'Poultry Veterinarian' },
    location: 'Had Soualem',
    business: 'dawajine-soualem',
    department: { fr: 'Santé animale', en: 'Animal health' },
    contract: 'CDI',
    description: {
      fr: 'Assurer le suivi sanitaire des élevages et accompagner les éleveurs partenaires.',
      en: 'Monitor flock health and support partner farmers.',
    },
    requirements: {
      fr: ['Docteur vétérinaire', 'Spécialisation aviaire appréciée', 'Permis B'],
      en: ['Doctor of veterinary medicine', 'Poultry specialisation a plus', 'Driving licence'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-08-28',
  },
  {
    id: 'quality-engineer',
    title: { fr: 'Ingénieur(e) qualité agroalimentaire', en: 'Food Quality Engineer' },
    location: 'Mohammedia',
    business: 'goldavi',
    department: { fr: 'Qualité', en: 'Quality' },
    contract: 'CDI',
    description: {
      fr: 'Déployer le système HACCP et accompagner les certifications de l’unité de transformation.',
      en: 'Deploy the HACCP system and drive certifications at the processing plant.',
    },
    requirements: {
      fr: ['Ingénieur agroalimentaire', 'Connaissance ISO 22000 / HACCP', 'Rigueur et sens du terrain'],
      en: ['Food engineering degree', 'ISO 22000 / HACCP knowledge', 'Rigour and hands-on mindset'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-20',
  },
  {
    id: 'maintenance',
    title: { fr: 'Technicien(ne) de maintenance', en: 'Maintenance Technician' },
    location: 'Mohammedia',
    business: 'goldavi',
    department: { fr: 'Maintenance', en: 'Maintenance' },
    contract: 'CDD',
    description: {
      fr: 'Assurer la maintenance préventive et curative des lignes automatisées.',
      en: 'Carry out preventive and corrective maintenance of automated lines.',
    },
    requirements: {
      fr: ['Bac+2 électromécanique', 'Expérience en milieu industriel', 'Travail en équipes postées'],
      en: ['Two-year degree in electromechanics', 'Industrial experience', 'Shift work'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-10',
  },
  {
    id: 'controller',
    title: { fr: 'Contrôleur(se) de gestion groupe', en: 'Group Financial Controller' },
    location: 'Casablanca',
    business: 'ffh',
    department: { fr: 'Finance', en: 'Finance' },
    contract: 'CDI',
    description: {
      fr: 'Consolider le reporting des filiales et piloter la performance économique de la chaîne.',
      en: 'Consolidate subsidiary reporting and steer the economic performance of the chain.',
    },
    requirements: {
      fr: ['Formation école de commerce ou équivalent', '5 ans d’expérience', 'Excellent niveau Excel / ERP'],
      en: ['Business school degree or equivalent', '5 years of experience', 'Advanced Excel / ERP'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-25',
  },
  {
    id: 'intern-supply',
    title: { fr: 'Stage — Supply chain & logistique du froid', en: 'Internship — Supply chain & cold logistics' },
    location: 'Casablanca',
    business: 'goldavi',
    department: { fr: 'Logistique', en: 'Logistics' },
    contract: 'Stage',
    description: {
      fr: 'Contribuer à l’optimisation des flux de distribution sous température dirigée.',
      en: 'Help optimise temperature-controlled distribution flows.',
    },
    requirements: {
      fr: ['Étudiant(e) en école d’ingénieurs ou de commerce', 'Esprit analytique', '6 mois'],
      en: ['Engineering or business school student', 'Analytical mindset', '6 months'],
    },
    application: { email: 'careers@ffh.ma' },
    publishedAt: '2026-09-29',
  },
]
