'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from '@/lib/capabilities'

/**
 * Pins its section and translates the track horizontally while scrolling
 * (desktop only). On small screens and under reduced motion the track is a
 * native, swipeable horizontal list.
 */
export function HorizontalScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 1024px)', () => {
      const el = root.current
      const tr = track.current
      if (!el || !tr) return
      el.classList.add('is-pinned')
      const distance = () => Math.max(0, tr.scrollWidth - window.innerWidth)
      const tween = gsap.to(tr, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => el.style.setProperty('--h-progress', self.progress.toFixed(3)),
        },
      })
      return () => {
        el.classList.remove('is-pinned')
        tween.scrollTrigger?.kill()
        tween.kill()
      }
    })
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300)
    return () => {
      window.clearTimeout(t)
      mm.revert()
    }
  }, [])

  return (
    <div ref={root} className={`hscroll ${className}`}>
      <div ref={track} className="hscroll__track">
        {children}
      </div>
      <span className="hscroll__progress" aria-hidden="true" />
    </div>
  )
}
