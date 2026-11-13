'use client'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group']
type MeshProps = ThreeElements['mesh']

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { rng } from './shared'
import {
  applySet,
  asphaltSet,
  blobTexture,
  concreteSet,
  corrugatedSet,
  facade,
  frondTexture,
  galvanizedSet,
  leafTexture,
  panelSet,
  stainlessSet,
  tiled,
  tuftTexture,
  wallSet,
} from './textures'
import { foliageMaterial, glassMaterial, weather } from './materials'

/* ------------------------------------------------------------ geometry */

const boxes = new Map<string, THREE.BufferGeometry>()

/** Box with a small bevel, so edges catch a highlight instead of reading as razor-sharp CG. */
export function bevelBox(w: number, h: number, d: number, r = 0.05) {
  const radius = Math.min(r, w * 0.45, h * 0.45, d * 0.45)
  const key = `${w}|${h}|${d}|${radius}`
  let g = boxes.get(key)
  if (!g) {
    g = radius < 0.004 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 1, radius)
    boxes.set(key, g)
  }
  return g
}

/** Bevelled box mesh. `size` is [width, height, depth]. */
export function Block({ size, r, ...props }: { size: [number, number, number]; r?: number } & MeshProps) {
  const g = useMemo(() => bevelBox(size[0], size[1], size[2], r), [size[0], size[1], size[2], r]) // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh geometry={g} {...props} />
}

const m4 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const Y = new THREE.Vector3(0, 1, 0)
const e = new THREE.Euler()

export type Item = { p: [number, number, number]; r?: [number, number, number]; s?: [number, number, number] | number; c?: string }

/** Matrix for a unit box/cylinder (height along Y) stretched between two points — beams, braces, pipes. */
export function beam(a: [number, number, number], b: [number, number, number], t: number, depth = t): THREE.Matrix4 {
  v1.set(...a)
  v2.set(...b)
  v3.subVectors(v2, v1)
  const len = v3.length()
  q.setFromUnitVectors(Y, v3.normalize())
  return new THREE.Matrix4().compose(v1.add(v2).multiplyScalar(0.5), q, new THREE.Vector3(t, len, depth))
}

export function itemMatrix(it: Item) {
  e.set(...(it.r ?? [0, 0, 0]))
  q.setFromEuler(e)
  const s = it.s ?? 1
  return new THREE.Matrix4().compose(v1.set(...it.p), q, typeof s === 'number' ? v2.setScalar(s) : v2.set(...s))
}

/** One instanced mesh for many copies of a part: far fewer draw calls than individual meshes. */
export function Inst({
  geometry,
  material,
  items,
  matrices,
  colors,
  ...props
}: {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  items?: Item[]
  matrices?: THREE.Matrix4[]
  colors?: THREE.Color[]
} & Omit<ThreeElements['instancedMesh'], 'args'>) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = matrices?.length ?? items?.length ?? 0
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      mesh.setMatrixAt(i, matrices ? matrices[i] : itemMatrix(items![i]))
      if (colors) mesh.setColorAt(i, colors[i])
      else if (items?.[i].c) mesh.setColorAt(i, c.set(items[i].c!))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items, matrices, colors, count])
  if (!count) return null
  return <instancedMesh ref={ref} args={[geometry, material, count]} {...props} />
}

export const unitBox = new THREE.BoxGeometry(1, 1, 1)
export const unitCyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 10)

/* ----------------------------------------------------------- materials */

/** Profiled painted-steel cladding. `w` is the wall width in metres (for rib density). */
export function useCladding(color: string, w: number, _h?: number, opts: { ribs?: number; seed?: number; wear?: number; box?: boolean; sheets?: number } = {}) {
  return useMemo(() => {
    const set = corrugatedSet(color, { ribs: 24, seed: opts.seed ?? 7, wear: opts.wear ?? 0.5, box: opts.box, sheets: opts.sheets ?? 3 })
    const m = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 })
    // One texture repeat covers 24 ribs ≈ 4.8 m of sheeting.
    applySet(m, set, Math.max(1, Math.round((w / 4.8) * (opts.ribs ?? 1))), 1)
    m.normalScale.setScalar(1.1)
    return weather(m, { macro: 0.12, grime: 0.35, height: 1.2 })
  }, [color, w, opts.ribs, opts.seed, opts.wear, opts.box, opts.sheets])
}

/** Cast concrete; one repeat ≈ 6 m. */
export function useConcrete(color: string, w: number, h: number, opts: { seed?: number; joints?: number; grime?: number } = {}) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.9 })
    applySet(m, concreteSet(color, opts.seed ?? 3, opts.joints ?? 0), Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 6)))
    return weather(m, { macro: 0.2, grime: opts.grime ?? 0.3 })
  }, [color, w, h, opts.seed, opts.joints, opts.grime])
}

