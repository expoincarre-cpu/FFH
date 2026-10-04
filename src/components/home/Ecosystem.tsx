'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type Node = {
  slug: string
  name: string
  stage: string
  category: string
  description: string
  suppliesTo: string[]
  href?: string
}

type StageCol = { id: string; index: number; name: string; color: string }

type Props = {
  stages: StageCol[]
  nodes: Node[]
  market: { name: string; category: string; description: string }
  labels: { hint: string; upstream: string; downstream: string; discover: string }
}

type Link_ = { from: string; to: string; d: string }

/**
 * The FFH ecosystem as a living system diagram.
 * Selecting a company lights its stage, its suppliers and its customers,
 * and draws the flows that connect them.
 */
export function Ecosystem({ stages, nodes, market, labels }: Props) {
  const all = useMemo<Node[]>(
    () => [...nodes, { slug: 'market', name: market.name, stage: 'food', category: market.category, description: market.description, suppliesTo: [] }],
    [nodes, market],
  )
  const [selected, setSelected] = useState<string>(nodes[0]?.slug ?? '')
  const [hovered, setHovered] = useState<string | null>(null)
  const focus = hovered ?? selected
  const wrap = useRef<HTMLDivElement>(null)
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [paths, setPaths] = useState<Link_[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })

  const edges = useMemo(() => all.flatMap((n) => n.suppliesTo.map((to) => ({ from: n.slug, to }))), [all])
  const upstream = useMemo(() => edges.filter((e) => e.to === focus).map((e) => e.from), [edges, focus])
  const downstream = useMemo(() => edges.filter((e) => e.from === focus).map((e) => e.to), [edges, focus])
  const related = useMemo(() => new Set([focus, ...upstream, ...downstream]), [focus, upstream, downstream])
  const current = all.find((n) => n.slug === focus) ?? all[0]
  const currentStage = stages.find((s) => s.id === current.stage)

  const measure = useCallback(() => {
    const box = wrap.current?.getBoundingClientRect()
    if (!box) return
    setSize({ w: box.width, h: box.height })
    const out: Link_[] = []
    edges.forEach(({ from, to }) => {
      const a = refs.current[from]?.getBoundingClientRect()
      const b = refs.current[to]?.getBoundingClientRect()
      if (!a || !b) return
      if (b.left >= a.right - 4) {
        const x1 = a.right - box.left
        const y1 = a.top + a.height / 2 - box.top
        const x2 = b.left - box.left
        const y2 = b.top + b.height / 2 - box.top
        const k = (x2 - x1) * 0.5
        out.push({ from, to, d: `M${x1},${y1} C${x1 + k},${y1} ${x2 - k},${y2} ${x2},${y2}` })
      } else {
        const x1 = a.left + a.width * 0.12 - box.left
        const y1 = a.bottom - box.top
        const x2 = b.left + b.width * 0.12 - box.left
        const y2 = b.top - box.top
        const k = Math.max(24, (y2 - y1) * 0.5)
        out.push({ from, to, d: `M${x1},${y1} C${x1},${y1 + k} ${x2},${y2 - k} ${x2},${y2}` })
      }
    })
    setPaths(out)
  }, [edges])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [measure])

  const nameOf = (slug: string) => all.find((n) => n.slug === slug)?.name ?? slug

  return (
    <div className="eco" style={{ '--focus': currentStage?.color } as React.CSSProperties}>
      <div className="eco__diagram" ref={wrap} onPointerLeave={() => setHovered(null)}>
        <div className="eco__holding">
          <span className="label">FFH — Fettah Financial Holding</span>
        </div>
        <svg className="eco__links" width={size.w} height={size.h} aria-hidden="true">
          {paths.map((p) => {
            const on = (p.from === focus || p.to === focus) && related.has(p.from) && related.has(p.to)
            const stage = stages.find((s) => s.id === all.find((n) => n.slug === p.from)?.stage)
            return (
              <path
                key={`${p.from}-${p.to}`}
                d={p.d}
                className="eco__link"
                data-on={on || undefined}
                style={{ '--c': stage?.color } as React.CSSProperties}
              />
            )
          })}
        </svg>
        <div className="eco__cols">
          {stages.map((s) => {
            const items = all.filter((n) => n.stage === s.id)
            return (
              <div
                key={s.id}
                className="eco__col"
                data-on={current.stage === s.id || undefined}
                style={{ '--c': s.color } as React.CSSProperties}
              >
                <p className="eco__stage">
                  <span>{String(s.index).padStart(2, '0')}</span>
                  {s.name}
                </p>
                <ul>
                  {items.map((n) => (
                    <li key={n.slug}>
                      <button
                        type="button"
                        ref={(el) => void (refs.current[n.slug] = el)}
                        className="eco__node"
                        data-market={n.slug === 'market' || undefined}
                        data-selected={selected === n.slug || undefined}
                        data-related={(related.has(n.slug) && n.slug !== focus) || undefined}
                        data-dim={!related.has(n.slug) || undefined}
                        aria-pressed={selected === n.slug}
                        onClick={() => setSelected(n.slug)}
                        onPointerEnter={() => setHovered(n.slug)}
                        onFocus={() => setHovered(n.slug)}
                        onBlur={() => setHovered(null)}
                      >
                        <span className="eco__node-name">{n.name}</span>
                        <span className="eco__node-cat">{n.category}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div className="eco__detail" aria-live="polite">
        <p className="label">
          {currentStage && `${String(currentStage.index).padStart(2, '0')} — ${currentStage.name}`}
        </p>
        <h3 className="eco__detail-title">{current.name}</h3>
        <p className="eco__detail-cat">{current.category}</p>
        <p className="eco__detail-body">{current.description}</p>
        <dl className="eco__flows">
          <div>
            <dt className="label">← {labels.upstream}</dt>
            <dd>{upstream.length ? upstream.map(nameOf).join(' · ') : '—'}</dd>
          </div>
          <div>
            <dt className="label">{labels.downstream} →</dt>
            <dd>{downstream.length ? downstream.map(nameOf).join(' · ') : '—'}</dd>
          </div>
        </dl>
        {current.href && (
          <Link href={current.href} className="link-arrow">
            {labels.discover} {current.name} →
          </Link>
        )}
        <p className="eco__hint">{labels.hint}</p>
      </div>
    </div>
  )
}
