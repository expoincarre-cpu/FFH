import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { Article } from '@/content/types'
import { href } from '@/i18n/routes'
import { formatDate } from '@/lib/format'
import { stages } from '@/content/group'
import { Visual } from './Visual'

export function ArticleCard({
  article,
  locale,
  dict,
  size = 'm',
}: {
  article: Article
  locale: Locale
  dict: Dictionary
  size?: 's' | 'm' | 'l'
}) {
  const color = stages.find((s) => s.id === article.stage)?.color
  return (
    <article className={`card card--${size}`}>
      <Link href={href(locale, 'article', { slug: article.slug[locale] })} className="card__link">
        <Visual
          media={article.image}
          locale={locale}
          color={color}
          caption={dict.news.categories[article.category]}
          ratio={size === 'l' ? '16 / 10' : '4 / 3'}
          pattern={article.stage ? 'lines' : 'rings'}
        />
        <div className="card__meta label">
          <span>{dict.news.categories[article.category]}</span>
          <time dateTime={article.date}>{formatDate(article.date, locale)}</time>
        </div>
        <h3 className="card__title">{article.title[locale]}</h3>
        {size !== 's' && <p className="card__excerpt">{article.excerpt[locale]}</p>}
        <span className="card__more">{dict.common.readMore} →</span>
      </Link>
    </article>
  )
}