/** Painted render wall with rain streaks; spans the full wall height. */
export function useWall(color: string, w: number, opts: { seed?: number; streaks?: number; joints?: number } = {}) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.88 })
    applySet(m, wallSet(color, opts.seed ?? 5, { streaks: opts.streaks ?? 0.5, joints: opts.joints ?? 0 }), Math.max(1, Math.round(w / 9)), 1)
    return weather(m, { macro: 0.14, grime: 0.3 })
  }, [color, w, opts.seed, opts.streaks, opts.joints])
}

/** Insulated sandwich panels. */
export function usePanels(color: string, w: number, opts: { seed?: number; rows?: number; cols?: number; wear?: number } = {}) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 })
    applySet(m, panelSet(color, { seed: opts.seed, rows: opts.rows ?? 0, cols: opts.cols ?? 8, wear: opts.wear ?? 0.4 }), Math.max(1, Math.round(w / 9)), 1)
    return weather(m, { macro: 0.08, grime: 0.3, height: 1 })
  }, [color, w, opts.seed, opts.rows, opts.cols, opts.wear])
}

/** Façade with recessed, reflective windows; rooms light up at dusk. */
export function useFacade(opts: { wall: string; cols: number; rows: number; band?: boolean; seed?: number; glass?: string; lit?: number }) {
  return useMemo(() => {
    const f = facade(opts)
    const m = new THREE.MeshStandardMaterial({
      map: f.map,
      emissiveMap: f.emissive,
      emissive: new THREE.Color('#ffd9a0'),
      emissiveIntensity: 0,
      roughness: 0.85,
    })
    if (f.normalMap) m.normalMap = f.normalMap
    if (f.roughnessMap) {
      m.roughnessMap = m.metalnessMap = f.roughnessMap
      m.roughness = m.metalness = 1
    }
    m.userData.nightGlow = 5
    return weather(m, { macro: 0.1, grime: 0.25 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(opts)])
}

function make(set: ReturnType<typeof stainlessSet>, rx: number, ry: number, base: THREE.MeshStandardMaterialParameters) {
  return applySet(new THREE.MeshStandardMaterial(base), set, rx, ry)
}

let shared: ReturnType<typeof createShared> | null = null

function createShared() {
  const galv = galvanizedSet({ seed: 17, cols: 3, rows: 3, wear: 0.4 })
  return {
    /** Galvanised steel: structure, ducts, tanks. */
    galvanized: weather(make(galv, 1, 1, { color: '#ffffff', roughness: 0.45, metalness: 0.85 }), { macro: 0.1, scale: 9 }),
    /** Dark painted structural steel. */
    darkSteel: new THREE.MeshStandardMaterial({ color: '#343b3a', roughness: 0.55, metalness: 0.55 }),
    /** Brushed stainless steel. */
    stainless: make(stainlessSet(), 1, 1, { color: '#ffffff', roughness: 0.32, metalness: 1 }),
    /** Dark reflective glazing for vehicles and curtain walls. */
    glass: new THREE.MeshStandardMaterial({ color: '#141d20', roughness: 0.05, metalness: 0.92, envMapIntensity: 1.5 }),
    /** See-through glazing. */
    clearGlass: glassMaterial(),
    rubber: new THREE.MeshStandardMaterial({ color: '#141515', roughness: 0.92 }),
    crateSteel: new THREE.MeshStandardMaterial({ color: '#8c9188', roughness: 0.65, metalness: 0.5 }),
    /** White coated sheet (reefer bodies, cabinets). */
    white: weather(new THREE.MeshStandardMaterial({ color: '#eceae3', roughness: 0.42, metalness: 0.05 }), { macro: 0.06, scale: 6, grime: 0.18, height: 0.7 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#d9dcdc', roughness: 0.12, metalness: 1 }),
    /** Lit lamp heads and LED strips: bright enough to bloom at dusk. */
    lamp: Object.assign(new THREE.MeshStandardMaterial({ color: '#2a2a28', emissive: new THREE.Color('#ffd7a1'), emissiveIntensity: 0, roughness: 0.4 }), {
      userData: { nightGlow: 14, dayGlow: 0 },
    }),
    headlight: Object.assign(new THREE.MeshStandardMaterial({ color: '#e9eef0', emissive: new THREE.Color('#fff2d8'), emissiveIntensity: 0, roughness: 0.2, metalness: 0.4 }), {
      userData: { nightGlow: 9, dayGlow: 0 },
    }),
    taillight: Object.assign(new THREE.MeshStandardMaterial({ color: '#5c0d0a', emissive: new THREE.Color('#ff2a1a'), emissiveIntensity: 0, roughness: 0.3 }), {
      userData: { nightGlow: 4, dayGlow: 0 },
    }),
    blob: new THREE.MeshBasicMaterial({ color: '#0a0806', map: blobTexture(), transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }),
  }
}

/** Shared materials, created on first use (textures need a document). */
export function mats() {
  return (shared ??= createShared())
}

/** Asphalt ground material; `rx`/`ry` are texture repeats (one repeat ≈ 7 m). */
export function useAsphalt(w: number, d: number) {
  return useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.92 })
    applySet(m, asphaltSet(), Math.max(1, Math.round(w / 7)), Math.max(1, Math.round(d / 7)))
    return weather(m, { macro: 0.3, scale: 26 })
  }, [w, d])
}

