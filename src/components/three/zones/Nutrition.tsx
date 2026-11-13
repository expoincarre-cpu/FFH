'use client'

import type { ThreeElements } from '@react-three/fiber'

type GroupProps = ThreeElements['group']

import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { ZONES, rng } from '../shared'
import { applySet, concreteSet, corrugatedSet, galvanizedSet, grassSet } from '../textures'
import { weather } from '../materials'
import {
  Block,
  ContactShadows,
  Fence,
  Grass,
  Inst,
  Lamps,
  Palms,
  Trees,
  Truck,
  beam,
  bevelBox,
  mats,
  row,
  unitBox,
  unitCyl,
  useAsphalt,
  useCladding,
  useConcrete,
  useFacade,
  useWall,
} from '../props'
import { gableRoof, lattice, railing, zoneAwake } from './util'

/**
 * STAGE 01 — SOFALIM feed mill, modelled on the aerial photograph of the site
 * (public/media/sofalim-aerial.webp): green-clad mill tower with its cream
 * concrete core and rooftop sign, a battery of corrugated galvanised silos
 * under a conveyor gallery with lattice elevator towers, the orange production
 * block, white offices, the pale-roofed warehouse, palms, eucalyptus and
 * bougainvillea along the road.
 */
export function Nutrition({ color, density }: { color: string; density: number }) {
  const lite = density < 0.5
  const eucalyptus = useMemo(() => row([-44, 29], [48, 29], lite ? 9 : 16, 3, 6), [lite])
  const olives = useMemo(() => row([-46, 33], [50, 34], lite ? 6 : 11, 5, 16), [lite])
  const bougainvillea = useMemo(() => row([22, 26.5], [48, 26.5], lite ? 8 : 16, 1.2, 8), [lite])
  const shrubs = useMemo(() => [...row([-27, 12.4], [-9, 12.4], 9, 0.5, 21), ...row([-27, 17.6], [-9, 17.6], 9, 0.5, 22)], [])
  const palms = useMemo<[number, number][]>(() => [...row([-36, 16], [-10, 16.5], 6, 1.4, 3), ...row([-4, 21.5], [18, 21.5], 4, 1.5, 4), [-12, 9], [-21, 9.5], [-40, 8]], [])
  const verge = useMemo<[number, number, number, number][]>(
    () => [
      [-60, 27, 60, 36],
      [-27, 12.2, -9, 17.8],
      [-60, 36, 60, 60],
    ],
    [],
  )
  return (
    <group position={[0, 0, ZONES.nutrition]}>
      <MillTower />
      <SiloBattery density={density} />
      <OrangeBlock />
      <Offices />
      <Warehouse />
      <SiteGround />
      <Palms spots={palms} seed={5} />
      <Trees spots={eucalyptus} species="eucalyptus" seed={7} size={0.85} density={density} />
      <Trees spots={olives} species="olive" seed={17} size={1.1} density={density} />
      <Trees spots={bougainvillea} species="bougainvillea" seed={9} size={1} density={density} />
      <Trees spots={shrubs} species="shrub" seed={23} size={0.8} density={density} />
      <Grass areas={verge} count={Math.round(5200 * density)} seed={31} />
      <Truck kind="bulk" cab="#f0ece2" position={[19.7, 0, 6.3]} />
      <Truck kind="bulk" cab="#d9d4c6" position={[2, 0, 22.4]} rotation-y={Math.PI / 2} />
      <Cars />
      <GrainStream color={color} density={density} />
    </group>
  )
}

