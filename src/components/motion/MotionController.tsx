'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from '@/lib/capabilities'

/**
 * Declarative motion for server-rendered markup.
 *
 *   data-reveal="lines"   heading lines slide up from a mask
 *   data-reveal="up"      element fades and rises
 *   data-reveal="stagger" direct children rise one after another
 *   data-reveal="media"   visual unmasks with a clip-path wipe
 *   data-count="1500"     number counts up when in view (final value is server-rendered)
 *   data-parallax="0.15"  element drifts relative to scroll
 *
 * Content is always present in the DOM; motion is an enhancement and is skipped
 * entirely when the visitor prefers reduced motion.
 */
export function MotionController() {
  const pathname = usePathname()

  useEffect(() => {
    const root = document.documentElement
    if (prefersReducedMotion()) {
      root.classList.add('no-motion')
      return
    }
    root.classList.add('has-motion')

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
        gsap.fromTo(
          el.querySelectorAll('.line > span'),
          { yPercent: 110 },
          {
            yPercent: 0,
            duration: 1.25,
            ease: 'expo.out',
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal="up"]').forEach((el) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1.1,
            ease: 'power3.out',
            delay: Number(el.dataset.delay ?? 0),
            scrollTrigger: { trigger: el, start: 'top 90%', once: true },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal="stagger"]').forEach((el) => {
        gsap.fromTo(
          el.children,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.07,
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        )
      })

      gsap.utils.toArray<HTMLElement>('[data-reveal="media"]').forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: 'inset(18% 12% 18% 12%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.6,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          },
        )
        const inner = el.querySelector('[data-media-inner]')
        if (inner) gsap.fromTo(inner, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%', once: true } })
      })

      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const to = Number(el.dataset.count)
        const decimals = Number(el.dataset.decimals ?? 0)
        const prefix = el.dataset.prefix ?? ''
        const suffix = el.dataset.suffix ?? ''
        const fmt = new Intl.NumberFormat(root.lang || 'fr', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
        const state = { v: 0 }
        gsap.to(state, {
          v: to,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          onStart: () => el.setAttribute('aria-busy', 'true'),
          onUpdate: () => {
            el.textContent = `${prefix}${fmt.format(state.v)}${suffix}`
          },
          onComplete: () => el.removeAttribute('aria-busy'),
        })
        el.textContent = `${prefix}${fmt.format(0)}${suffix}`
      })

      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
        const amount = Number(el.dataset.parallax ?? 0.15)
        gsap.fromTo(
          el,
          { yPercent: -amount * 100 },
          {
            yPercent: amount * 100,
            ease: 'none',
            scrollTrigger: { trigger: el.parentElement ?? el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        )
      })
    })

    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    const t = window.setTimeout(refresh, 400)

    return () => {
      window.clearTimeout(t)
      ctx.revert()
    }
  }, [pathname])

  return null
}