/* ------------------------------------------------------ contact shadows */

const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)

/**
 * Soft dark patches where objects meet the ground — grounds trucks, silos and
 * tree trunks even on the paths that render without screen-space AO.
 * Each spot is [x, z, sizeX, sizeZ, rotationY?].
 */
export function ContactShadows({ spots, y = 0.06 }: { spots: [number, number, number, number, number?][]; y?: number }) {
  const matrices = useMemo(
    () => spots.map(([x, z, sx, sz, r = 0]) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(Y, r), new THREE.Vector3(sx, 1, sz))),
    [spots, y],
  )
  return <Inst geometry={blobGeo} material={mats().blob} matrices={matrices} renderOrder={2} userData={{ noShadow: true }} />
}

/* -------------------------------------------------------------- trucks */

type TruckKind = 'bulk' | 'reefer' | 'live'

const tyreGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.34, 20).rotateZ(Math.PI / 2)
const rimGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.36, 12).rotateZ(Math.PI / 2)
const tankGeo = new THREE.CapsuleGeometry(1.22, 5.2, 6, 24).rotateX(Math.PI / 2)
const hopperGeo = new THREE.ConeGeometry(0.85, 0.9, 14).rotateX(Math.PI)
const ringGeo = new THREE.TorusGeometry(1.24, 0.035, 6, 28)