/** Green corrugated mill tower, lower annex, concrete core and rooftop SOFALIM sign. */
function MillTower() {
  const M = mats()
  const green = useCladding('#7fa05c', 9, 28, { seed: 7, sheets: 7, wear: 0.55 })
  const greenSide = useCladding('#7a9b58', 10, 28, { seed: 8, sheets: 7, wear: 0.6 })
  const greenLow = useCladding('#88a865', 9, 12, { seed: 9, sheets: 3, wear: 0.5 })
  const core = useConcrete('#d6cca6', 4, 26, { seed: 4 })
  const coreFacade = useFacade({ wall: '#d6cca6', cols: 2, rows: 9, seed: 4, lit: 0.3 })
  const roof = useConcrete('#9a968a', 9, 10, { seed: 6, grime: 0 })
  const sign = useLoader(THREE.TextureLoader, '/brand/companies/sofalim.webp')
  sign.colorSpace = THREE.SRGBColorSpace
  sign.anisotropy = 8
  const signMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ map: sign, transparent: true, roughness: 0.5, emissiveMap: sign, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 })
    m.userData.nightGlow = 1.6
    return m
  }, [sign])
  const signBoard = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#f4f1e8', roughness: 0.55, emissive: new THREE.Color('#f4f1e8'), emissiveIntensity: 0 })
    m.userData.nightGlow = 1.3
    return m
  }, [])
  // Small square windows punched in the cladding, as on the real tower.
  const windows = useMemo(() => {
    const out: THREE.Matrix4[] = []
    for (let r = 0; r < 6; r++)
      for (const x of [-2.6, 2.4]) out.push(new THREE.Matrix4().compose(new THREE.Vector3(x, 5.5 + r * 4, 5.02), new THREE.Quaternion(), new THREE.Vector3(0.9, 0.9, 0.06)))
    for (let r = 0; r < 5; r++) out.push(new THREE.Matrix4().compose(new THREE.Vector3(4.52, 15 + r * 2.6, -2), new THREE.Quaternion(), new THREE.Vector3(0.06, 0.8, 0.8)))
    return out
  }, [])
  const roofRail = useMemo(
    () =>
      railing(
        [
          [-4.4, 28.6, -4.9],
          [4.4, 28.6, -4.9],
          [4.4, 28.6, 4.9],
          [-4.4, 28.6, 4.9],
          [-4.4, 28.6, -4.9],
        ],
        1.1,
        0.05,
        1.8,
      ),
    [],
  )
  // Aspiration ducts climbing the tower and crossing to the annex roof.
  const ducts = useMemo(
    () => [
      beam([4.9, 12.4, 3.2], [4.9, 27.5, 3.2], 0.5),
      beam([4.9, 27.5, 3.2], [3.2, 29.4, 3.2], 0.5),
      beam([4.9, 12.4, -3.4], [4.9, 22, -3.4], 0.36),
      beam([-4.9, 0, -3.5], [-4.9, 28, -3.5], 0.16),
      beam([-4.9, 0, 4.6], [-4.9, 26, 4.6], 0.12),
      beam([7, 12.4, 3.2], [4.9, 14.5, 3.2], 0.4),
    ],
    [],
  )
  return (
    <group>
      <Block size={[9, 28, 10]} r={0.05} position={[0, 14, 0]} material={[greenSide, greenSide, roof, roof, green, green]} />
      {/* Parapet flashing, roof slab and plant */}
      <Block size={[9.25, 0.35, 10.25]} r={0.04} position={[0, 28.2, 0]} material={M.darkSteel} />
      <Block size={[4, 2.3, 4]} r={0.06} position={[1.6, 29.5, -1.2]} material={core} />
      <Block size={[1.6, 1.3, 2.4]} r={0.1} position={[-2.6, 29.05, -2.6]} material={M.galvanized} />
      <mesh position={[-2.2, 29.6, 0.8]} material={M.galvanized}>
        <cylinderGeometry args={[0.7, 0.45, 2.4, 16]} />
      </mesh>
      <Inst geometry={unitCyl} material={M.galvanized} matrices={roofRail} />
      <Inst geometry={unitCyl} material={M.galvanized} matrices={ducts} />
      <Inst geometry={unitBox} material={M.glass} matrices={windows} />
      {/* Concrete stair core with window slits */}
      <Block size={[3.8, 26, 3.8]} r={0.05} position={[-5.6, 13, 1.8]} material={[core, coreFacade, core, core, coreFacade, core]} />
      <Block size={[4.0, 0.3, 4.0]} r={0.04} position={[-5.6, 26.1, 1.8]} material={core} />
      {/* Lower green annex with its tall intake door */}
      <Block size={[8, 12, 10]} r={0.05} position={[8.2, 6, 1]} material={[greenLow, greenLow, roof, roof, greenLow, greenLow]} />
      <Block size={[8.25, 0.3, 10.25]} r={0.04} position={[8.2, 12.15, 1]} material={M.darkSteel} />
      <Block size={[3.2, 7.4, 0.2]} r={0.02} position={[9.6, 3.7, 6.0]} material={M.darkSteel} />
      <Block size={[3.6, 0.3, 0.9]} r={0.04} position={[9.6, 7.6, 6.3]} material={M.galvanized} />
      <mesh position={[6.2, 13.4, -1.6]} material={M.galvanized}>
        <cylinderGeometry args={[0.9, 0.5, 2.2, 16]} />
      </mesh>
      {/* Rooftop SOFALIM sign on its steel frame */}
      <group position={[-1.6, 31.3, 4.8]}>
        <Block size={[6.6, 2.8, 0.14]} r={0.03} position={[0, 0, -0.08]} material={signBoard} />
        <mesh material={signMat}>
          <planeGeometry args={[6, 2.44]} />
        </mesh>
        {[-2.8, 0, 2.8].map((x) => (
          <group key={x}>
            <Block size={[0.12, 2.9, 0.12]} r={0.02} position={[x, -1.2, -0.3]} material={M.darkSteel} />
            <mesh position={[x, -1.5, -1.0]} rotation-x={-0.6} material={M.darkSteel}>
              <boxGeometry args={[0.08, 2.6, 0.08]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Low office block in front of the tower */}
      <OfficeBlock position={[-3, 0, 9]} size={[10, 7, 6]} cols={6} rows={3} seed={2} />
    </group>
  )
}

function OfficeBlock({ size, cols, rows, seed = 1, ...props }: { size: [number, number, number]; cols: number; rows: number; seed?: number } & GroupProps) {
  const M = mats()
  const [w, h, d] = size
  const front = useFacade({ wall: '#e6dfca', cols, rows, seed: cols * 3 + rows + seed })
  const side = useFacade({ wall: '#e6dfca', cols: Math.max(2, Math.round((cols * d) / w)), rows, seed: cols + rows + seed })
  const roof = useConcrete('#b9b3a2', w, d, { seed: 8, grime: 0 })
  const units = useMemo(() => {
    const r = rng(seed * 11 + cols)
    return Array.from({ length: Math.max(2, Math.round(w / 4)) }, () => ({
      p: [(r() - 0.5) * (w - 2.5), h + 0.75, (r() - 0.5) * (d - 2.5)] as [number, number, number],
      s: [1.1, 0.8, 0.8] as [number, number, number],
    }))
  }, [w, h, d, seed, cols])
  return (
    <group {...props}>
      <Block size={[w, h, d]} r={0.04} position={[0, h / 2, 0]} material={[side, side, roof, roof, front, front]} />
      {/* Parapet */}
      <Block size={[w + 0.24, 0.5, d + 0.24]} r={0.04} position={[0, h + 0.1, 0]} material={roof} />
      {/* Rooftop air-conditioning units */}
      <Inst geometry={bevelBox(1, 1, 1, 0.06)} material={M.galvanized} items={units} />
      {/* Entrance canopy and door */}
      <Block size={[2.6, 0.16, 1.4]} r={0.03} position={[0, 2.7, d / 2 + 0.7]} material={M.darkSteel} />
      <Block size={[1.8, 2.3, 0.08]} r={0.01} position={[0, 1.15, d / 2 + 0.03]} material={M.glass} />
      <ContactShadows spots={[[0, 0, w + 2.4, d + 2.4]]} />
    </group>
  )
}

const SILO = { r: 2.6, h: 11, base: 1.2 }

function siloShell() {
  // Horizontally corrugated wall, as on bolted grain silos: the profile is modelled, not faked.
  const pts: THREE.Vector2[] = []
  const pitch = 0.3
  const steps = Math.round(SILO.h / pitch) * 4
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * SILO.h
    pts.push(new THREE.Vector2(SILO.r + Math.sin((y / pitch) * Math.PI * 2) * 0.04, y))
  }
  return new THREE.LatheGeometry(pts, 40)
}

/** Seven galvanised silos under a conveyor gallery, with the bucket-elevator towers. */
function SiloBattery({ density }: { density: number }) {
  const M = mats()
  const count = density < 0.5 ? 5 : 7
  const xs = useMemo(() => Array.from({ length: count }, (_, i) => 17 + i * 5.4), [count])
  const end = xs[xs.length - 1]
  const shell = useMemo(siloShell, [])
  const wall = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.85 })
    applySet(m, galvanizedSet({ seed: 17, cols: 6, rows: 10, wear: 0.6 }), 3, 1)
    return weather(m, { macro: 0.1, scale: 14, grime: 0.3, height: 1.6 })
  }, [])
  const roofMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.85 })
    applySet(m, galvanizedSet({ seed: 19, cols: 12, rows: 1, wear: 0.5 }), 2, 1)
    return m
  }, [])
  const base = useConcrete('#b3ad9f', 16, 2, { seed: 12 })
  const cone = useMemo(() => new THREE.ConeGeometry(SILO.r + 0.12, 1.9, 40, 1, true), [])
  const baseGeo = useMemo(() => new THREE.CylinderGeometry(SILO.r + 0.25, SILO.r + 0.3, SILO.base, 40), [])
  const capGeo = useMemo(() => new THREE.CylinderGeometry(0.42, 0.5, 0.5, 14), [])

  const parts = useMemo(() => {
    const shells = xs.map((x) => new THREE.Matrix4().makeTranslation(x, SILO.base, 0))
    const cones = xs.map((x) => new THREE.Matrix4().makeTranslation(x, SILO.base + SILO.h + 0.95, 0))
    const caps = xs.map((x) => new THREE.Matrix4().makeTranslation(x, SILO.base + SILO.h + 2.05, 0))
    const bases = xs.map((x) => new THREE.Matrix4().makeTranslation(x, SILO.base / 2, 0))
    const steel: THREE.Matrix4[] = []
    const dark: THREE.Matrix4[] = []
    xs.forEach((x, i) => {
      const top = SILO.base + SILO.h
      // Vertical stiffeners.
      for (let k = 0; k < 18; k++) {
        const a = (k / 18) * Math.PI * 2
        const px = x + Math.cos(a) * (SILO.r + 0.07)
        const pz = Math.sin(a) * (SILO.r + 0.07)
        steel.push(beam([px, SILO.base, pz], [px, top, pz], 0.07))
      }
      // Roof ribs.
      for (let k = 0; k < 20; k++) {
        const a = (k / 20) * Math.PI * 2
        steel.push(beam([x + Math.cos(a) * (SILO.r + 0.1), top + 0.03, Math.sin(a) * (SILO.r + 0.1)], [x + Math.cos(a) * 0.45, top + 1.92, Math.sin(a) * 0.45], 0.05))
      }
      // Caged access ladder on the front.
      const a = Math.PI / 2 + (i % 2 ? 0.5 : -0.4)
      const lx = Math.cos(a)
      const lz = Math.sin(a)
      const tx = -lz
      const tz = lx
      const R = SILO.r + 0.22
      for (const s of [-0.22, 0.22]) dark.push(beam([x + lx * R + tx * s, 0.4, lz * R + tz * s], [x + lx * R + tx * s, top + 1, lz * R + tz * s], 0.04))
      for (let y = 0.7; y < top + 0.9; y += 0.42) dark.push(beam([x + lx * R - tx * 0.22, y, lz * R - tz * 0.22], [x + lx * R + tx * 0.22, y, lz * R + tz * 0.22], 0.025))
      for (let y = 3; y < top + 1; y += 1.3) {
        const Rc = R + 0.38
        dark.push(beam([x + lx * R - tx * 0.3, y, lz * R - tz * 0.3], [x + lx * Rc - tx * 0.3, y, lz * Rc - tz * 0.3], 0.025))
        dark.push(beam([x + lx * R + tx * 0.3, y, lz * R + tz * 0.3], [x + lx * Rc + tx * 0.3, y, lz * Rc + tz * 0.3], 0.025))
        dark.push(beam([x + lx * Rc - tx * 0.3, y, lz * Rc - tz * 0.3], [x + lx * Rc + tx * 0.3, y, lz * Rc + tz * 0.3], 0.025))
      }
      // Trestle carrying the gallery above the roof peak.
      for (const s of [-0.7, 0.7]) steel.push(beam([x + s, top + 1.6, 0], [x + s * 0.6, top + 3.0, 0], 0.09))
    })
    return { shells, cones, caps, bases, steel, dark }
  }, [xs])

  const galleryY = SILO.base + SILO.h + 3.7
  const gx0 = xs[0] - 6.5
  const gx1 = end + 4
  const galleryLen = gx1 - gx0
  const gallery = useCladding('#b9bec0', galleryLen, 1.4, { seed: 31, sheets: 1, wear: 0.5, ribs: 1 })
  const walkway = useMemo(
    () => [
      ...railing(
        [
          [gx0, galleryY - 0.75, 1.5],
          [gx1, galleryY - 0.75, 1.5],
        ],
        1.1,
        0.045,
        1.8,
      ),
      ...lattice([13.6, 0, -1], 21, 1.15, 1.75, 0.1),
      ...lattice([end + 4.6, 0, 0], 17.5, 1.0, 1.75, 0.09),
    ],
    [gx0, gx1, galleryY, end],
  )
  // Bucket-elevator legs and gravity spouts.
  const spouts = useMemo(
    () => [
      beam([13.2, 0, -1], [13.2, 22.5, -1], 0.55, 0.42),
      beam([14.0, 0, -1], [14.0, 22.5, -1], 0.55, 0.42),
      beam([13.6, 21.4, -0.4], [16.5, galleryY + 0.3, 0], 0.3),
      beam([13.2, 21.2, -0.6], [10.4, 12.6, 3.2], 0.3),
      beam([end + 4.6, 0, 0], [end + 4.6, 18.6, 0], 0.5, 0.4),
      beam([end + 4.6, 17.8, 0], [end + 2.6, galleryY + 0.3, 0], 0.28),
    ],
    [end, galleryY],
  )
  return (
    <group position={[0, 0, -4]}>
      <Inst geometry={baseGeo} material={base} matrices={parts.bases} />
      <Inst geometry={shell} material={wall} matrices={parts.shells} />
      <Inst geometry={cone} material={roofMat} matrices={parts.cones} />
      <Inst geometry={capGeo} material={M.galvanized} matrices={parts.caps} />
      <Inst geometry={unitBox} material={M.galvanized} matrices={parts.steel} />
      <Inst geometry={unitBox} material={M.darkSteel} matrices={parts.dark} userData={{ castShadow: false }} />
      {/* Conveyor gallery across the silo tops, with its service walkway */}
      <Block size={[galleryLen, 1.4, 1.5]} r={0.04} position={[(gx0 + gx1) / 2, galleryY, 0]} material={gallery} />
      <Block size={[galleryLen + 0.2, 0.08, 1.8]} r={0.02} position={[(gx0 + gx1) / 2, galleryY + 0.74, 0]} material={M.darkSteel} />
      <Block size={[galleryLen, 0.06, 1.0]} r={0.01} position={[(gx0 + gx1) / 2, galleryY - 0.76, 1.15]} material={M.darkSteel} />
      <Inst geometry={unitBox} material={M.galvanized} matrices={walkway} />
      <Inst geometry={unitBox} material={M.galvanized} matrices={spouts} />
      {/* Elevator head houses */}
      <Block size={[2.9, 1.9, 2.9]} r={0.08} position={[13.6, 22.2, -1]} material={M.galvanized} />
      <Block size={[2.4, 1.6, 2.4]} r={0.08} position={[end + 4.6, 18.6, 0]} material={M.galvanized} />
      <ContactShadows spots={xs.map((x) => [x, 0, 8.2, 8.2])} />
    </group>
  )
}

