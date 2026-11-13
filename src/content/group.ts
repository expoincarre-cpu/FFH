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
  signature: { fr: 'Un héritage de valeur. Une vision pour demain.', en: 'A Legacy of Value. A Vision for Tomorrow.' },
  // Draft prepared for validation by the Chairman's office.
  chairman: {
    name: 'Abdelmoula Fettah',
    title: { fr: 'Président-Directeur Général', en: 'Chairman & Chief Executive Officer' },
    placeholder: true,
    message: {
      fr: [
        "Depuis plus de trois décennies, notre groupe s'est construit sur une conviction : la qualité de ce qui arrive dans l'assiette des familles marocaines se décide bien en amont, dès la nutrition animale.",
        "C'est cette conviction qui nous a conduits à maîtriser, maillon après maillon, l'ensemble de la filière avicole — de la fabrication d'aliments à l'accouvage, de l'élevage à la transformation. Cette intégration n'est pas une fin en soi : elle est la garantie d'une traçabilité complète, d'une exigence sanitaire constante et d'une performance durable pour nos partenaires.",
        "Notre force, ce sont avant tout les femmes et les hommes qui font vivre nos sites chaque jour, ainsi que les éleveurs, fournisseurs et clients qui nous accordent leur confiance. Ensemble, nous poursuivrons notre développement avec le même sens des responsabilités envers nos territoires, nos collaborateurs et les générations futures.",
        "Nourrir un pays est une mission qui oblige. Nous l'assumons avec fierté, rigueur et ambition.",
      ],
      en: [
        'For more than three decades, our group has been built on one conviction: the quality of what reaches the tables of Moroccan families is decided far upstream, starting with animal nutrition.',
        'This conviction led us to master, link by link, the entire poultry value chain — from feed manufacturing to hatching, from farming to processing. Integration is not an end in itself: it is the guarantee of full traceability, uncompromising food safety and lasting performance for our partners.',
        'Our strength lies first in the women and men who bring our sites to life every day, and in the farmers, suppliers and customers who place their trust in us. Together, we will continue to grow with the same sense of responsibility towards our regions, our people and future generations.',
        'Feeding a country is a mission that commands respect. We embrace it with pride, rigour and ambition.',
      ],
    },
  },
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
      value: 7,
      unit: { fr: 'entreprises', en: 'companies' },
      label: { fr: 'une filière intégrée', en: 'one integrated chain' },
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
        fr: "Avec l'abattoir et l'unité de transformation, la chaîne se referme : chaque produit est traçable de la nutrition animale jusqu'au point de vente, dans une chaîne du froid continue.",
        en: 'With the slaughterhouse and processing plant, the chain closes: every product is traceable from animal nutrition to the point of sale, within an unbroken cold chain.',
      },
      stage: 'transformation',
    },
    {
      id: 'today',
      period: '2026',
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
      period: '→',
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
