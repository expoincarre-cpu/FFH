import { stages, group } from '@/content/group'
import { businesses, domains, verticals } from '@/content/businesses'
import { people } from '@/content/people'
import { articles } from '@/content/news'
import { jobs } from '@/content/careers'
import type { Locale } from '@/i18n/config'
import type { Article, Business, Site, StageId } from '@/content/types'

/**
 * Data-access layer.
 *
 * The only module that knows where content comes from. Today it reads the
 * typed seed files in `src/content`; to plug a headless CMS, re-implement these
 * async functions with fetch calls — signatures and return types stay the same,
 * so no component changes.
 */

export async function getGroup() {
  return group
}

export async function getStages() {
  return stages
}

export async function getStage(id: StageId) {
  return stages.find((s) => s.id === id)
}

export async function getDomains() {
  return domains
}

export async function getVerticals() {
  return [...verticals].sort((a, b) => a.order - b.order)
}

export async function getBusinesses() {
  const order = stages.map((s) => s.id)
  return [...businesses].sort((a, b) => order.indexOf(a.stage) - order.indexOf(b.stage))
}

export async function getBusiness(slug: string): Promise<Business | undefined> {
  return businesses.find((b) => b.slug === slug)
}

export async function getSites(): Promise<Site[]> {
  return businesses.flatMap((b) => b.sites)
}

export async function getPeople() {
  return [...people].sort((a, b) => a.order - b.order)
}

export async function getArticles(): Promise<Article[]> {
  return [...articles].sort((a, b) => b.date.localeCompare(a.date))
}

export async function getArticle(locale: Locale, slug: string) {
  return articles.find((a) => a.slug[locale] === slug)
}

export async function getJobs() {
  return [...jobs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
