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
  /** Visual theme — daylight ('light') or dusk ('dark') world. */
  theme: 'dark' as 'light' | 'dark',
  /** Normalised pointer, -1 → 1. */
  pointer: { x: 0, y: 0 },
  /** Theme blend actually rendered: 0 = dusk, 1 = daylight (written by the atmosphere). */
  mix: 0,
  /**
   * Post-processing degradation level, raised by the performance guard:
   * 0 full · 1 no depth of field, half-res AO · 2 no AO, no bloom · 3 no composer.
   */
  degrade: 0,
  /** Scene exposure for the current theme blend (written by the atmosphere). */
  exposure: 1,
  /** Distance from the camera to its look-at point, for depth of field. */
  focus: 40,
  /** Frames rendered so far (lets capture scripts wait for the scene). */
  frames: 0,
  /** When true, damped values (camera, theme blend) jump straight to their targets. */
  snap: false,
  /** When set, overrides the curve parameter (0–1) directly — used to render evenly spaced frames offline. */
  param: null as number | null,
  /** Deterministic capture hook (only with ?capture): renders one frame at a given progress/time. */
  render: null as null | ((progress: number, time: number) => void),
}

export const STATION_COUNT = 8

/** Maps scroll progress to a curve parameter, dwelling slightly at each station. */
export function curveParam(p: number, anchors = journey.anchors) {
  if (journey.param !== null) return journey.param
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

if (typeof window !== 'undefined' && /[?&](debug|capture)/.test(window.location.search)) {
  ;(window as unknown as { __journey: typeof journey }).__journey = journey
}

/** Debug switches from the URL, e.g. ?off=bloom,ao,fog,grade — used to isolate rendering passes. */
export const off = new Set(typeof window === 'undefined' ? [] : (new URLSearchParams(window.location.search).get('off') ?? '').split(',').filter(Boolean))
