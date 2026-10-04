import type { Locale } from '@/i18n/config'
import type { Figure } from '@/content/types'

const numberLocale: Record<Locale, string> = { fr: 'fr-FR', en: 'en-US' }

export function formatNumber(value: number, locale: Locale, decimals = 0) {
  return new Intl.NumberFormat(numberLocale[locale], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatFigure(figure: Figure, locale: Locale, value = figure.value) {
  return `${figure.prefix ?? ''}${formatNumber(value, locale, figure.decimals)}${figure.suffix ?? ''}`
}

export function formatDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(numberLocale[locale], {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

export const pad = (n: number) => String(n).padStart(2, '0')