/** Articulated truck, nose towards +Z. Bevelled cab, glazing, lights, mudguards, detailed trailer. */
export function Truck({ kind = 'reefer', cab = '#e7e3d8', ...props }: { kind?: TruckKind; cab?: string } & GroupProps) {
  const M = mats()
  const paint = useMemo(
    () => weather(new THREE.MeshStandardMaterial({ color: cab, roughness: 0.3, metalness: 0.35 }), { macro: 0.05, scale: 5, grime: 0.3, height: 1.1 }),
    [cab],
  )
  const wheels: [number, number][] = [
    [-1.06, 3.2],
    [1.06, 3.2],
    [-1.06, 1.55],
    [1.06, 1.55],
    [-1.06, -3.5],
    [1.06, -3.5],
    [-1.06, -4.65],
    [1.06, -4.65],
    [-1.06, -5.8],
    [1.06, -5.8],
  ]
  const wheelItems = useMemo(() => wheels.map(([x, z]) => ({ p: [x, 0.5, z] as [number, number, number] })), []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group {...props}>
      {/* Cab */}
      <Block size={[2.36, 2.0, 1.9]} r={0.16} position={[0, 2.0, 3.4]} material={paint} />
      <Block size={[2.3, 0.75, 1.6]} r={0.12} position={[0, 3.2, 3.3]} material={paint} />
      <mesh position={[0, 2.42, 4.36]} rotation-x={-0.1} material={M.glass}>
        <planeGeometry args={[2.06, 0.95]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 1.185, 2.42, 3.75]} rotation-y={(s * Math.PI) / 2} material={M.glass}>
            <planeGeometry args={[0.9, 0.8]} />
          </mesh>
          {/* Mirror */}
          <Block size={[0.08, 0.5, 0.26]} r={0.03} position={[s * 1.42, 2.55, 4.2]} material={M.darkSteel} />
          {/* Headlight / indicator */}
          <Block size={[0.42, 0.2, 0.06]} r={0.02} position={[s * 0.82, 1.08, 4.36]} material={M.headlight} />
          {/* Tail lights on the trailer */}
          <Block size={[0.3, 0.14, 0.05]} r={0.02} position={[s * 0.95, 1.0, -6.42]} material={M.taillight} />
          {/* Mudguards */}
          <Block size={[0.42, 0.08, 1.5]} r={0.03} position={[s * 1.06, 1.08, 3.2]} material={M.darkSteel} />
          <Block size={[0.42, 0.06, 3.9]} r={0.02} position={[s * 1.06, 1.08, -4.65]} material={M.darkSteel} />
          {/* Fuel tank */}
          <mesh position={[s * 0.95, 0.75, 2.35]} rotation-x={Math.PI / 2} material={M.chrome}>
            <cylinderGeometry args={[0.3, 0.3, 1.0, 14]} />
          </mesh>
        </group>
      ))}
      {/* Grille and bumper */}
      <Block size={[1.5, 0.75, 0.05]} r={0.02} position={[0, 1.5, 4.36]} material={M.darkSteel} />
      <Block size={[2.4, 0.42, 0.28]} r={0.08} position={[0, 0.72, 4.32]} material={M.darkSteel} />
      {/* Chassis */}
      <Block size={[1.1, 0.3, 4.9]} r={0.04} position={[0, 0.82, 2.3]} material={M.darkSteel} />
      <Block size={[1.2, 0.26, 8.4]} r={0.04} position={[0, 0.98, -2.4]} material={M.darkSteel} />
      {/* Landing legs and rear underrun bar */}
      {[-0.7, 0.7].map((x) => (
        <Block key={x} size={[0.12, 0.8, 0.12]} r={0.02} position={[x, 0.45, -0.3]} material={M.darkSteel} />
      ))}
      <Block size={[2.3, 0.14, 0.12]} r={0.03} position={[0, 0.6, -6.5]} material={M.darkSteel} />

      {kind === 'bulk' && (
        <group position={[0, 2.5, -2.5]}>
          <mesh geometry={tankGeo} material={M.galvanized} />
          {[-2.6, -1.3, 0, 1.3, 2.6].map((z) => (
            <mesh key={z} geometry={ringGeo} position={[0, 0, z]} material={M.darkSteel} />
          ))}
          {[-2.2, 0, 2.2].map((z) => (
            <group key={z}>
              <mesh geometry={hopperGeo} position={[0, -1.12, z]} material={M.galvanized} />
              <mesh position={[0, 1.24, z]} material={M.darkSteel}>
                <cylinderGeometry args={[0.3, 0.3, 0.1, 14]} />
              </mesh>
            </group>
          ))}
          {/* Discharge auger pipe */}
          <mesh position={[1.05, 0.9, 0]} rotation-x={Math.PI / 2} material={M.galvanized}>
            <cylinderGeometry args={[0.12, 0.12, 7, 10]} />
          </mesh>
          {/* Catwalk rail */}
          <Block size={[0.5, 0.03, 6.4]} r={0.01} position={[0, 1.32, 0]} material={M.darkSteel} />
        </group>
      )}
      {kind === 'reefer' && (
        <group position={[0, 2.55, -2.4]}>
          <Block size={[2.5, 2.8, 8.3]} r={0.06} material={M.white} />
          {/* Refrigeration unit */}
          <Block size={[1.9, 1.5, 0.4]} r={0.06} position={[0, 0.45, 4.3]} material={M.white} />
          <Block size={[1.5, 0.5, 0.05]} r={0.01} position={[0, 0.5, 4.52]} material={M.darkSteel} />
          {/* Aluminium rub rails and door hardware */}
          {[-1, 1].map((s) => (
            <Block key={s} size={[0.03, 0.1, 8.3]} r={0.01} position={[s * 1.26, -1.34, 0]} material={M.chrome} />
          ))}
          <Block size={[0.03, 2.6, 0.03]} r={0.01} position={[0, 0, -4.16]} material={M.darkSteel} />
          {[-0.6, 0.6].map((x) => (
            <Block key={x} size={[0.04, 2.5, 0.04]} r={0.01} position={[x, 0, -4.17]} material={M.chrome} />
          ))}
        </group>
      )}
      {kind === 'live' && (
        <group position={[0, 2.5, -2.4]}>
          <Block size={[2.44, 2.7, 8.1]} r={0.03} material={M.crateSteel} />
          {[-1.05, -0.55, -0.05, 0.45, 0.95].map((y) =>
            [-1, 1].map((s) => <Block key={`${y}${s}`} size={[0.03, 0.3, 7.9]} r={0.01} position={[s * 1.23, y, 0]} material={M.darkSteel} />),
          )}
          {[-3, -1, 1, 3].map((z) => [-1, 1].map((s) => <Block key={`${z}${s}`} size={[0.05, 2.7, 0.08]} r={0.01} position={[s * 1.24, 0, z]} material={M.galvanized} />))}
        </group>
      )}
      <Inst geometry={tyreGeo} material={M.rubber} items={wheelItems} />
      <Inst geometry={rimGeo} material={M.galvanized} items={wheelItems} />
      <ContactShadows
        spots={[
          [0, -2.4, 3.6, 9.4],
          [0, 3.1, 3.4, 3.6],
        ]}
        y={0.07}
      />
    </group>
  )
}

/* ---------------------------------------------------------- vegetation */

const TINT = new THREE.Color()

function palmTrunk() {
  // Tapered trunk with the ringed leaf-base texture of a date palm, modelled in the profile.
  const pts: THREE.Vector2[] = []
  const rings = 26
  for (let i = 0; i <= rings * 2; i++) {
    const t = i / (rings * 2)
    const ring = i % 2 === 0 ? 1 : 0.86
    const flare = 1 + Math.exp(-t * 14) * 0.5 + Math.exp(-(1 - t) * 10) * 0.35
    pts.push(new THREE.Vector2(0.19 * ring * flare * (1 - t * 0.22), t))
  }
  return new THREE.LatheGeometry(pts, 9)
}

