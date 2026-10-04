import type { Group, Stage } from './types'

/**
 * GROUP seed content.
 * Figures flagged `placeholder: true` are indicative and must be replaced with
 * validated client data (they are editable fields in the CMS).
 */

export const stages: Stage[] = [
  {
    id: 'nutrition',
    index: 1,
    name: { fr: 'Nutrition', en: 'Nutrition' },
    verb: { fr: 'Formuler', en: 'Formulate' },
    description: {
      fr: "Céréales et matières premières entrent dans l'écosystème. Elles deviennent des aliments composés formulés pour chaque espèce et chaque âge.",
      en: 'Grains and raw materials enter the ecosystem. They become compound feed formulated for every species and every age.',
    },
    keywords: {
      fr: ['Céréales', 'Silos', 'Formulation', 'Granulés', 'Logistique'],
      en: ['Grains', 'Silos', 'Formulation', 'Pellets', 'Logistics'],
    },
    metric: {
      id: 'feed',
      value: 500,
      suffix: 'k',
      unit: { fr: 't / an', en: 't / year' },
      label: { fr: "d'aliments produits", en: 'of feed produced' },
      placeholder: true,
    },
    color: '#D1B572',
  },
  {
    id: 'hatchery',
    index: 2,
    name: { fr: 'Couvoir', en: 'Hatchery' },
    verb: { fr: 'Faire éclore', en: 'Hatch' },
    description: {
      fr: "Œufs à couver, incubation pilotée, naissance des poussins et des dindonneaux dans des couvoirs automatisés.",
      en: 'Hatching eggs, controlled incubation, and the birth of chicks and turkey poults in automated hatcheries.',
    },
    keywords: {
      fr: ['Œufs', 'Incubation', 'Éclosion', 'Poussins', 'Dindonneaux'],
      en: ['Eggs', 'Incubation', 'Hatching', 'Chicks', 'Turkey poults'],
    },
    metric: {
      id: 'chicks',
      value: 60,
      suffix: 'M',
      unit: { fr: 'poussins / an', en: 'chicks / year' },
      label: { fr: 'nés dans nos couvoirs', en: 'hatched in our facilities' },
      placeholder: true,
    },
    color: '#E9D6A6',
  },
  {
    id: 'farming',
    index: 3,
    name: { fr: 'Élevage', en: 'Farming' },
    verb: { fr: 'Élever', en: 'Raise' },
    description: {
      fr: "Les poussins et dindonneaux rejoignent des fermes à ambiance contrôlée, nourris par la nutrition du groupe et suivis par nos équipes vétérinaires.",
      en: 'Chicks and poults move into climate-controlled farms, fed by the group’s own nutrition and monitored by our veterinary teams.',
    },
    keywords: {
      fr: ['Fermes', 'Bâtiments', 'Ambiance contrôlée', 'Biosécurité', 'Éleveurs'],
      en: ['Farms', 'Barns', 'Controlled climate', 'Biosecurity', 'Farmers'],
    },
    metric: {
      id: 'farms',
      value: 120,
      prefix: '+',
      unit: { fr: 'bâtiments', en: 'barns' },
      label: { fr: "d'élevage", en: 'under management' },
      placeholder: true,
    },
    color: '#82A98A',
  },
  {
    id: 'transformation',
    index: 4,
    name: { fr: 'Transformation', en: 'Transformation' },
    verb: { fr: 'Transformer', en: 'Process' },
    description: {
      fr: "Abattage, découpe, contrôle qualité, conditionnement et chaîne du froid dans des installations industrielles aux standards sanitaires les plus stricts.",
      en: 'Slaughter, cutting, quality control, packaging and cold chain in industrial facilities built to the strictest sanitary standards.',
    },
    keywords: {
      fr: ['Abattage', 'Découpe', 'Contrôle qualité', 'Conditionnement', 'Chaîne du froid'],
      en: ['Slaughter', 'Cutting', 'Quality control', 'Packaging', 'Cold chain'],
    },
    metric: {
      id: 'processing',
      value: 12000,
      unit: { fr: 'volailles / heure', en: 'birds / hour' },
      label: { fr: 'capacité de transformation', en: 'processing capacity' },
      placeholder: true,
    },
    color: '#A9C2C0',
  },
  {
    id: 'food',
    index: 5,
    name: { fr: 'Alimentation', en: 'Food' },
    verb: { fr: 'Nourrir', en: 'Feed' },
    description: {
      fr: "Des produits finis — volailles entières, découpes, élaborés — distribués partout au Maroc, de la grande distribution à la restauration.",
      en: 'Finished products — whole birds, cuts and prepared foods — distributed across Morocco, from retail to food service.',
    },
    keywords: {
      fr: ['Produits finis', 'Distribution', 'Grande distribution', 'Restauration', 'Export'],
      en: ['Finished products', 'Distribution', 'Retail', 'Food service', 'Export'],
    },
    metric: {
      id: 'points',
      value: 8000,
      prefix: '+',
      unit: { fr: 'points de vente', en: 'points of sale' },
      label: { fr: 'au Maroc', en: 'across Morocco' },
      placeholder: true,
    },
    color: '#CC8A5C',
  },
]

