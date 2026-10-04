/**
 * Mutable journey state shared between the DOM (ScrollTrigger) and the WebGL
 * render loop. Kept outside React so scrolling never triggers re-renders.
 */
export const journey = {
  /** Raw scroll progress across the journey section, 0 → 1. */
  progress: 0,
  /** Damped progress used by the camera. */
  smooth: 0,
  /** Scroll progress at which each camera station is centred on screen. */
  anchors: [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 1],
  /** Normalised pointer, -1 → 1. */
  pointer: { x: 0, y: 0 },
}

export const STATION_COUNT = 8

/** Maps scroll progress to a curve parameter, dwelling slightly at each station. */
export function curveParam(p: number, anchors = journey.anchors) {
  const n = anchors.length
  if (p <= anchors[0]) return 0
  if (p >= anchors[n - 1]) return 1
  let i = 0
  while (i < n - 2 && p > anchors[i + 1]) i++
  const span = Math.max(anchors[i + 1] - anchors[i], 1e-5)
  const local = (p - anchors[i]) / span
  const eased = local * local * (3 - 2 * local)
  return (i + (local * 0.35 + eased * 0.65)) / (n - 1)
}

if (typeof window !== 'undefined' && window.location.search.includes('debug')) {
  ;(window as unknown as { __journey: typeof journey }).__journey = journey
}