/** The orange production block (left of the mill in the photograph). */
function OrangeBlock() {
  const M = mats()
  const orange = useWall('#d95f2e', 10, { seed: 14, streaks: 0.7, joints: 4 })
  const orangeDark = useWall('#c9532a', 7, { seed: 15, streaks: 0.8, joints: 3 })
  const roof = useConcrete('#a8a294', 10, 9, { seed: 6, grime: 0 })
  return (
    <group position={[-17, 0, -6]}>
      <Block size={[10, 15, 9]} r={0.06} position={[0, 7.5, 0]} material={[orange, orange, roof, roof, orange, orange]} />
      <Block size={[10.25, 0.3, 9.25]} r={0.04} position={[0, 15.1, 0]} material={orangeDark} />
      <Block size={[6, 13, 8]} r={0.06} position={[-7.5, 6.5, 1]} material={[orangeDark, orangeDark, roof, roof, orangeDark, orangeDark]} />
      <Block size={[6.25, 0.3, 8.25]} r={0.04} position={[-7.5, 13.1, 1]} material={orangeDark} />
      {/* Service door, louvres and a roof extract */}
      <Block size={[2.4, 3.2, 0.12]} r={0.02} position={[1.5, 1.6, 4.52]} material={M.darkSteel} />
      {[4.5, 8, 11.5].map((y) => (
        <Block key={y} size={[1.4, 0.9, 0.08]} r={0.02} position={[-2.8, y, 4.52]} material={M.galvanized} />
      ))}
      <mesh position={[2, 16.2, -1]} material={M.galvanized}>
        <cylinderGeometry args={[0.5, 0.5, 2, 14]} />
      </mesh>
      <ContactShadows
        spots={[
          [0, 0, 12.5, 11.5],
          [-7.5, 1, 8.5, 10.5],
        ]}
      />
    </group>
  )
}

