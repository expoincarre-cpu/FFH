/** Infinite kinetic type band (CSS-driven, paused under reduced motion). */
export function Marquee({ items, className = '', reverse }: { items: string[]; className?: string; reverse?: boolean }) {
  const row = (hidden?: boolean) => (
    <span className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <span key={i} className="marquee__item">
          {item}
          <i aria-hidden="true">●</i>
        </span>
      ))}
    </span>
  )
  return (
    <div className={`marquee ${reverse ? 'marquee--reverse' : ''} ${className}`}>
      <div className="marquee__inner">
        {row()}
        {row(true)}
      </div>
    </div>
  )
}
