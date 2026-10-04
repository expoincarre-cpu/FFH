import type { Localized } from '@/i18n/config'

/**
 * CMS content model.
 *
 * These types are the contract between the presentation layer and whatever
 * headless CMS backs the site (Sanity, Strapi, Contentful, Payload…).
 * Components only consume these shapes through `src/lib/cms.ts`, never the raw
 * seed files, so swapping the data source does not touch any component.
 *
 * Every user-facing string is `Localized` (fr/en). Media fields are optional:
 * when absent, the UI renders an art-directed placeholder instead of a stock photo.
 */

export type StageId = 'nutrition' | 'hatchery' | 'farming' | 'transformation' | 'food'

export type Media = {
  src: string
  alt: Localized
  width?: number
  height?: number
  /** Optional looping video (hero / large visuals). */
  video?: string
}

export type Figure = {
  id: string
  /** Numeric value used by counters. */
  value: number
  prefix?: string
  suffix?: string
  /** Decimal places shown by the counter. */
  decimals?: number
  unit: Localized
  label: Localized
  /** `true` until validated by the client — surfaced in the CMS, not on the site. */
  placeholder?: boolean
}

export type GeoPoint = { lat: number; lng: number }

export type Site = {
  id: string
  name: Localized
  city: string
  region: Localized
  type: Localized
  coords: GeoPoint
  business?: string
  placeholder?: boolean
}

/* ------------------------------------------------------------------ GROUP */

export type Stage = {
  id: StageId
  index: number
  name: Localized
  verb: Localized
  description: Localized
  /** Visual keywords rendered as industrial labels. */
  keywords: Localized<string[]>
  metric: Figure
  /** Accent used by the 3D scene and the UI while the stage is active. */
  color: string
}

export type StoryChapter = {
  id: string
  period: string
  title: Localized
  heading: Localized
  body: Localized
  media?: Media
  stage?: StageId
}

export type Value = { id: string; title: Localized; body: Localized }

export type Group = {
  name: string
  legalName: string
  signature: Localized
  vision: Localized
  mission: Localized
  values: Value[]
  figures: Figure[]
  story: StoryChapter[]
  headquarters: {
    address: Localized
    city: string
    phone: string
    email: string
    coords: GeoPoint
  }
  social: { label: string; url: string }[]
}

/* -------------------------------------------------------------- EXPERTISE */

/** Top-level domain (e.g. Poultry & Agro-industry). New domains can be added. */
export type Domain = {
  id: string
  name: Localized
  description: Localized
  verticals: string[]
}

/** A business line (vertical) within a domain. Maps to one or more stages. */
export type Vertical = {
  id: string
  name: Localized
  description: Localized
  stages: StageId[]
  order: number
}

export type Capacity = { label: Localized; value: Localized; detail?: Localized }

export type Product = { id: string; name: Localized; description: Localized; media?: Media }

export type Business = {
  slug: string
  name: string
  vertical: string
  stage: StageId
  category: Localized
  statement: Localized
  description: Localized
  about: Localized<string[]>
  hero?: Media
  logo?: Media
  figures: Figure[]
  expertise: { title: Localized; body: Localized }[]
  capacity: Capacity[]
  products: Product[]
  sites: Site[]
  certifications: { name: string; scope: Localized }[]
  commitments: { title: Localized; body: Localized }[]
  /** Downstream companies (or 'market') in the integrated chain. */
  suppliesTo: string[]
  contact: { email: string; phone?: string }
  founded?: number
  placeholder?: boolean
}

/* ------------------------------------------------------------------- NEWS */

export type NewsCategory = 'corporate' | 'announcement' | 'achievement' | 'event' | 'publication'

export type Article = {
  slug: Localized
  title: Localized
  excerpt: Localized
  category: NewsCategory
  date: string
  author: string
  readingTime: number
  image?: Media
  stage?: StageId
  business?: string
  featured?: boolean
  /** Rich text as paragraphs; a CMS would provide portable text / blocks. */
  content: Localized<string[]>
  placeholder?: boolean
}

/* ----------------------------------------------------------------- PEOPLE */

export type Person = {
  id: string
  name: string
  position: Localized
  department: Localized
  biography: Localized
  portrait?: Media
  body: 'board' | 'executive' | 'management'
  order: number
  placeholder?: boolean
}

/* ---------------------------------------------------------------- CAREERS */

export type Job = {
  id: string
  title: Localized
  location: string
  business: string
  department: Localized
  contract: 'CDI' | 'CDD' | 'Stage' | 'Alternance'
  description: Localized
  requirements: Localized<string[]>
  application: { email?: string; url?: string }
  publishedAt: string
}
