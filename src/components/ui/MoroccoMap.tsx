import type { Locale } from '@/i18n/config'
import type { GeoPoint, Site } from '@/content/types'

/**
 * Technical map of the Moroccan coastline with FFH sites.
 * Equirectangular projection, coastline only (Mediterranean → Atlantic).
 */
const BOUNDS = { lngMin: -11.2, lngMax: -1.6, latMin: 29.6, latMax: 36.1 }
const K = 100
const COS = Math.cos((33 * Math.PI) / 180)
const W = (BOUNDS.lngMax - BOUNDS.lngMin) * COS * K
const H = (BOUNDS.latMax - BOUNDS.latMin) * K

const project = ({ lat, lng }: GeoPoint) => [(lng - BOUNDS.lngMin) * COS * K, (BOUNDS.latMax - lat) * K] as const

const COAST: [number, number][] = [
  [35.09, -2.22], [35.17, -2.93], [35.25, -3.93], [35.2, -4.67], [35.45, -5.1], [35.62, -5.27],
  [35.89, -5.32], [35.78, -5.81], [35.79, -5.92], [35.47, -6.03], [35.19, -6.15], [34.26, -6.58],
  [34.02, -6.84], [33.69, -7.39], [33.6, -7.63], [33.29, -8.34], [33.25, -8.51], [32.73, -9.03],
  [32.54, -9.28], [32.3, -9.24], [31.51, -9.77], [30.63, -9.89], [30.42, -9.6], [29.7, -9.9],
]

const coastPath = COAST.map(([lat, lng], i) => {
  const [x, y] = project({ lat, lng })
  return `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`
}).join(' ')

type Props = {
  sites: (Site & { color?: string; label?: string })[]
  hq?: { coords: GeoPoint; label: string }
  locale: Locale
  highlight?: string
  className?: string
}

export function MoroccoMap({ sites, hq, locale, highlight, className = '' }: Props) {
  const grid = []
  for (let lng = Math.ceil(BOUNDS.lngMin); lng <= BOUNDS.lngMax; lng++) {
    const [x] = project({ lat: 0, lng })
    grid.push(<line key={`lng${lng}`} x1={x} x2={x} y1={0} y2={H} />)
  }
  for (let lat = Math.ceil(BOUNDS.latMin); lat <= BOUNDS.latMax; lat++) {
    const [, y] = project({ lat, lng: 0 })
    grid.push(<line key={`lat${lat}`} x1={0} x2={W} y1={y} y2={y} />)
  }

  return (
    <figure className={`map ${className}`}>
      <svg viewBox={`0 0 ${W.toFixed(0)} ${H.toFixed(0)}`} role="img" aria-label={sites.map((s) => `${s.name[locale]} — ${s.city}`).join(', ')}>
        <g className="map__grid">{grid}</g>
        <path d={coastPath} className="map__coast" />
        <text x={40} y={H * 0.72} className="map__sea">{locale === 'fr' ? 'OCÉAN ATLANTIQUE' : 'ATLANTIC OCEAN'}</text>
        <text x={W * 0.62} y={40} className="map__sea">{locale === 'fr' ? 'MER MÉDITERRANÉE' : 'MEDITERRANEAN SEA'}</text>
        {sites.map((s, i) => {
          const [x, y] = project(s.coords)
          const dim = highlight && s.business !== highlight
          const right = x < W * 0.45
          return (
            <g key={s.id} className="map__site" data-dim={dim || undefined} style={{ '--c': s.color ?? 'var(--brand)' } as React.CSSProperties}>
              <circle cx={x} cy={y} r={14} className="map__pulse" style={{ animationDelay: `${i * 0.4}s` }} />
              <circle cx={x} cy={y} r={5} />
              <text x={right ? x + 12 : x - 12} y={y + (i % 2 ? 16 : -8)} textAnchor={right ? 'start' : 'end'}>
                {s.label ?? s.city}
              </text>
            </g>
          )
        })}
        {hq && (() => {
          const [x, y] = project(hq.coords)
          return (
            <g className="map__hq">
              <rect x={x - 7} y={y - 7} width={14} height={14} />
              <text x={x + 14} y={y - 12}>{hq.label}</text>
            </g>
          )
        })()}
      </svg>
      <figcaption className="map__legend label">
        <span>{BOUNDS.latMax.toFixed(1)}°N</span>
        <span>{Math.abs(BOUNDS.lngMin).toFixed(1)}°W — {Math.abs(BOUNDS.lngMax).toFixed(1)}°W</span>
      </figcaption>
    </figure>
  )
}
