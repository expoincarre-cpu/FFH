/**
 * FFH wordmark — geometric letterforms with the five-node chain
 * (nutrition → hatchery → farming → transformation → food) beneath.
 * Replace with the official logo files when supplied (public/brand/).
 */
export function Logo({ className, title = 'FFH — Fettah Financial Holding' }: { className?: string; title?: string }) {
  return (
    <svg className={className} viewBox="0 0 49 29" role="img" aria-label={title} fill="currentColor">
      <title>{title}</title>
      <rect x="0" y="0" width="4.2" height="20" />
      <rect x="0" y="0" width="13" height="4" />
      <rect x="0" y="8" width="10.5" height="3.8" />
      <rect x="17" y="0" width="4.2" height="20" />
      <rect x="17" y="0" width="13" height="4" />
      <rect x="17" y="8" width="10.5" height="3.8" />
      <rect x="34" y="0" width="4.2" height="20" />
      <rect x="44.8" y="0" width="4.2" height="20" />
      <rect x="34" y="8" width="15" height="3.8" />
      <rect x="1" y="26.4" width="47" height="0.6" opacity="0.5" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={2.1 + i * 11.2} cy={26.7} r={1.6} className={i === 4 ? 'logo__accent' : undefined} />
      ))}
    </svg>
  )
}