function frondGeometry(length: number, rise: number, droop: number) {
  // A strip along +X with a shallow V cross-section, arching up then drooping.
  const rows = 9
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= rows; i++) {
    const t = i / rows
    const x = Math.cos(rise - droop * t * 0.6) * length * t
    const y = length * (Math.sin(rise) * t - droop * t * t * 0.55)
    const w = 0.5 * Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)) + 0.06
    for (let s = -1; s <= 1; s++) {
      pos.push(x, y + Math.abs(s) * w * 0.3, s * w)
      uv.push(0.02 + t * 0.97, (s + 1) / 2)
    }
    if (i < rows) {
      const a = i * 3
      idx.push(a, a + 3, a + 1, a + 1, a + 3, a + 4, a + 1, a + 4, a + 2, a + 2, a + 4, a + 5)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

let palmParts: { trunk: THREE.BufferGeometry; fronds: THREE.BufferGeometry[]; bark: THREE.Material; leaf: THREE.Material; boot: THREE.BufferGeometry } | null = null
function palmAssets() {
  return (palmParts ??= {
    trunk: palmTrunk(),
    fronds: [frondGeometry(3.0, 0.95, 0.5), frondGeometry(3.6, 0.5, 1.0), frondGeometry(3.7, 0.05, 1.5)],
    bark: weather(new THREE.MeshStandardMaterial({ color: '#75654f', roughness: 0.95 }), { macro: 0.3, scale: 3 }),
    leaf: foliageMaterial(frondTexture(), 'frond', { alphaTest: 0.35, roughness: 0.6 }),
    boot: new THREE.SphereGeometry(0.42, 8, 6),
  })
}

/** Date palms: ringed trunks and crowns of alpha-tested frond cards (three ages of frond), swaying in the wind. */
export function Palms({ spots, seed = 1, scale = 1 }: { spots: [number, number][]; seed?: number; scale?: number }) {
  const A = palmAssets()
  const data = useMemo(() => {
    const r = rng(seed)
    const trunks: THREE.Matrix4[] = []
    const boots: THREE.Matrix4[] = []
    const fronds: THREE.Matrix4[][] = [[], [], []]
    const tints: THREE.Color[][] = [[], [], []]
    spots.forEach(([x, z]) => {
      const h = (5.5 + r() * 4.5) * scale
      const lx = (r() - 0.5) * 0.14
      const lz = (r() - 0.5) * 0.14
      e.set(lx, r() * 6, lz)
      q.setFromEuler(e)
      trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), q.clone(), new THREE.Vector3(scale, h, scale)))
      const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(v1.set(x, 0, z))
      boots.push(new THREE.Matrix4().compose(top.clone().setY(top.y - 0.15), q.clone(), new THREE.Vector3(scale, scale * 1.2, scale)))
      const counts = [7, 9, 7]
      counts.forEach((n, age) => {
        for (let k = 0; k < n; k++) {
          e.set(0, (k / n) * Math.PI * 2 + r() * 0.5 + age, (r() - 0.5) * 0.25, 'YXZ')
          q.setFromEuler(e)
          const s = (0.85 + r() * 0.35) * scale
          fronds[age].push(new THREE.Matrix4().compose(top, q.clone(), new THREE.Vector3(s, s, s)))
          const dry = age === 2 && r() > 0.55
          tints[age].push(dry ? new THREE.Color('#9a8a52') : new THREE.Color().setHSL(0.24 + r() * 0.05, 0.4 + r() * 0.15, 0.3 + r() * 0.12 - age * 0.03))
        }
      })
    })
    return { trunks, boots, fronds, tints }
  }, [spots, seed, scale])
  return (
    <group>
      <Inst geometry={A.trunk} material={A.bark} matrices={data.trunks} />
      <Inst geometry={A.boot} material={A.bark} matrices={data.boots} />
      {A.fronds.map((g, i) => (
        <Inst key={i} geometry={g} material={A.leaf} matrices={data.fronds[i]} colors={data.tints[i]} />
      ))}
      <ContactShadows spots={spots.map(([x, z]) => [x, z, 2.2, 2.2])} />
    </group>
  )
}

export type Species = 'olive' | 'broad' | 'eucalyptus' | 'cypress' | 'shrub' | 'bougainvillea'

const SPECIES: Record<
  Species,
  { trunk: number; radius: [number, number]; height: [number, number]; cards: number; card: number; leaf: 'broad' | 'fine'; tints: string[]; core: string; lobes: number }