function Offices() {
  return (
    <group>
      <OfficeBlock position={[-34, 0, 2]} size={[16, 7.5, 9]} cols={10} rows={3} seed={3} />
      <OfficeBlock position={[-30, 0, 14]} size={[11, 3.6, 6]} cols={7} rows={1} seed={4} />
    </group>
  )
}

/** Large storage hall with a pale profiled roof (bottom right of the photograph). */
function Warehouse() {
  const M = mats()
  const W = 28
  const D = 14
  const H = 6.6
  const walls = useCladding('#e6e1d2', W, H, { seed: 41, sheets: 2, wear: 0.6, box: true })
  const ends = useCladding('#e6e1d2', D, H, { seed: 42, sheets: 2, wear: 0.6, box: true })
  const roofMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.15 })
    applySet(m, corrugatedSet('#dedbd0', { ribs: 24, seed: 43, sheets: 1, wear: 0.7 }), 1, 6)
    m.map!.rotation = m.normalMap ? (m.normalMap.rotation = Math.PI / 2) : Math.PI / 2
    if (m.roughnessMap) m.roughnessMap.rotation = Math.PI / 2
    return weather(m, { macro: 0.18, scale: 12 })
  }, [])
  const roof = useMemo(() => gableRoof(D, W, 1.5, 0.5, 0.14), [])
  const door = useCladding('#8d9496', 4, 4.4, { seed: 44, sheets: 1, wear: 0.4, ribs: 2 })
  const gables = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-D / 2, 0)
    s.lineTo(D / 2, 0)
    s.lineTo(0, 1.5)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  return (
    <group position={[33, 0, 10]}>
      <Block size={[W, H, D]} r={0.04} position={[0, H / 2, 0]} material={[ends, ends, M.darkSteel, M.darkSteel, walls, walls]} />
      <mesh geometry={roof} position={[0, H, 0]} material={roofMat} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={gables} position={[(s * W) / 2, H, 0]} rotation-y={(s * Math.PI) / 2} material={ends} />
      ))}
      {/* Gutters, downpipes, roller doors */}
      {[-1, 1].map((s) => (
        <Block key={s} size={[W + 1, 0.16, 0.2]} r={0.04} position={[0, H - 0.05, s * (D / 2 + 0.45)]} material={M.galvanized} />
      ))}
      {[-13.6, 0, 13.6].map((x) => (
        <Block key={x} size={[0.12, H, 0.12]} r={0.03} position={[x, H / 2, D / 2 + 0.12]} material={M.galvanized} />
      ))}
      {[-8.5, 2, 9].map((x) => (
        <Block key={x} size={[4.2, 4.4, 0.1]} r={0.02} position={[x, 2.2, D / 2 + 0.04]} material={door} />
      ))}
      <ContactShadows spots={[[0, 0, W + 2.5, D + 2.5]]} />
    </group>
  )
}

