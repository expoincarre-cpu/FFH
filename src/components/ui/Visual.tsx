import Image from 'next/image'
import type { Locale } from '@/i18n/config'
import type { Media } from '@/content/types'

type Props = {
  media?: Media
  locale: Locale
  /** Accent colour (stage colour) for the art-directed placeholder. */
  color?: string
  /** Caption shown on the placeholder, describing the photography to come. */
  caption: string
  index?: string
  ratio?: string
  className?: string
  priority?: boolean
  pattern?: 'lines' | 'grid' | 'dots' | 'rings'
}

/**
 * Image slot. Renders CMS media when available; otherwise an art-directed
 * placeholder (tinted field, technical pattern, caption) — never stock imagery.
 */
export function Visual({ media, locale, color = 'var(--brand)', caption, index, ratio = '4 / 5', className = '', priority, pattern = 'lines' }: Props) {
  return (
    <figure className={`visual ${className}`} style={{ '--c': color, aspectRatio: ratio } as React.CSSProperties} data-reveal="media">
      <div className="visual__inner" data-media-inner>
        {media?.video ? (
          <video src={media.video} autoPlay muted loop playsInline poster={media.src} />
        ) : media?.src ? (
          <Image src={media.src} alt={media.alt[locale]} fill sizes="(max-width: 768px) 100vw, 50vw" priority={priority} />
        ) : (
          <div className={`visual__placeholder visual__placeholder--${pattern}`} role="img" aria-label={caption}>
            {index && <span className="visual__index">{index}</span>}
          </div>
        )}
      </div>
      {!media?.src && (
        <figcaption className="visual__caption">
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  )
}