> = {
  olive: { trunk: 1.5, radius: [1.9, 2.6], height: [1.5, 2.1], cards: 54, card: 2.3, leaf: 'fine', tints: ['#7c8a64', '#8f9c78', '#66755a', '#99a583'], core: '#3d4a34', lobes: 3 },
  broad: { trunk: 2.0, radius: [2.2, 3.0], height: [2.0, 2.8], cards: 56, card: 2.6, leaf: 'broad', tints: ['#4f6d36', '#5f7f41', '#3f5a2c', '#6c8a48'], core: '#263a1c', lobes: 3 },
  eucalyptus: { trunk: 3.6, radius: [1.9, 2.6], height: [2.6, 3.6], cards: 64, card: 2.5, leaf: 'fine', tints: ['#5e7352', '#6f8361', '#4d6044', '#7d8e6b'], core: '#33432c', lobes: 4 },
  cypress: { trunk: 0.6, radius: [0.8, 1.1], height: [4.2, 6], cards: 44, card: 1.7, leaf: 'fine', tints: ['#2f4a2c', '#3a5634', '#284026'], core: '#1b2c19', lobes: 1 },
  shrub: { trunk: 0, radius: [0.8, 1.3], height: [0.6, 0.9], cards: 18, card: 1.3, leaf: 'broad', tints: ['#55723a', '#647f44', '#486432'], core: '#2b3f20', lobes: 1 },
  bougainvillea: { trunk: 0, radius: [1.0, 1.6], height: [0.8, 1.3], cards: 24, card: 1.4, leaf: 'broad', tints: ['#b23a78', '#c94b8a', '#9d2f69', '#5a7a3c', '#d2639c'], core: '#3a2f33', lobes: 2 },
}

const cardGeo = (() => {
  // A slightly domed quad: catches light less uniformly than a flat card.
  const g = new THREE.PlaneGeometry(1, 1, 2, 2)
  const p = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < p.count; i++) p.setZ(i, (1 - (p.getX(i) * 2) ** 2) * (1 - (p.getY(i) * 2) ** 2) * 0.16)
  return g
})()
const coreGeo = new THREE.IcosahedronGeometry(1, 2)
const trunkGeo = new THREE.CylinderGeometry(0.11, 0.2, 1, 8, 3).translate(0, 0.5, 0)

const leafMats = new Map<string, THREE.Material>()
let treeShared: { bark: THREE.Material; core: THREE.Material } | null = null

/**
 * Mediterranean trees and shrubs built from alpha-tested foliage cards around a
 * dark core, with a rounded canopy normal, per-card tint/occlusion and wind
 * sway in the vertex shader. `density` thins the cards on lighter tiers.
 */
