/* eslint-disable @next/next/no-img-element */
import type { Business } from '@/content/types'
import type { Locale } from '@/i18n/config'

/**
 * Company logo on a cream plate — the subsidiaries' logos are drawn for light
 * grounds, so the plate keeps them legible in both themes. Falls back to the
 * company name set in the display face when no logo is available.
 */
export function CompanyLogo({
  business,
  locale,
  size = 'm',
  className = '',
}: {
  business: Pick<Business, 'name' | 'logo'>
  locale: Locale
  size?: 's' | 'm' | 'l'
  className?: string
}) {
  return (
    <span className={`company-logo company-logo--${size} ${className}`}>
      {business.logo ? (
        <img src={business.logo.src} alt={business.logo.alt[locale]} decoding="async" />
      ) : (
        <span className="company-logo__name">{business.name}</span>
      )}
    </span>
  )
}
