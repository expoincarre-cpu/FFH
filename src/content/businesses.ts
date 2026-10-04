import type { Business, Domain, Vertical } from './types'

/**
 * EXPERTISE seed content.
 *
 * Architecture: Domain → Vertical → Business.
 * Adding a new business line = add a Vertical (and its Businesses); adding a new
 * activity outside poultry = add a Domain. No component hard-codes this list.
 *
 * Sites, capacities and figures are placeholders (`placeholder: true`)
 * pending validated data from each company.
 */

export const domains: Domain[] = [
  {
    id: 'poultry',
    name: { fr: 'Aviculture & agro-industrie', en: 'Poultry & agro-industry' },
    description: {
      fr: "Une filière avicole intégrée — poulet de chair et dinde — de la nutrition animale au produit alimentaire fini.",
      en: 'An integrated poultry value chain — broiler and turkey — from animal nutrition to finished food products.',
    },
    verticals: ['animal-nutrition', 'hatchery', 'farming', 'processing'],
  },
  {
    id: 'diversification',
    name: { fr: 'Agriculture & produits du terroir', en: 'Agriculture & terroir products' },
    description: {
      fr: "Au-delà de la filière avicole, le groupe valorise d'autres savoir-faire agricoles : l'oléiculture et l'élevage laitier.",
      en: 'Beyond poultry, the group develops other agricultural expertise: olive growing and dairy farming.',
    },
    verticals: ['olive-oil', 'dairy'],
  },
]

export const verticals: Vertical[] = [
  {
    id: 'animal-nutrition',
    order: 1,
    name: { fr: 'Nutrition animale', en: 'Animal nutrition' },
    description: {
      fr: "Formulation et fabrication d'aliments composés pour volailles, au service des élevages du groupe et du marché.",
      en: 'Formulation and manufacturing of compound poultry feed, serving group farms and the open market.',
    },
    stages: ['nutrition'],
  },
  {
    id: 'hatchery',
    order: 2,
    name: { fr: 'Accouvage', en: 'Hatchery' },
    description: {
      fr: "Incubation et éclosion de poussins de chair et de dindonneaux d'un jour, sous protocoles sanitaires stricts.",
      en: 'Incubation and hatching of day-old broiler chicks and turkey poults under strict sanitary protocols.',
    },
    stages: ['hatchery'],
  },
  {
    id: 'farming',
    order: 3,
    name: { fr: 'Élevage', en: 'Farming' },
    description: {
      fr: "Élevage de dindes et de poulets dans des bâtiments à ambiance contrôlée, en lien avec un réseau d'éleveurs partenaires.",
      en: 'Turkey and broiler farming in climate-controlled barns, together with a network of partner farmers.',
    },
    stages: ['farming'],
  },
  {
    id: 'processing',
    order: 4,
    name: { fr: 'Abattage & transformation', en: 'Slaughter & food processing' },
    description: {
      fr: "Abattage, découpe, élaboration et conditionnement de produits de volaille, jusqu'à la distribution.",
      en: 'Slaughter, cutting, further processing and packaging of poultry products, all the way to distribution.',
    },
    stages: ['transformation', 'food'],
  },
  {
    id: 'olive-oil',
    order: 5,
    name: { fr: 'Huile d’olive', en: 'Olive oil' },
    description: {
      fr: 'Production d’huile d’olive vierge extra issue des vergers marocains.',
      en: 'Production of extra virgin olive oil from Moroccan orchards.',
    },
    stages: [],
  },
  {
    id: 'dairy',
    order: 6,
    name: { fr: 'Élevage laitier', en: 'Dairy' },
    description: {
      fr: 'Élevage de vaches laitières et production de lait.',
      en: 'Dairy cattle farming and milk production.',
    },
    stages: [],
  },
]

const logo = (slug: string, name: string): Business['logo'] => ({
  src: `/brand/companies/${slug}.webp`,
  alt: { fr: `Logo ${name}`, en: `${name} logo` },
})

