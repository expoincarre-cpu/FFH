import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { groupPages, href, type RouteKey } from '@/i18n/routes'

/** Secondary navigation shared by the Group section pages. */
export function GroupNav({ locale, dict, current }: { locale: Locale; dict: Dictionary; current: RouteKey }) {
  const items: RouteKey[] = ['group', ...groupPages]
  return (
    <nav className="group-nav" aria-label={dict.nav.group}>
      <div className="container">
        <ul>
          {items.map((key) => (
            <li key={key}>
              <Link href={href(locale, key)} aria-current={key === current ? 'page' : undefined}>
                {dict.nav[key as 'group']}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
