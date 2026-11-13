import * as THREE from 'three'

/** World layout — each stage of the value chain occupies a zone along -Z. */
export const ZONES = {
  nutrition: -30,
  hatchery: -80,
  farming: -135,
  transformation: -182,
  food: -228,
} as const

export const ZONE_LIST = Object.values(ZONES)

/**
 * Camera stations, one per narrative panel:
 * hero · intro · nutrition · hatchery · farming · transformation · food · ecosystem.
 */
export type Station = { pos: [number, number, number]; target: [number, number, number] }

/** Landscape framing: the subject sits right of centre, clear of the text column. */
export const STATIONS: Station[] = [
  { pos: [22, 15, 40], target: [2, 12, -32] },
  { pos: [62, 27, 12], target: [10, 8, -34] },
  { pos: [52, 12, 2], target: [22, 8.5, -34] },
  { pos: [-13, 3.4, -59.5], target: [5, 2.0, -88] },
  { pos: [3, 4.6, -107], target: [-30, 1.4, -126] },
  { pos: [-30, 15, -160], target: [6, 2, -188] },
  { pos: [17, 3.2, -205], target: [-3, 1.7, -229] },
  { pos: [150, 185, -118], target: [0, 0, -124] },
]

/**
 * Portrait framing (phones): the camera pulls back and re-aims so the subject
 * fits a narrow frame; the lens is also shifted upwards (see PORTRAIT.shift) so
 * the subject clears the text card in the lower half of the screen.
 */
export const STATIONS_PORTRAIT: Station[] = [
  { pos: [10, 14, 50], target: [1, 14, -32] },
  { pos: [44, 30, 36], target: [8, 10, -34] },
  { pos: [44, 14, 12], target: [26, 8, -34] },
  { pos: [-13, 3.6, -57], target: [-2, 2.2, -84] },
  { pos: [1, 5, -106], target: [-24, 1.8, -126] },
  { pos: [-28, 18, -150], target: [3, 3, -188] },
  { pos: [15, 3.4, -203], target: [-4, 2.2, -229] },
  { pos: [120, 250, -118], target: [0, 0, -124] },
]

export const LANDSCAPE = { fov: 40, shift: 0 }
export const PORTRAIT = { fov: 50, shift: 0.17 }

/** 0 for landscape viewports, 1 for phone-portrait ones, blending in between. */
export function portraitBlend(aspect: number) {
  const t = Math.min(1, Math.max(0, (1.15 - aspect) / 0.4))
  return t * t * (3 - 2 * t)
}

/**
 * Per-station rendering parameters, interpolated along the journey:
 * shadow frustum half-extent (m), AO radius (m), fog density, depth-of-field
 * strength (0 disables it) and an exposure factor applied at dusk (lit interiors).
 */
export const STATION_LOOK = [
  { shadow: 78, ao: 3.2, fog: 1, dof: 0, dusk: 1 },
  { shadow: 84, ao: 3.4, fog: 1, dof: 0, dusk: 1 },
  { shadow: 62, ao: 2.6, fog: 1, dof: 0, dusk: 1 },
  { shadow: 40, ao: 1.3, fog: 0.7, dof: 1, dusk: 0.42 },
  { shadow: 66, ao: 2.2, fog: 1.1, dof: 0, dusk: 1 },
  { shadow: 58, ao: 2.4, fog: 1, dof: 0, dusk: 0.7 },
  { shadow: 40, ao: 1.3, fog: 0.8, dof: 1, dusk: 0.42 },
  { shadow: 210, ao: 6, fog: 0.5, dof: 0, dusk: 1 },
]

/** Stage tint per station (kept for the 2.5D fallback and loading states). */
export const STATION_BG = ['#121816', '#121816', '#18170f', '#1b170e', '#0e1b14', '#0f1818', '#1a140f', '#0d1f16']

/** Value-chain thread — the continuous line linking every stage. */
export const THREAD_POINTS: [number, number, number][] = [
  [-30, 0.35, 30],
  [-10, 0.35, 8],
  [2, 0.35, -18],
  [0, 0.35, -36],
  [6, 0.35, -58],
  [-4, 0.35, -78],
  [-2, 0.35, -96],
  [-10, 0.35, -116],
  [-6, 0.35, -134],
  [6, 0.35, -152],
  [-4, 0.35, -172],
  [-6, 0.35, -192],
  [4, 0.35, -212],
  [0, 0.35, -228],
  [6, 0.35, -252],
  [30, 0.35, -280],
]

export const threadCurve = new THREE.CatmullRomCurve3(
  THREAD_POINTS.map((p) => new THREE.Vector3(...p)),
  false,
  'centripetal',
)

/** Precomputed arc-length samples of the thread for per-frame lookups. */
export const THREAD_SAMPLES = 1024
export const threadTable = threadCurve.getSpacedPoints(THREAD_SAMPLES - 1)

export function threadPoint(t: number, out: THREE.Vector3) {
  const f = (((t % 1) + 1) % 1) * (THREAD_SAMPLES - 1)
  const i = Math.floor(f)
  const j = Math.min(i + 1, THREAD_SAMPLES - 1)
  return out.lerpVectors(threadTable[i], threadTable[j], f - i)
}

/** Arc-length parameter of the thread closest to each zone centre. */
export const zoneStops = ZONE_LIST.map((z) => {
  let best = 0
  let dist = Infinity
  threadTable.forEach((p, i) => {
    const d = Math.abs(p.z - z)
    if (d < dist) {
      dist = d
      best = i
    }
  })
  return best / (THREAD_SAMPLES - 1)
})

/** Deterministic pseudo-random generator — stable layouts across renders. */
export function rng(seed = 1) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const tmpObject = new THREE.Object3D()
export const tmpColor = new THREE.Color()