export function Trees({
  spots,
  species = 'broad',
  seed = 2,
  size = 1,
  density = 1,
}: {
  spots: [number, number][]
  species?: Species
  seed?: number
  size?: number
  density?: number
}) {
  const S = SPECIES[species]
  const leaf = useMemo(() => {
    let m = leafMats.get(S.leaf)
    if (!m) leafMats.set(S.leaf, (m = foliageMaterial(leafTexture(S.leaf), 'card', { alphaTest: 0.3 })))
    return m
  }, [S.leaf])
  treeShared ??= {
    bark: weather(new THREE.MeshStandardMaterial({ color: '#5b4c3c', roughness: 0.95 }), { macro: 0.3, scale: 2 }),
    core: new THREE.MeshStandardMaterial({ roughness: 1 }),
  }
  const per = Math.max(6, Math.round(S.cards * (0.45 + 0.55 * density)))

  const data = useMemo(() => {
    const r = rng(seed)
    const trunks: THREE.Matrix4[] = []
    const cores: THREE.Matrix4[] = []
    const coreTint: THREE.Color[] = []
    const cards: THREE.Matrix4[] = []
    const tint: THREE.Color[] = []
    const centers: number[] = []
    spots.forEach(([x, z]) => {
      const s = (0.8 + r() * 0.5) * size
      const th = S.trunk * s * (0.85 + r() * 0.3)
      const rx = (S.radius[0] + r() * (S.radius[1] - S.radius[0])) * s
      const ry = (S.height[0] + r() * (S.height[1] - S.height[0])) * s
      const cy = th + ry * 0.8
      if (S.trunk > 0) {
        e.set((r() - 0.5) * 0.12, r() * 6, (r() - 0.5) * 0.12)
        trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(e), new THREE.Vector3(s * 1.3, th + ry * 0.5, s * 1.3)))
      }
      // Canopy lobes: a few overlapping ellipsoids so the silhouette is irregular.
      const lobes = Array.from({ length: S.lobes }, (_, i) => {
        const a = r() * Math.PI * 2
        const off = i === 0 ? 0 : 0.45
        return {
          c: new THREE.Vector3(x + Math.cos(a) * rx * off, cy + (species === 'eucalyptus' ? (i - 1.5) * ry * 0.3 : (r() - 0.3) * ry * 0.3), z + Math.sin(a) * rx * off),
          rx: rx * (i === 0 ? 1 : 0.6 + r() * 0.25),
          ry: ry * (i === 0 ? 1 : 0.6 + r() * 0.25),
        }
      })
      lobes.forEach((l) => {
        cores.push(new THREE.Matrix4().compose(l.c, new THREE.Quaternion(), new THREE.Vector3(l.rx * 0.6, l.ry * 0.62, l.rx * 0.6)))
        coreTint.push(new THREE.Color(S.core))
      })
      for (let k = 0; k < per; k++) {
        const l = lobes[k % lobes.length]
        // Point on the lobe's shell.
        const u = r() * 2 - 1
        const a = r() * Math.PI * 2
        const rad = Math.sqrt(1 - u * u)
        const dir = v3.set(Math.cos(a) * rad, u * 0.9 + 0.1, Math.sin(a) * rad).normalize()
        const shell = 0.62 + r() * 0.42
        const pos = new THREE.Vector3(l.c.x + dir.x * l.rx * shell, l.c.y + dir.y * l.ry * shell, l.c.z + dir.z * l.rx * shell)
        // Face outwards, with some scatter.
        q.setFromUnitVectors(v2.set(0, 0, 1), v1.copy(dir).add(v2.set((r() - 0.5) * 0.9, (r() - 0.5) * 0.9, (r() - 0.5) * 0.9)).normalize())
        const cs = S.card * s * (0.75 + r() * 0.5)
        cards.push(new THREE.Matrix4().compose(pos, q.clone(), new THREE.Vector3(cs, cs, cs)))
        // Lower and inner cards are darker: canopy self-shadowing baked into the tint.
        const occ = 0.55 + 0.45 * THREE.MathUtils.clamp((dir.y + 0.6) / 1.4, 0, 1) * (0.7 + 0.3 * shell)
        tint.push(TINT.set(S.tints[Math.floor(r() * S.tints.length)]).multiplyScalar(occ).clone())
        centers.push(l.c.x, l.c.y, l.c.z)
      }
    })
    const geometry = cardGeo.clone()
    geometry.setAttribute('aCenter', new THREE.InstancedBufferAttribute(new Float32Array(centers), 3))
    return { trunks, cores, coreTint, cards, tint, geometry }
  }, [spots, seed, size, per, S, species])

  return (
    <group>
      {S.trunk > 0 && <Inst geometry={trunkGeo} material={treeShared.bark} matrices={data.trunks} />}
      <Inst geometry={coreGeo} material={treeShared.core} matrices={data.cores} colors={data.coreTint} />
      <Inst geometry={data.geometry} material={leaf} matrices={data.cards} colors={data.tint} frustumCulled={false} />
      <ContactShadows spots={spots.map(([x, z]) => [x, z, S.radius[1] * size * 2.2, S.radius[1] * size * 2.2])} />
    </group>
  )
}

const tuftGeo = (() => {
  const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)
  const b = a.clone().rotateY(Math.PI / 2)
  const pos = [...(a.attributes.position.array as Float32Array), ...(b.attributes.position.array as Float32Array)]
  const uv = [...(a.attributes.uv.array as Float32Array), ...(b.attributes.uv.array as Float32Array)]
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(24).fill(0).map((_, i) => (i % 3 === 1 ? 1 : 0)), 3))
  g.setIndex([0, 2, 1, 2, 3, 1, 4, 6, 5, 6, 7, 5])
  return g
})()
let tuftMat: THREE.Material | null = null

/**
 * Instanced grass and scrub tufts scattered over rectangles [x0, z0, x1, z1].
 * Only placed near camera stations; no shadows cast.
 */
export function Grass({
  areas,
  count,
  seed = 5,
  height = 0.34,
  tints = ['#9a9a60', '#b0a66e', '#7f8c50', '#bfb07a'],
  y = 0,
  avoid,
}: {
  areas: [number, number, number, number][]
  count: number
  seed?: number
  height?: number
  tints?: string[]
  y?: number | ((x: number, z: number) => number)
  avoid?: (x: number, z: number) => boolean
}) {
  tuftMat ??= foliageMaterial(tuftTexture(), 'grass', { alphaTest: 0.3, roughness: 0.9 })
  const data = useMemo(() => {
    const r = rng(seed)
    const total = areas.reduce((s, a) => s + Math.abs((a[2] - a[0]) * (a[3] - a[1])), 0)
    const matrices: THREE.Matrix4[] = []
    const colors: THREE.Color[] = []
    areas.forEach((a) => {
      const n = Math.round((count * Math.abs((a[2] - a[0]) * (a[3] - a[1]))) / total)
      for (let i = 0; i < n; i++) {
        const x = a[0] + r() * (a[2] - a[0])
        const z = a[1] + r() * (a[3] - a[1])
        const h = height * (0.5 + r() * 1.1)
        const w = h * (1.2 + r() * 0.9)
        if (avoid?.(x, z)) continue
        q.setFromAxisAngle(Y, r() * Math.PI)
        matrices.push(new THREE.Matrix4().compose(new THREE.Vector3(x, typeof y === 'number' ? y : y(x, z), z), q.clone(), new THREE.Vector3(w, h, w)))
        colors.push(new THREE.Color(tints[Math.floor(r() * tints.length)]).multiplyScalar(0.75 + r() * 0.4))
      }
    })
    return { matrices, colors }
  }, [areas, count, seed, height, tints, y, avoid])
  return <Inst geometry={tuftGeo} material={tuftMat} matrices={data.matrices} colors={data.colors} userData={{ castShadow: false }} frustumCulled={false} />
}

