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
export const STATIONS: { pos: [number, number, number]; target: [number, number, number] }[] = [
  { pos: [38, 19, 28], target: [-24, 8, -26] },
  { pos: [46, 24, -2], target: [-14, 6, -34] },
  { pos: [34, 7, 2], target: [-14, 9, -34] },
  { pos: [-12, 5, -60], target: [3, 1.5, -92] },
  { pos: [16, 17, -98], target: [-22, 0, -136] },
  { pos: [-24, 9, -156], target: [6, 3, -186] },
  { pos: [18, 8, -202], target: [-4, 5, -230] },
  { pos: [150, 185, -118], target: [0, 0, -124] },
]

/** Background / fog tint per station (dark, slightly tinted by the stage). */
export const STATION_BG = ['#121816', '#121816', '#18170f', '#1b170e', '#0e1b14', '#0f1818', '#1a140f', '#0d1f16']
export const STATION_FOG: [number, number][] = [
  [30, 140],
  [20, 110],
  [14, 90],
  [10, 70],
  [24, 120],
  [16, 95],
  [12, 80],
  [120, 480],
]

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

/** Shared materials: a matte "architectural model" palette. */
export const materials = {
  clay: new THREE.MeshStandardMaterial({ color: '#e4dcc4', roughness: 0.92, metalness: 0 }),
  clayWarm: new THREE.MeshStandardMaterial({ color: '#cfc29e', roughness: 0.9 }),
  clayCool: new THREE.MeshStandardMaterial({ color: '#d5dde0', roughness: 0.75, metalness: 0.05 }),
  graphite: new THREE.MeshStandardMaterial({ color: '#1f2a25', roughness: 0.85 }),
  steel: new THREE.MeshStandardMaterial({ color: '#8f9796', roughness: 0.45, metalness: 0.6 }),
  ground: new THREE.MeshStandardMaterial({ color: '#111a16', roughness: 1 }),
}

export const tmpObject = new THREE.Object3D()
export const tmpColor = new THREE.Color()
