import type { Locale } from '@/i18n/config'
import type { Figure } from '@/content/types'
import { formatFigure } from '@/lib/format'

/** Server-rendered final value; MotionController animates it into view. */
export function Counter({ figure, locale, className }: { figure: Figure; locale: Locale; className?: string }) {
  return (
    <span
      className={className}
      data-count={figure.value}
      data-decimals={figure.decimals ?? 0}
      data-prefix={figure.prefix ?? ''}
      data-suffix={figure.suffix ?? ''}
    >
      {formatFigure(figure, locale)}
    </span>
  )
}