export const group: Group = {
  name: 'FFH',
  legalName: 'Fettah Financial Holding',
  signature: { fr: 'De l’aliment à l’assiette.', en: 'From feed to food.' },
  vision: {
    fr: "Bâtir la filière avicole intégrée de référence au Maroc, et nourrir durablement les générations à venir.",
    en: 'To build Morocco’s reference integrated poultry value chain, and sustainably feed generations to come.',
  },
  mission: {
    fr: "Maîtriser chaque maillon — de la nutrition animale au produit fini — pour garantir qualité, traçabilité et accessibilité.",
    en: 'To master every link — from animal nutrition to finished product — guaranteeing quality, traceability and accessibility.',
  },
  values: [
    {
      id: 'integration',
      title: { fr: 'Intégration', en: 'Integration' },
      body: {
        fr: 'Chaque métier renforce le suivant. La performance du groupe est celle de la chaîne entière.',
        en: 'Every business strengthens the next. The group performs as one chain.',
      },
    },
    {
      id: 'precision',
      title: { fr: 'Précision', en: 'Precision' },
      body: {
        fr: 'Formulation, incubation, ambiance, froid : nos métiers se jouent au degré et au gramme près.',
        en: 'Formulation, incubation, climate, cold chain: our businesses are measured to the degree and the gram.',
      },
    },
    {
      id: 'trust',
      title: { fr: 'Confiance', en: 'Trust' },
      body: {
        fr: 'Traçabilité complète et exigence sanitaire, pour nos clients comme pour les consommateurs.',
        en: 'Full traceability and sanitary rigour, for our customers and for consumers.',
      },
    },
    {
      id: 'people',
      title: { fr: 'Engagement', en: 'Commitment' },
      body: {
        fr: 'Des milliers de collaborateurs et d’éleveurs partenaires, qui font vivre les territoires.',
        en: 'Thousands of employees and partner farmers, bringing regions to life.',
      },
    },
  ],
  figures: [
    {
      id: 'years',
      value: 30,
      prefix: '+',
      unit: { fr: 'ans', en: 'years' },
      label: { fr: "d'expérience agro-industrielle", en: 'of agro-industrial experience' },
      placeholder: true,
    },
    {
      id: 'people',
      value: 1500,
      prefix: '+',
      unit: { fr: 'collaborateurs', en: 'people' },
      label: { fr: 'dans le groupe', en: 'across the group' },
      placeholder: true,
    },
    {
      id: 'companies',
      value: 9,
      unit: { fr: 'entreprises', en: 'companies' },
      label: { fr: 'dont 7 dans la filière avicole', en: 'including 7 in the poultry chain' },
    },
    {
      id: 'sites',
      value: 25,
      prefix: '+',
      unit: { fr: 'sites', en: 'sites' },
      label: { fr: 'industriels et agricoles', en: 'industrial and agricultural' },
      placeholder: true,
    },
    {
      id: 'birds',
      value: 60,
      prefix: '+',
      suffix: 'M',
      unit: { fr: 'volailles / an', en: 'birds / year' },
      label: { fr: 'issues de nos couvoirs', en: 'from our hatcheries' },
      placeholder: true,
    },
    {
      id: 'feed',
      value: 500,
      suffix: 'k',
      unit: { fr: 'tonnes / an', en: 'tonnes / year' },
      label: { fr: "d'aliments composés", en: 'of compound feed' },
      placeholder: true,
    },
    {
      id: 'regions',
      value: 6,
      unit: { fr: 'régions', en: 'regions' },
      label: { fr: 'du Royaume', en: 'of the Kingdom' },
      placeholder: true,
    },
  ],
  story: [
    {
      id: 'foundation',
      period: '1990s',
      title: { fr: 'Fondation', en: 'Foundation' },
      heading: { fr: 'Tout commence par l’aliment.', en: 'It all begins with feed.' },
      body: {
        fr: "Le groupe naît d'une conviction simple : la qualité d'une filière se décide dès la nutrition. Une première unité de fabrication d'aliments composés pose les fondations du modèle.",
        en: 'The group is born from a simple conviction: the quality of a value chain is decided at the nutrition stage. A first compound feed mill lays the foundations of the model.',
      },
      stage: 'nutrition',
    },
    {
      id: 'expansion',
      period: '2000s',
      title: { fr: 'Expansion', en: 'Expansion' },
      heading: { fr: 'Remonter vers l’origine : le couvoir.', en: 'Moving upstream: the hatchery.' },
      body: {
        fr: "Pour garantir la régularité et la santé des élevages, le groupe investit dans l'accouvage — poussins de chair et dindonneaux — et sécurise ses approvisionnements.",
        en: 'To secure the consistency and health of flocks, the group invests in hatcheries — broiler chicks and turkey poults — and secures its supply.',
      },
      stage: 'hatchery',
    },
    {
      id: 'integration',
      period: '2010s',
      title: { fr: 'Intégration', en: 'Integration' },
      heading: { fr: 'Élever, sous un même standard.', en: 'Farming, under one standard.' },
      body: {
        fr: "Des fermes d'élevage de poulets et de dindes rejoignent l'écosystème. Nutrition, génétique et conduite d'élevage partagent désormais les mêmes protocoles.",
        en: 'Broiler and turkey farms join the ecosystem. Nutrition, genetics and husbandry now share the same protocols.',
      },
      stage: 'farming',
    },
    {
      id: 'scale',
      period: '2015 →',
      title: { fr: 'Échelle industrielle', en: 'Industrial scale' },
      heading: { fr: 'Transformer au plus près de la ferme.', en: 'Processing close to the farm.' },
      body: {
        fr: "Avec l'abattoir et l'unité de transformation, la chaîne se referme : chaque produit est traçable de l'aliment à l'assiette, dans une chaîne du froid continue.",
        en: 'With the slaughterhouse and processing plant, the chain closes: every product is traceable from feed to food, within an unbroken cold chain.',
      },
      stage: 'transformation',
    },
    {
      id: 'today',
      period: 'Aujourd’hui / Today',
      title: { fr: 'Aujourd’hui', en: 'Today' },
      heading: { fr: 'Un écosystème complet.', en: 'A complete ecosystem.' },
      body: {
        fr: "Sept entreprises, cinq métiers, une seule chaîne de valeur. FFH est l'un des acteurs intégrés de la filière avicole marocaine.",
        en: 'Seven companies, five stages, one value chain. FFH is one of the integrated players of the Moroccan poultry industry.',
      },
      stage: 'food',
    },
    {
      id: 'next',
      period: 'Next',
      title: { fr: 'Demain', en: 'Next' },
      heading: { fr: 'Nourrir l’avenir.', en: 'Feeding the future.' },
      body: {
        fr: "Produits élaborés, efficacité énergétique, digitalisation des élevages, nouveaux marchés : la prochaine décennie prolonge la chaîne vers de nouveaux horizons.",
        en: 'Prepared foods, energy efficiency, digital farming, new markets: the next decade extends the chain towards new horizons.',
      },
    },
  ],
  headquarters: {
    address: {
      fr: 'Siège social — adresse à confirmer, Casablanca, Maroc',
      en: 'Head office — address to be confirmed, Casablanca, Morocco',
    },
    city: 'Casablanca',
    phone: '+212 5 22 00 00 00',
    email: 'contact@ffh.ma',
    coords: { lat: 33.5731, lng: -7.5898 },
  },
  social: [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'Instagram', url: 'https://www.instagram.com/' },
  ],
}