/** Yard paving, access road with markings, kerbs, lawn, boundary wall and lighting. */
function SiteGround() {
  const yard = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.9 })
    applySet(m, concreteSet('#b9b2a2', 3, 4), 15, 6)
    return weather(m, { macro: 0.3, scale: 22 })
  }, [])
  const road = useAsphalt(150, 7)
  const lawn = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 1 })
    applySet(m, grassSet(31, 1), 5, 2)
    return weather(m, { macro: 0.25, scale: 9 })
  }, [])
  const kerb = useConcrete('#cfc9ba', 150, 1, { seed: 2 })
  const wall = useWall('#e2dbc8', 120, { seed: 51, streaks: 0.8 })
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e8e4d6', roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -3 }), [])
  const dashes = useMemo(() => Array.from({ length: 38 }, (_, i) => ({ p: [-74 + i * 4, 0.075, 23.5] as [number, number, number], s: [1.9, 0.01, 0.13] as [number, number, number] })), [])
  const bays = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ p: [-5 + i * 2.6, 0.045, 17.4] as [number, number, number], s: [0.1, 0.01, 4.4] as [number, number, number] })), [])
  const lamps = useMemo<[number, number, number?][]>(
    () => [
      [10, 19.4, Math.PI],
      [-22, 19.4, Math.PI],
      [42, 19.4, Math.PI],
      [-52, 19.4, Math.PI],
      [70, 19.4, Math.PI],
      [14, 12, -Math.PI / 2],
      [-12, 4.5, Math.PI / 2],
    ],
    [],
  )
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[2, 0.03, 2]} material={yard} userData={{ castShadow: false }}>
        <planeGeometry args={[94, 35]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 23.5]} material={road} userData={{ castShadow: false }}>
        <planeGeometry args={[160, 7]} />
      </mesh>
      <Inst geometry={unitBox} material={paint} items={dashes} userData={{ noShadow: true }} />
      <Inst geometry={unitBox} material={paint} items={bays} userData={{ noShadow: true }} />
      {[19.85, 27.15].map((z) => (
        <Block key={z} size={[160, 0.22, 0.3]} r={0.04} position={[0, 0.1, z]} material={kerb} />
      ))}
      {/* Lawn in front of the offices */}
      <mesh rotation-x={-Math.PI / 2} position={[-18, 0.06, 15]} material={lawn} userData={{ castShadow: false }}>
        <planeGeometry args={[18.5, 6]} />
      </mesh>
      {/* Boundary wall behind the plant, fence along the road */}
      <Block size={[120, 2.4, 0.3]} r={0.03} position={[4, 1.2, -16]} material={wall} />
      <Fence
        points={[
          [-45, 19.3],
          [-12, 19.3],
        ]}
      />
      <Fence
        points={[
          [22, 19.3],
          [49, 19.3],
        ]}
      />
      <Lamps spots={lamps} height={8.5} lights={3} />
    </group>
  )
}