/* ------------------------------------------------------ site furniture */

const poleGeo = new THREE.CylinderGeometry(0.06, 0.09, 1, 8).translate(0, 0.5, 0)
const headGeo = bevelBox(0.26, 0.09, 0.7, 0.03)

/**
 * Street / yard lamps: [x, z, heading]. Heads glow (and bloom) at dusk; pass
 * `lights` to give the first few a real light so they pool on the ground.
 */
export function Lamps({ spots, height = 8, lights = 0, color = '#ffc98a', power = 90 }: { spots: [number, number, number?][]; height?: number; lights?: number; color?: string; power?: number }) {
  const M = mats()
  const poles = useMemo(() => spots.map(([x, z]) => ({ p: [x, 0, z] as [number, number, number], s: [1, height, 1] as [number, number, number] })), [spots, height])
  const arms = useMemo(
    () => spots.map(([x, z, a = 0]) => beam([x, height - 0.05, z], [x + Math.sin(a) * 1.3, height + 0.15, z + Math.cos(a) * 1.3], 0.06)),
    [spots, height],
  )
  const heads = useMemo(
    () => spots.map(([x, z, a = 0]) => ({ p: [x + Math.sin(a) * 1.5, height + 0.12, z + Math.cos(a) * 1.5] as [number, number, number], r: [0, a, 0] as [number, number, number] })),
    [spots, height],
  )
  return (
    <group>
      <Inst geometry={poleGeo} material={M.galvanized} items={poles} />
      <Inst geometry={unitCyl} material={M.galvanized} matrices={arms} />
      <Inst geometry={headGeo} material={M.lamp} items={heads} />
      {heads.slice(0, lights).map((h, i) => (
        <pointLight key={i} position={[h.p[0], h.p[1] - 0.4, h.p[2]]} color={color} intensity={0} distance={34} decay={1.7} userData={{ night: power }} />
      ))}
    </group>
  )
}

/** Perimeter fence: posts with mesh panels between consecutive points. */
export function Fence({ points, height = 2.1 }: { points: [number, number][]; height?: number }) {
  const M = mats()
  const mesh = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#8f9794', roughness: 0.6, metalness: 0.7, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }),
    [],
  )
  const { posts, panels, rails } = useMemo(() => {
    const posts: THREE.Matrix4[] = []
    const panels: THREE.Matrix4[] = []
    const rails: THREE.Matrix4[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const [x0, z0] = points[i]
      const [x1, z1] = points[i + 1]
      const len = Math.hypot(x1 - x0, z1 - z0)
      const n = Math.max(1, Math.round(len / 3))
      const yaw = Math.atan2(x1 - x0, z1 - z0)
      for (let k = 0; k <= n; k++) {
        const t = k / n
        posts.push(new THREE.Matrix4().compose(new THREE.Vector3(x0 + (x1 - x0) * t, height / 2, z0 + (z1 - z0) * t), new THREE.Quaternion(), new THREE.Vector3(0.07, height, 0.07)))
      }
      q.setFromAxisAngle(Y, yaw)
      panels.push(new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, height / 2, (z0 + z1) / 2), q.clone(), new THREE.Vector3(0.01, height - 0.1, len)))
      rails.push(beam([x0, height, z0], [x1, height, z1], 0.05))
    }
    return { posts, panels, rails }
  }, [points, height])
  return (
    <group>
      <Inst geometry={unitBox} material={M.galvanized} matrices={posts} />
      <Inst geometry={unitBox} material={M.galvanized} matrices={rails} />
      <Inst geometry={unitBox} material={mesh} matrices={panels} userData={{ noShadow: true }} />
    </group>
  )
}

/** Deterministic scatter along a line, for rows of trees or palms. */
export function row(from: [number, number], to: [number, number], n: number, jitter = 0.6, seed = 1): [number, number][] {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1)
    return [from[0] + (to[0] - from[0]) * t + (r() - 0.5) * jitter, from[1] + (to[1] - from[1]) * t + (r() - 0.5) * jitter]
  })
}

export { tiled }
