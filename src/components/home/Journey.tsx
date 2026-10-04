'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState } from 'react'
import { detectTier, prefersReducedMotion, type Tier } from '@/lib/capabilities'
import { gsap, ScrollTrigger } from '@/components/motion/gsap'
import { getLenis } from '@/components/motion/SmoothScroll'
import { journey } from '@/components/three/state'
import { Fallback } from '@/components/three/Fallback'

const Scene = dynamic(() => import('@/components/three/Scene'), { ssr: false })

type StageInfo = { id: string; index: number; name: string; color: string }

type Props = {
  stages: StageInfo[]
  labels: { scroll: string; stage: string }
  children: React.ReactNode
}

/**
 * The scroll-driven "From feed to food" journey.
 * A sticky viewport hosts the WebGL world (or its 2.5D fallback) while the
 * narrative panels scroll over it. Panel positions define the camera stations.
 */
export function Journey({ stages, labels, children }: Props) {
  const root = useRef<HTMLElement>(null)
  const [tier, setTier] = useState<Tier | null>(null)
  const [active, setActive] = useState(0)
  const [running, setRunning] = useState(true)
  const activeRef = useRef(0)

  useEffect(() => setTier(detectTier()), [])
  const fail = useCallback(() => setTier('static'), [])

  // Scroll → progress, anchors and active station.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[data-station]'))

    const measure = () => {
      const top = el.getBoundingClientRect().top
      const total = Math.max(1, el.offsetHeight - window.innerHeight)
      const anchors = panels.map((p) => {
        const r = p.getBoundingClientRect()
        return Math.min(1, Math.max(0, (r.top - top + r.height / 2 - window.innerHeight / 2) / total))
      })
      anchors[0] = 0
      // The final aerial shot settles slightly before its panel is centred.
      anchors[anchors.length - 1] = Math.max(anchors[anchors.length - 2] + 0.01, anchors[anchors.length - 1] - 0.03)
      for (let i = 1; i < anchors.length; i++) anchors[i] = Math.max(anchors[i], anchors[i - 1] + 0.001)
      journey.anchors = anchors
    }

    const update = (progress: number) => {
      journey.progress = progress
      el.style.setProperty('--progress', progress.toFixed(4))
      const anchors = journey.anchors
      let nearest = 0
      anchors.forEach((a, i) => {
        if (Math.abs(a - progress) < Math.abs(anchors[nearest] - progress)) nearest = i
      })
      if (nearest !== activeRef.current) {
        activeRef.current = nearest
        setActive(nearest)
      }
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onRefresh: (self) => {
        measure()
        update(self.progress)
      },
      onUpdate: (self) => update(self.progress),
    })
    measure()
    update(st.progress)

    // Panel copy fades through the viewport as the camera travels.
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) return
      panels.slice(1).forEach((panel) => {
        const inner = panel.querySelector('[data-panel-inner]')
        if (!inner) return
        gsap
          .timeline({ scrollTrigger: { trigger: panel, start: 'top 85%', end: 'bottom 15%', scrub: true } })
          .fromTo(inner, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' })
          .to(inner, { autoAlpha: 1, duration: 0.5 })
          .to(inner, { autoAlpha: 0, y: -60, duration: 0.25, ease: 'power2.in' })
      })
    }, el)

    return () => {
      st.kill()
      ctx.revert()
    }
  }, [])

  // Pause rendering when the journey is off-screen.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Pointer parallax.
  useEffect(() => {
    const move = (e: PointerEvent) => {
      journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const stageIndex = active >= 2 && active <= 6 ? active - 2 : -1
  const color = stageIndex >= 0 ? stages[stageIndex].color : 'var(--brand)'

  const goTo = (station: number) => {
    const panel = root.current?.querySelectorAll<HTMLElement>('[data-station]')[station]
    if (!panel) return
    const y = panel.getBoundingClientRect().top + window.scrollY + panel.offsetHeight / 2 - window.innerHeight / 2
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(y, { duration: 1.8 })
    else window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }

  return (
    <section
      ref={root}
      className="journey"
      data-tier={tier ?? 'pending'}
      data-active-station={active}
      style={{ '--stage': color } as React.CSSProperties}
    >
      <div className="journey__viewport">
        <div className="journey__visual">
          {tier && tier !== 'static' ? (
            <Scene tier={tier} colors={stages.map((s) => s.color)} running={running} onFail={fail} />
          ) : (
            <Fallback colors={stages.map((s) => s.color)} active={active} />
          )}
        </div>
        <div className="journey__scrim" aria-hidden="true" />

        <nav className="journey__rail" aria-label={labels.stage}>
          <ol>
            {stages.map((s, i) => (
              <li key={s.id} data-active={stageIndex === i || undefined} data-passed={stageIndex > i || active === 7 || undefined}>
                <button type="button" onClick={() => goTo(i + 2)} style={{ '--c': s.color } as React.CSSProperties}>
                  <span className="journey__rail-num">{String(s.index).padStart(2, '0')}</span>
                  <span className="journey__rail-name">{s.name}</span>
                </button>
              </li>
            ))}
          </ol>
          <span className="journey__rail-track" aria-hidden="true">
            <span />
          </span>
        </nav>

        <div className="journey__cue" data-hidden={active > 0 || undefined} aria-hidden="true">
          <span>{labels.scroll}</span>
          <i />
        </div>
      </div>

      <div className="journey__panels">{children}</div>
    </section>
  )
}
