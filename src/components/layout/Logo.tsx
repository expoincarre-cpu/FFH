/* eslint-disable @next/next/no-img-element */

/**
 * Official FFH identity (FERGUS brand guidelines). Assets live in public/brand:
 *  - monogram  "FF" mark — gradient (premium), gold (flat) or cream (mono)
 *  - wordmark  "Fettah Financial — Holding"
 *  - lockup    monogram + wordmark, for light (…-green) or dark (…-cream) grounds
 */
type Finish = 'gradient' | 'gold' | 'cream'

export function Monogram({ finish = 'gradient', className }: { finish?: Finish; className?: string }) {
  return <img src={`/brand/ffh-monogram-${finish}.webp`} alt="" width={707} height={651} className={className} />
}

/** Monogram + wordmark; the wordmark switches to green on the light theme. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={`logo ${className ?? ''}`}>
      <Monogram finish="gradient" className="logo__mark" />
      <img src="/brand/ffh-wordmark-gold.webp" alt="Fettah Financial Holding" width={2000} height={320} className="logo__word logo-on-dark" />
      <img src="/brand/ffh-wordmark-green.webp" alt="" aria-hidden="true" width={2000} height={320} className="logo__word logo-on-light" />
    </span>
  )
}

export function Lockup({ ground = 'dark', className }: { ground?: 'dark' | 'light'; className?: string }) {
  const file = ground === 'dark' ? 'ffh-lockup-gradient-cream' : 'ffh-lockup-gradient-green'
  return <img src={`/brand/${file}.webp`} alt="Fettah Financial Holding" width={2000} height={1014} className={className} />
}