/** A few parked cars — simple, but they give the site its scale. */
function Cars() {
  const M = mats()
  const cars = useMemo(() => {
    const r = rng(77)
    const tones = ['#d9d9d6', '#3a3d42', '#b9bcc0', '#7d1f1c', '#e9e7e0', '#22364f', '#8e8b84']
    return [-5, -2.4, 2.8, 5.4, 10.6, 13.2].map((x) => ({ x: x + 1.3, tone: tones[Math.floor(r() * tones.length)], flip: r() > 0.5 }))
  }, [])
  const paints = useMemo(() => cars.map((c) => new THREE.MeshStandardMaterial({ color: c.tone, roughness: 0.28, metalness: 0.55 })), [cars])
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.32, 0.32, 0.22, 14).rotateZ(Math.PI / 2), [])
  return (
    <group>
      {cars.map((c, i) => (
        <group key={i} position={[c.x, 0, 17.3]} rotation-y={c.flip ? Math.PI : 0}>
          <Block size={[1.75, 0.62, 4.2]} r={0.2} position={[0, 0.62, 0]} material={paints[i]} />
          <Block size={[1.55, 0.55, 2.2]} r={0.22} position={[0, 1.15, -0.25]} material={M.glass} />
          <Block size={[1.5, 0.06, 1.7]} r={0.03} position={[0, 1.43, -0.25]} material={paints[i]} />
          {[-1.3, 1.3].map((z) => [-0.82, 0.82].map((x) => <mesh key={`${x}${z}`} geometry={wheel} position={[x, 0.32, z]} material={M.rubber} />))}
          <ContactShadows spots={[[0, 0, 2.6, 5.2]]} y={0.07} />
        </group>
      ))}
    </group>
  )
}