const sharedCommitments: Business['commitments'] = [
  {
    title: { fr: 'Bien-être animal', en: 'Animal welfare' },
    body: {
      fr: 'Densités maîtrisées, ambiance contrôlée, suivi vétérinaire permanent.',
      en: 'Controlled densities, regulated climate and permanent veterinary monitoring.',
    },
  },
  {
    title: { fr: 'Environnement', en: 'Environment' },
    body: {
      fr: "Efficacité énergétique, gestion de l'eau et valorisation des co-produits.",
      en: 'Energy efficiency, water management and by-product valorisation.',
    },
  },
  {
    title: { fr: 'Territoires', en: 'Communities' },
    body: {
      fr: "Emploi local, formation et accompagnement des éleveurs partenaires.",
      en: 'Local employment, training and support for partner farmers.',
    },
  },
]

const onssa = {
  name: 'ONSSA',
  scope: {
    fr: 'Agrément sanitaire de l’Office National de Sécurité Sanitaire des produits Alimentaires',
    en: 'Sanitary approval from the National Food Safety Office (ONSSA)',
  },
}

export const businesses: Business[] = [
  {
    slug: 'sofalim',
    name: 'SOFALIM',
    logo: logo('sofalim', 'SOFALIM'),
    tagline: { fr: 'Nutrition et alimentation animale', en: 'Animal nutrition and feed' },
    hero: { src: '/media/sofalim-aerial.webp', alt: { fr: 'Vue aérienne du site industriel SOFALIM', en: 'Aerial view of the SOFALIM industrial site' }, width: 800, height: 449 },
    vertical: 'animal-nutrition',
    stage: 'nutrition',
    category: { fr: 'Nutrition animale', en: 'Animal nutrition' },
    statement: {
      fr: 'La première ligne de la chaîne : un aliment formulé au gramme près.',
      en: 'The first link of the chain: feed formulated to the gram.',
    },
    description: {
      fr: "Fabricant d'aliments composés pour volailles, SOFALIM alimente les couvoirs et les élevages du groupe ainsi que des éleveurs indépendants.",
      en: 'A compound poultry feed manufacturer, SOFALIM supplies the group’s hatcheries and farms as well as independent farmers.',
    },
    about: {
      fr: [
        "SOFALIM transforme céréales, tourteaux et prémix en aliments composés adaptés à chaque espèce, chaque souche et chaque phase d'élevage.",
        "Son laboratoire contrôle les matières premières à réception et les produits finis à chaque lot, garantissant une qualité nutritionnelle constante pour l'ensemble de la filière.",
      ],
      en: [
        'SOFALIM turns cereals, oilseed meals and premixes into compound feed tailored to every species, strain and growth phase.',
        'Its laboratory tests raw materials on receipt and finished products batch by batch, ensuring consistent nutritional quality across the entire chain.',
      ],
    },
    figures: [
      { id: 'capacity', value: 500, suffix: 'k', unit: { fr: 't / an', en: 't / year' }, label: { fr: 'capacité de production', en: 'production capacity' }, placeholder: true },
      { id: 'formulas', value: 40, prefix: '+', unit: { fr: 'formules', en: 'formulas' }, label: { fr: 'aliments actifs', en: 'active feeds' }, placeholder: true },
      { id: 'silos', value: 30, unit: { fr: 'k t', en: 'k t' }, label: { fr: 'de stockage silos', en: 'silo storage' }, placeholder: true },
    ],
    expertise: [
      { title: { fr: 'Formulation', en: 'Formulation' }, body: { fr: 'Nutritionnistes et logiciels de formulation au moindre coût sous contraintes.', en: 'Nutritionists and least-cost formulation under constraints.' } },
      { title: { fr: 'Granulation', en: 'Pelleting' }, body: { fr: 'Lignes de broyage, mélange, granulation et émiettage.', en: 'Grinding, mixing, pelleting and crumbling lines.' } },
      { title: { fr: 'Contrôle qualité', en: 'Quality control' }, body: { fr: 'Analyses NIR et laboratoire à chaque étape.', en: 'NIR and laboratory analysis at every step.' } },
    ],
    capacity: [
      { label: { fr: 'Usine', en: 'Mill' }, value: { fr: '1 unité intégrée', en: '1 integrated mill' }, detail: { fr: 'Réception, stockage, fabrication, expédition', en: 'Receiving, storage, manufacturing, dispatch' } },
      { label: { fr: 'Lignes', en: 'Lines' }, value: { fr: '3 lignes de granulation', en: '3 pelleting lines' } },
      { label: { fr: 'Logistique', en: 'Logistics' }, value: { fr: 'Flotte vrac dédiée', en: 'Dedicated bulk fleet' } },
    ],
    products: [
      { id: 'starter', name: { fr: 'Démarrage', en: 'Starter' }, description: { fr: 'Miettes haute digestibilité pour les premiers jours.', en: 'Highly digestible crumbles for the first days.' } },
      { id: 'grower', name: { fr: 'Croissance', en: 'Grower' }, description: { fr: 'Granulés équilibrés pour la phase de croissance.', en: 'Balanced pellets for the growing phase.' } },
      { id: 'finisher', name: { fr: 'Finition', en: 'Finisher' }, description: { fr: 'Formules de finition poulet et dinde.', en: 'Broiler and turkey finisher formulas.' } },
      { id: 'breeder', name: { fr: 'Reproducteurs', en: 'Breeders' }, description: { fr: 'Aliments pour cheptels reproducteurs.', en: 'Feed for breeder flocks.' } },
    ],
    sites: [
      { id: 'sofalim-mill', name: { fr: 'Usine d’aliments', en: 'Feed mill' }, city: 'Berrechid', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Usine', en: 'Mill' }, coords: { lat: 33.265, lng: -7.587 }, business: 'sofalim', placeholder: true },
    ],
    certifications: [onssa, { name: 'ISO 9001', scope: { fr: 'Management de la qualité (à confirmer)', en: 'Quality management (to be confirmed)' } }],
    commitments: sharedCommitments,
    suppliesTo: ['sudinde', 'poussins-essaouira', 'sonavic', 'maroc-dinde', 'dawajine-soualem'],
    contact: { email: 'sofalim@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'sudinde',
    name: 'SUDINDE',
    logo: logo('sudinde', 'SUDINDE'),
    tagline: { fr: 'N° 1 marocain en accouvage dinde', en: 'Morocco’s No. 1 turkey hatchery' },
    vertical: 'hatchery',
    stage: 'hatchery',
    category: { fr: 'Couvoir — dinde', en: 'Hatchery — turkey' },
    statement: {
      fr: 'N° 1 marocain en accouvage dinde.',
      en: 'Morocco’s No. 1 turkey hatchery.',
    },
    description: {
      fr: "Couvoir spécialisé dans la production de dindonneaux d'un jour, au service des élevages du groupe et du marché.",
      en: 'A hatchery specialised in day-old turkey poults, serving group farms and the market.',
    },
    about: {
      fr: [
        "SUDINDE assure l'incubation et l'éclosion des œufs de dinde dans des incubateurs à pilotage automatisé de la température, de l'humidité et du retournement.",
        "Chaque lot est tracé de l'œuf au dindonneau livré, avec des protocoles de vaccination et de biosécurité stricts.",
      ],
      en: [
        'SUDINDE incubates and hatches turkey eggs in incubators with automated control of temperature, humidity and turning.',
        'Every batch is traced from egg to delivered poult, under strict vaccination and biosecurity protocols.',
      ],
    },
    figures: [
      { id: 'poults', value: 6, suffix: 'M', unit: { fr: 'dindonneaux / an', en: 'poults / year' }, label: { fr: 'capacité', en: 'capacity' }, placeholder: true },
      { id: 'hatch', value: 85, suffix: '%', unit: { fr: 'éclosabilité', en: 'hatchability' }, label: { fr: 'objectif', en: 'target' }, placeholder: true },
      { id: 'temp', value: 37.5, decimals: 1, suffix: '°', unit: { fr: 'C', en: 'C' }, label: { fr: 'précision d’incubation', en: 'incubation precision' } },
    ],
    expertise: [
      { title: { fr: 'Incubation', en: 'Incubation' }, body: { fr: 'Incubateurs multi-stades et mono-stade pilotés.', en: 'Controlled multi-stage and single-stage incubators.' } },
      { title: { fr: 'Biosécurité', en: 'Biosecurity' }, body: { fr: 'Marche en avant, zonage sanitaire, contrôles microbiologiques.', en: 'Forward flow, sanitary zoning, microbiological controls.' } },
      { title: { fr: 'Logistique vivante', en: 'Live logistics' }, body: { fr: 'Transport climatisé des dindonneaux vers les élevages.', en: 'Climate-controlled transport of poults to farms.' } },
    ],
    capacity: [
      { label: { fr: 'Couvoir', en: 'Hatchery' }, value: { fr: '1 site', en: '1 site' } },
      { label: { fr: 'Incubateurs', en: 'Incubators' }, value: { fr: 'Parc automatisé', en: 'Automated fleet' } },
    ],
    products: [
      { id: 'poults', name: { fr: 'Dindonneaux d’un jour', en: 'Day-old poults' }, description: { fr: 'Souches sélectionnées, vaccinés au couvoir.', en: 'Selected strains, vaccinated at the hatchery.' } },
    ],
    sites: [
      { id: 'sudinde-hatchery', name: { fr: 'Couvoir', en: 'Hatchery' }, city: 'El Jadida', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Couvoir', en: 'Hatchery' }, coords: { lat: 33.254, lng: -8.506 }, business: 'sudinde', placeholder: true },
    ],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: ['maroc-dinde'],
    contact: { email: 'sudinde@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'poussins-essaouira',
    name: 'POUSSINS ESSAOUIRA',
    logo: logo('poussins-essaouira', 'POUSSINS ESSAOUIRA'),
    vertical: 'hatchery',
    stage: 'hatchery',
    category: { fr: 'Couvoir — poulet de chair', en: 'Hatchery — broiler' },
    statement: {
      fr: 'Des poussins robustes, nés sous l’air de l’Atlantique.',
      en: 'Robust chicks, hatched in the Atlantic air.',
    },
    description: {
      fr: "Couvoir de poussins de chair d'un jour implanté dans la région d'Essaouira.",
      en: 'A day-old broiler chick hatchery based in the Essaouira region.',
    },
    about: {
      fr: [
        "Poussins Essaouira produit des poussins de chair d'un jour pour les élevages du groupe et pour les éleveurs de la région.",
        "Son implantation, à l'écart des grands bassins de production, constitue un atout sanitaire majeur.",
      ],
      en: [
        'Poussins Essaouira produces day-old broiler chicks for group farms and regional farmers.',
        'Its location, away from major production basins, is a significant sanitary advantage.',
      ],
    },
    figures: [
      { id: 'chicks', value: 25, suffix: 'M', unit: { fr: 'poussins / an', en: 'chicks / year' }, label: { fr: 'capacité', en: 'capacity' }, placeholder: true },
      { id: 'eggs', value: 500, suffix: 'k', unit: { fr: 'œufs / semaine', en: 'eggs / week' }, label: { fr: 'mis en incubation', en: 'set for incubation' }, placeholder: true },
    ],
    expertise: [
      { title: { fr: 'Incubation', en: 'Incubation' }, body: { fr: 'Pilotage fin des courbes de température et d’humidité.', en: 'Fine control of temperature and humidity curves.' } },
      { title: { fr: 'Qualité poussin', en: 'Chick quality' }, body: { fr: 'Tri, vaccination et contrôle individuel.', en: 'Grading, vaccination and individual checks.' } },
    ],
    capacity: [
      { label: { fr: 'Couvoir', en: 'Hatchery' }, value: { fr: '1 site', en: '1 site' } },
      { label: { fr: 'Livraison', en: 'Delivery' }, value: { fr: 'Camions climatisés', en: 'Climate-controlled trucks' } },
    ],
    products: [
      { id: 'chicks', name: { fr: 'Poussins de chair d’un jour', en: 'Day-old broiler chicks' }, description: { fr: 'Vaccinés et livrés en conditions contrôlées.', en: 'Vaccinated and delivered under controlled conditions.' } },
    ],
    sites: [
      { id: 'pe-hatchery', name: { fr: 'Couvoir', en: 'Hatchery' }, city: 'Essaouira', region: { fr: 'Marrakech-Safi', en: 'Marrakech-Safi' }, type: { fr: 'Couvoir', en: 'Hatchery' }, coords: { lat: 31.508, lng: -9.759 }, business: 'poussins-essaouira', placeholder: true },
    ],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: ['dawajine-soualem'],
    contact: { email: 'poussins-essaouira@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'sonavic',
    name: 'SONAVIC',
    vertical: 'hatchery',
    stage: 'hatchery',
    category: { fr: 'Couvoir', en: 'Hatchery' },
    statement: {
      fr: 'La régularité au cœur de l’accouvage.',
      en: 'Consistency at the heart of hatching.',
    },
    description: {
      fr: "Couvoir complémentaire qui sécurise l'approvisionnement en poussins d'un jour de la filière.",
      en: 'A complementary hatchery securing the chain’s supply of day-old chicks.',
    },
    about: {
      fr: [
        "SONAVIC renforce la capacité d'accouvage du groupe et garantit la continuité des mises en place dans les élevages.",
        "Ses équipes appliquent les mêmes standards d'incubation, de biosécurité et de traçabilité que l'ensemble des couvoirs FFH.",
      ],
      en: [
        'SONAVIC strengthens the group’s hatching capacity and guarantees continuous placements on farms.',
        'Its teams apply the same incubation, biosecurity and traceability standards as all FFH hatcheries.',
      ],
    },
    figures: [
      { id: 'chicks', value: 20, suffix: 'M', unit: { fr: 'poussins / an', en: 'chicks / year' }, label: { fr: 'capacité', en: 'capacity' }, placeholder: true },
    ],
    expertise: [
      { title: { fr: 'Accouvage', en: 'Hatching' }, body: { fr: 'Incubation automatisée et suivi des performances par lot.', en: 'Automated incubation and batch performance tracking.' } },
      { title: { fr: 'Sanitaire', en: 'Sanitary' }, body: { fr: 'Plans de prophylaxie et contrôles réguliers.', en: 'Prophylaxis plans and regular controls.' } },
    ],
    capacity: [{ label: { fr: 'Couvoir', en: 'Hatchery' }, value: { fr: '1 site', en: '1 site' } }],
    products: [
      { id: 'chicks', name: { fr: 'Poussins d’un jour', en: 'Day-old chicks' }, description: { fr: 'Pour les élevages du groupe et partenaires.', en: 'For group and partner farms.' } },
    ],
    sites: [
      { id: 'sonavic-hatchery', name: { fr: 'Couvoir', en: 'Hatchery' }, city: 'Settat', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Couvoir', en: 'Hatchery' }, coords: { lat: 33.001, lng: -7.616 }, business: 'sonavic', placeholder: true },
    ],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: ['dawajine-soualem'],
    contact: { email: 'sonavic@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'maroc-dinde',
    name: 'MAROC DINDE',
    logo: logo('maroc-dinde', 'MAROC DINDE'),
    vertical: 'farming',
    stage: 'farming',
    category: { fr: 'Élevage de dindes', en: 'Turkey farming' },
    statement: {
      fr: 'Élever la dinde avec patience et précision.',
      en: 'Raising turkeys with patience and precision.',
    },
    description: {
      fr: "Élevage de dindes en bâtiments à ambiance contrôlée, alimentés par SOFALIM et approvisionnés par SUDINDE.",
      en: 'Turkey farming in climate-controlled barns, fed by SOFALIM and supplied by SUDINDE.',
    },
    about: {
      fr: [
        "MAROC DINDE conduit l'élevage des dindes du dindonneau jusqu'à l'âge d'abattage, dans des bâtiments ventilés et régulés.",
        "Les équipes techniques et vétérinaires suivent quotidiennement la croissance, l'alimentation et le bien-être des animaux.",
      ],
      en: [
        'MAROC DINDE raises turkeys from poult to slaughter age in ventilated, regulated barns.',
        'Technical and veterinary teams monitor growth, feeding and animal welfare every day.',
      ],
    },
    figures: [
      { id: 'barns', value: 40, prefix: '+', unit: { fr: 'bâtiments', en: 'barns' }, label: { fr: "d'élevage", en: 'of farming' }, placeholder: true },
      { id: 'birds', value: 3, suffix: 'M', unit: { fr: 'dindes / an', en: 'turkeys / year' }, label: { fr: 'élevées', en: 'raised' }, placeholder: true },
    ],
    expertise: [
      { title: { fr: 'Conduite d’élevage', en: 'Husbandry' }, body: { fr: 'Programmes lumineux, ventilation, densités maîtrisées.', en: 'Lighting programmes, ventilation, controlled densities.' } },
      { title: { fr: 'Suivi vétérinaire', en: 'Veterinary care' }, body: { fr: 'Prévention, vaccination, monitoring quotidien.', en: 'Prevention, vaccination, daily monitoring.' } },
    ],
    capacity: [
      { label: { fr: 'Fermes', en: 'Farms' }, value: { fr: 'Plusieurs sites', en: 'Several sites' } },
      { label: { fr: 'Bâtiments', en: 'Barns' }, value: { fr: 'Ambiance contrôlée', en: 'Climate-controlled' } },
    ],
    products: [
      { id: 'turkeys', name: { fr: 'Dindes vivantes', en: 'Live turkeys' }, description: { fr: "Destinées à l'abattage et à la transformation.", en: 'For slaughter and processing.' } },
    ],
    sites: [
      { id: 'md-farms', name: { fr: "Fermes d'élevage", en: 'Farms' }, city: 'Benslimane', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Élevage', en: 'Farm' }, coords: { lat: 33.614, lng: -7.121 }, business: 'maroc-dinde', placeholder: true },
    ],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: ['goldavi'],
    contact: { email: 'maroc-dinde@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'dawajine-soualem',
    name: 'DAWAJINE SOUALEM',
    logo: logo('dawajine-soualem', 'DAWAJINE SOUALEM'),
    tagline: { fr: 'L’émergence en élevage de poulet de chair', en: 'Emerging leader in broiler farming' },
    vertical: 'farming',
    stage: 'farming',
    category: { fr: 'Élevage de poulets', en: 'Poultry farming' },
    statement: {
      fr: 'Le poulet de chair, élevé sous un même standard.',
      en: 'Broiler chicken, raised under one standard.',
    },
    description: {
      fr: "Élevage de poulets de chair dans la région de Had Soualem, au cœur du bassin avicole marocain.",
      en: 'Broiler farming in the Had Soualem area, at the heart of Morocco’s poultry basin.',
    },
    about: {
      fr: [
        "DAWAJINE SOUALEM élève les poulets de chair issus des couvoirs du groupe, nourris par les aliments SOFALIM.",
        "Elle anime également un réseau d'éleveurs partenaires auxquels elle apporte poussins, aliment et accompagnement technique.",
      ],
      en: [
        'DAWAJINE SOUALEM raises broilers from the group’s hatcheries, fed with SOFALIM feed.',
        'It also leads a network of partner farmers, providing chicks, feed and technical support.',
      ],
    },
    figures: [
      { id: 'barns', value: 80, prefix: '+', unit: { fr: 'bâtiments', en: 'barns' }, label: { fr: "d'élevage", en: 'of farming' }, placeholder: true },
      { id: 'partners', value: 150, prefix: '+', unit: { fr: 'éleveurs', en: 'farmers' }, label: { fr: 'partenaires', en: 'partners' }, placeholder: true },
    ],
    expertise: [
      { title: { fr: 'Élevage intégré', en: 'Integrated farming' }, body: { fr: 'Poussins, aliment et protocoles issus de la filière.', en: 'Chicks, feed and protocols from within the chain.' } },
      { title: { fr: 'Accompagnement', en: 'Farmer support' }, body: { fr: 'Encadrement technique des éleveurs partenaires.', en: 'Technical guidance for partner farmers.' } },
    ],
    capacity: [
      { label: { fr: 'Fermes', en: 'Farms' }, value: { fr: 'Réseau régional', en: 'Regional network' } },
    ],
    products: [
      { id: 'broilers', name: { fr: 'Poulets de chair', en: 'Broilers' }, description: { fr: "Destinés à l'abattage et à la transformation.", en: 'For slaughter and processing.' } },
    ],
    sites: [
      { id: 'ds-farms', name: { fr: "Fermes d'élevage", en: 'Farms' }, city: 'Had Soualem', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Élevage', en: 'Farm' }, coords: { lat: 33.423, lng: -7.851 }, business: 'dawajine-soualem', placeholder: true },
    ],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: ['goldavi'],
    contact: { email: 'dawajine-soualem@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'goldavi',
    name: 'GOLDAVI',
    vertical: 'processing',
    stage: 'transformation',
    category: { fr: 'Abattage & transformation', en: 'Slaughter & food processing' },
    statement: {
      fr: 'Là où la filière devient aliment.',
      en: 'Where the value chain becomes food.',
    },
    description: {
      fr: "Abattoir avicole et unité de transformation : découpe, produits élaborés, conditionnement et distribution sous chaîne du froid.",
      en: 'Poultry slaughterhouse and processing plant: cutting, prepared products, packaging and cold-chain distribution.',
    },
    about: {
      fr: [
        "GOLDAVI réceptionne les volailles issues des élevages du groupe et les transforme en produits alimentaires prêts à la vente.",
        "Lignes automatisées, contrôle qualité continu et chaîne du froid ininterrompue garantissent la sécurité sanitaire jusqu'au point de vente.",
      ],
      en: [
        'GOLDAVI receives poultry from the group’s farms and turns it into retail-ready food products.',
        'Automated lines, continuous quality control and an unbroken cold chain guarantee food safety all the way to the point of sale.',
      ],
    },
    figures: [
      { id: 'rate', value: 12000, unit: { fr: 'volailles / h', en: 'birds / h' }, label: { fr: "capacité d'abattage", en: 'slaughter capacity' }, placeholder: true },
      { id: 'refs', value: 100, prefix: '+', unit: { fr: 'références', en: 'SKUs' }, label: { fr: 'produits', en: 'products' }, placeholder: true },
      { id: 'cold', value: 4, suffix: '°C', unit: { fr: 'max', en: 'max' }, label: { fr: 'chaîne du froid', en: 'cold chain' } },
    ],
    expertise: [
      { title: { fr: 'Abattage', en: 'Slaughter' }, body: { fr: 'Lignes automatisées, conformes aux exigences halal et sanitaires.', en: 'Automated lines, compliant with halal and sanitary requirements.' } },
      { title: { fr: 'Découpe & élaborés', en: 'Cuts & prepared' }, body: { fr: 'Découpes, marinés, produits élaborés.', en: 'Cuts, marinated and prepared products.' } },
      { title: { fr: 'Conditionnement', en: 'Packaging' }, body: { fr: 'Barquettes, sous-vide, surgelé.', en: 'Trays, vacuum-packed, frozen.' } },
      { title: { fr: 'Distribution', en: 'Distribution' }, body: { fr: 'Flotte frigorifique et plateformes logistiques.', en: 'Refrigerated fleet and logistics hubs.' } },
    ],
    capacity: [
      { label: { fr: 'Abattoir', en: 'Slaughterhouse' }, value: { fr: '1 site agréé', en: '1 approved site' } },
      { label: { fr: 'Transformation', en: 'Processing' }, value: { fr: 'Lignes de découpe et élaborés', en: 'Cutting and prepared-food lines' } },
      { label: { fr: 'Froid', en: 'Cold storage' }, value: { fr: 'Chambres froides positives et négatives', en: 'Chilled and frozen storage' } },
    ],
    products: [
      { id: 'whole', name: { fr: 'Volailles entières', en: 'Whole birds' }, description: { fr: 'Poulet et dinde, frais et surgelés.', en: 'Chicken and turkey, fresh and frozen.' } },
      { id: 'cuts', name: { fr: 'Découpes', en: 'Cuts' }, description: { fr: 'Filets, cuisses, escalopes, ailes.', en: 'Fillets, thighs, escalopes, wings.' } },
      { id: 'prepared', name: { fr: 'Élaborés', en: 'Prepared foods' }, description: { fr: 'Marinés, panés, charcuterie de volaille.', en: 'Marinated, breaded, poultry cold cuts.' } },
      { id: 'foodservice', name: { fr: 'Restauration', en: 'Food service' }, description: { fr: 'Formats professionnels pour la RHD.', en: 'Professional formats for food service.' } },
    ],
    sites: [
      { id: 'goldavi-plant', name: { fr: 'Abattoir & usine', en: 'Slaughterhouse & plant' }, city: 'Mohammedia', region: { fr: 'Casablanca-Settat', en: 'Casablanca-Settat' }, type: { fr: 'Transformation', en: 'Processing' }, coords: { lat: 33.686, lng: -7.383 }, business: 'goldavi', placeholder: true },
    ],
    certifications: [
      onssa,
      { name: 'Halal', scope: { fr: 'Certification halal', en: 'Halal certification' } },
      { name: 'ISO 22000', scope: { fr: 'Sécurité des denrées alimentaires (à confirmer)', en: 'Food safety management (to be confirmed)' } },
    ],
    commitments: sharedCommitments,
    suppliesTo: ['market'],
    contact: { email: 'goldavi@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'zitounwazit',
    name: 'ZITOUNWAZIT',
    logo: logo('zitounwazit', 'ZITOUNWAZIT'),
    tagline: { fr: 'L’huile d’olive vierge extra', en: 'Extra virgin olive oil' },
    vertical: 'olive-oil',
    accent: '#8A9A3B',
    category: { fr: 'Huile d’olive', en: 'Olive oil' },
    statement: { fr: 'L’huile d’olive vierge extra.', en: 'Extra virgin olive oil.' },
    description: {
      fr: 'Producteur d’huile d’olive vierge extra, ZITOUNWAZIT prolonge l’engagement agricole du groupe vers les produits du terroir.',
      en: 'A producer of extra virgin olive oil, ZITOUNWAZIT extends the group’s agricultural commitment to terroir products.',
    },
    about: {
      fr: [
        'De la récolte à la mise en bouteille, ZITOUNWAZIT maîtrise la transformation des olives en huile vierge extra.',
        'Une extraction à froid et des contrôles qualité rigoureux préservent les qualités aromatiques et nutritionnelles de l’huile. Contenu à compléter.',
      ],
      en: [
        'From harvest to bottling, ZITOUNWAZIT controls the transformation of olives into extra virgin oil.',
        'Cold extraction and rigorous quality controls preserve the oil’s aromatic and nutritional qualities. Content to be completed.',
      ],
    },
    figures: [],
    expertise: [
      { title: { fr: 'Oléiculture', en: 'Olive growing' }, body: { fr: 'Conduite des vergers et récolte.', en: 'Orchard management and harvest.' } },
      { title: { fr: 'Trituration', en: 'Milling' }, body: { fr: 'Extraction à froid de l’huile vierge extra.', en: 'Cold extraction of extra virgin oil.' } },
    ],
    capacity: [{ label: { fr: 'Moulin', en: 'Mill' }, value: { fr: 'À confirmer', en: 'To be confirmed' } }],
    products: [
      { id: 'evoo', name: { fr: 'Huile d’olive vierge extra', en: 'Extra virgin olive oil' }, description: { fr: 'Formats bouteille et bidon.', en: 'Bottles and cans.' } },
    ],
    sites: [],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: [],
    contact: { email: 'zitounwazit@ffh.ma' },
    placeholder: true,
  },
  {
    slug: 'nature-lait',
    name: 'NATURE LAIT',
    logo: logo('nature-lait', 'NATURE LAIT'),
    tagline: { fr: 'Vaches laitières & lait', en: 'Dairy cows & milk' },
    vertical: 'dairy',
    accent: '#6F9BC4',
    category: { fr: 'Élevage laitier', en: 'Dairy farming' },
    statement: { fr: 'Vaches laitières & lait.', en: 'Dairy cows & milk.' },
    description: {
      fr: 'Élevage de vaches laitières et production de lait, au service de la filière laitière marocaine.',
      en: 'Dairy cattle farming and milk production, serving the Moroccan dairy industry.',
    },
    about: {
      fr: [
        'NATURE LAIT conduit un troupeau de vaches laitières et assure la production de lait cru dans le respect du bien-être animal.',
        'Alimentation, suivi vétérinaire et traite bénéficient de l’expertise nutritionnelle du groupe. Contenu à compléter.',
      ],
      en: [
        'NATURE LAIT runs a dairy herd and produces raw milk with a strong focus on animal welfare.',
        'Feeding, veterinary care and milking benefit from the group’s nutrition expertise. Content to be completed.',
      ],
    },
    figures: [],
    expertise: [
      { title: { fr: 'Élevage laitier', en: 'Dairy herd' }, body: { fr: 'Conduite du troupeau et bien-être animal.', en: 'Herd management and animal welfare.' } },
      { title: { fr: 'Traite', en: 'Milking' }, body: { fr: 'Traite et chaîne du froid du lait cru.', en: 'Milking and raw-milk cold chain.' } },
    ],
    capacity: [{ label: { fr: 'Ferme', en: 'Farm' }, value: { fr: 'À confirmer', en: 'To be confirmed' } }],
    products: [
      { id: 'milk', name: { fr: 'Lait cru', en: 'Raw milk' }, description: { fr: 'Collecté et refroidi sur site.', en: 'Collected and chilled on site.' } },
    ],
    sites: [],
    certifications: [onssa],
    commitments: sharedCommitments,
    suppliesTo: [],
    contact: { email: 'nature-lait@ffh.ma' },
    placeholder: true,
  },
]