/** Grain loading from the silo outlet into a bulk truck — GPU-animated points. */
function GrainStream({ color, density }: { color: string; density: number }) {
  const M = mats()
  const count = Math.round(900 * Math.max(density, 0.3))
  const origin = useMemo(() => new THREE.Vector3(19.7, 0, 4), [])
  const geometry = useMemo(() => {
    const r = rng(11)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 0.3
      pos[i * 3] = origin.x + Math.cos(a) * rad
      pos[i * 3 + 2] = origin.z + Math.sin(a) * rad
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count, origin])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color('#d8b56a').lerp(new THREE.Color(color), 0.25) } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          attribute float aSeed;
          varying float vA;
          void main() {
            vec3 p = position;
            float h = mod(aSeed * 6.0 + uTime * (4.0 + aSeed * 2.0), 6.0);
            p.y = 9.9 - h;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (1.4 + aSeed * 1.4) * (30.0 / -mv.z);
            vA = smoothstep(0.0, 0.6, h) * smoothstep(6.0, 5.0, h);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vA;
          void main() {
            if (length(gl_PointCoord - 0.5) > 0.5) discard;
            gl_FragColor = vec4(uColor, vA * 0.9);
          }
        `,
      }),
    [color],
  )
  useFrame((state) => {
    if (zoneAwake(0)) material.uniforms.uTime.value = state.clock.elapsedTime
  })
  const legs = useMemo(
    () => [-1.5, 1.5].flatMap((x) => [-1.5, 1.5].map((z) => beam([origin.x + x, 0, origin.z + z], [origin.x + x, 11.2, origin.z + z], 0.2))),
    [origin],
  )
  const braces = useMemo(
    () => [
      beam([origin.x - 1.5, 5.2, origin.z + 1.5], [origin.x + 1.5, 9.6, origin.z + 1.5], 0.08),
      beam([origin.x + 1.5, 5.2, origin.z + 1.5], [origin.x - 1.5, 9.6, origin.z + 1.5], 0.08),
      beam([origin.x - 1.5, 5.2, origin.z - 1.5], [origin.x - 1.5, 9.6, origin.z + 1.5], 0.08),
      beam([origin.x + 1.5, 5.2, origin.z + 1.5], [origin.x + 1.5, 9.6, origin.z - 1.5], 0.08),
      beam([origin.x - 1.5, 5.2, origin.z - 1.5], [origin.x + 1.5, 5.2, origin.z - 1.5], 0.1),
      beam([origin.x - 1.5, 5.2, origin.z + 1.5], [origin.x + 1.5, 5.2, origin.z + 1.5], 0.1),
    ],
    [origin],
  )
  return (
    <group>
      {/* Truck loading bin on legs, fed from the gallery */}
      <Block size={[3.2, 2.6, 3.2]} r={0.06} position={[origin.x, 12.6, origin.z]} material={M.galvanized} />
      <mesh position={[origin.x, 10.6, origin.z]} rotation={[Math.PI, Math.PI / 4, 0]} material={M.galvanized}>
        <coneGeometry args={[2.2, 1.5, 4]} />
      </mesh>
      <Inst geometry={unitBox} material={M.darkSteel} matrices={legs} />
      <Inst geometry={unitBox} material={M.darkSteel} matrices={braces} />
      <Block size={[0.9, 0.9, 6.5]} r={0.04} position={[origin.x, 14.6, origin.z - 3.6]} rotation-x={0.12} material={M.galvanized} />
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
