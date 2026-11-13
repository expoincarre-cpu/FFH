'use client'

import * as THREE from 'three'
import { useMemo } from 'react'
import { ZONES, rng } from '../shared'
import { applySet, concreteSet, corrugatedSet } from '../textures'
import { weather } from '../materials'
import { Block, ContactShadows, Inst, beam, bevelBox, mats, unitBox, usePanels, type Item } from '../props'
import { truss } from './util'

const HALL = { w: 36, d: 28, h: 5.4, x: 2, z: 0 }
const ISLAND = { x: -4, z: 0 }

/**
 * STAGE 05 — finished food at the point of sale: an open-fronted market hall
 * with a tiered island display of tray-packed poultry, refrigerated multideck
 * cabinets along the walls and glass-topped chest counters, under LED lighting.
 */
export function Food({ color, density }: { color: string; density: number }) {
  return (
    <group position={[0, 0, ZONES.food]}>
      <Hall color={color} />
      <Island color={color} density={density} />
      <Multidecks color={color} density={density} />
      <Chests color={color} />
      {[
        [-8, -4],
        [8, -4],
        [-8, 7],
        [8, 7],
      ].map(([x, z], i) => (
        <pointLight key={i} position={[HALL.x + x, HALL.h - 1.1, z]} color="#fff1dc" intensity={45} distance={26} decay={1.6} userData={{ night: 100, day: 45 }} />
      ))}
      <pointLight position={[ISLAND.x, 4.2, ISLAND.z]} color={color} intensity={10} distance={14} decay={1.7} userData={{ night: 30, day: 10 }} />
    </group>
  )
}

function Hall({ color }: { color: string }) {
  const M = mats()
  const floor = useMemo(() => {
    // Large-format polished tiles.
    const m = new THREE.MeshStandardMaterial({ roughness: 0.22 })
    applySet(m, concreteSet('#d9d4c8', 71, 4), 7, 6)
    m.roughnessMap = m.metalnessMap = null
    m.roughness = 0.24
    m.metalness = 0
    m.normalScale.setScalar(0.3)
    return weather(m, { macro: 0.08, scale: 9 })
  }, [])
  const wall = usePanels('#efece3', HALL.w, { seed: 72, cols: 6, wear: 0.2 })
  const wallSide = usePanels('#efece3', HALL.d, { seed: 73, cols: 6, wear: 0.2 })
  const roofMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 })
    applySet(m, corrugatedSet('#d8d6ce', { ribs: 24, seed: 74, sheets: 1, wear: 0.6 }), 7, 1)
    return weather(m, { macro: 0.18, scale: 12 })
  }, [])
  const led = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#fff4e2'), emissiveIntensity: 5, roughness: 0.5 })
    m.userData.nightGlow = 9
    m.userData.dayGlow = 5
    return m
  }, [])
  const fascia = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.55), roughness: 0.5, metalness: 0.2 }), [color])
  const frames = useMemo(() => Array.from({ length: 5 }, (_, i) => -HALL.d / 2 + 0.5 + i * ((HALL.d - 1) / 4)), [])
  const steel = useMemo(() => {
    const out: THREE.Matrix4[] = []
    frames.forEach((z) => {
      out.push(...truss([-HALL.w / 2, HALL.h, z], [HALL.w / 2, HALL.h, z], 0.8, 14, 0.08))
      out.push(beam([HALL.w / 2, 0, z], [HALL.w / 2, HALL.h, z], 0.22))
    })
    for (let i = 0; i < 5; i++) out.push(beam([-HALL.w / 2 + 4 + i * 7.5, 0, HALL.d / 2 - 0.3], [-HALL.w / 2 + 4 + i * 7.5, HALL.h, HALL.d / 2 - 0.3], 0.22))
    return out
  }, [frames])
  const leds = useMemo(
    () => frames.flatMap((z) => [-9, 0, 9].map((x) => ({ p: [x, HALL.h - 0.95, z] as [number, number, number], s: [7.5, 0.06, 0.16] as [number, number, number] }))),
    [frames],
  )
  return (
    <group position={[HALL.x, 0, HALL.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 2]} material={floor} userData={{ castShadow: false }}>
        <planeGeometry args={[HALL.w + 4, HALL.d + 8]} />
      </mesh>
      {/* Back and left walls; open towards the camera */}
      <Block size={[HALL.w, HALL.h, 0.25]} r={0.02} position={[0, HALL.h / 2, -HALL.d / 2]} material={wall} />
      <Block size={[0.25, HALL.h, HALL.d]} r={0.02} position={[-HALL.w / 2, HALL.h / 2, 0]} material={wallSide} />
      <Block size={[HALL.w + 1.4, 0.14, HALL.d + 1.4]} r={0.03} position={[0, HALL.h + 0.2, 0]} material={roofMat} />
      <Block size={[HALL.w + 1.5, 0.7, 0.2]} r={0.04} position={[0, HALL.h - 0.1, HALL.d / 2 + 0.7]} material={fascia} />
      <Block size={[0.2, 0.7, HALL.d + 1.5]} r={0.04} position={[HALL.w / 2 + 0.7, HALL.h - 0.1, 0]} material={fascia} />
      <Inst geometry={unitBox} material={M.darkSteel} matrices={steel} />
      <Inst geometry={unitBox} material={led} items={leds} userData={{ noShadow: true }} />
      <ContactShadows spots={[[0, -HALL.d / 2, HALL.w + 2, 3]]} />
    </group>
  )
}

const trayGeo = bevelBox(1.0, 0.1, 0.7, 0.03)
const meatGeo = (() => {
  const g = new THREE.SphereGeometry(1, 14, 8)
  g.scale(0.42, 0.13, 0.28)
  g.translate(0, 0.1, 0)
  return g
})()
const filmGeo = bevelBox(0.98, 0.16, 0.68, 0.06).translate(0, 0.1, 0)
const labelGeo = new THREE.BoxGeometry(0.4, 0.004, 0.24).translate(0.22, 0.186, 0.14)

/** Tray packs: foam tray, cut of meat, stretch film and a printed label. */
function TrayPacks({ items, color, seed }: { items: Item[]; color: string; seed: number }) {
  const tray = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f1efe9', roughness: 0.5 }), [])
  const meat = useMemo(() => new THREE.MeshPhysicalMaterial({ roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.3 }), [])
  const film = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.16, roughness: 0.05, metalness: 0.2, depthWrite: false, envMapIntensity: 1.8 }),
    [],
  )
  const label = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6 }), [])
  const tints = useMemo(() => {
    const r = rng(seed)
    const cuts = ['#e3b49c', '#ecc2aa', '#d99c82', '#e6ad90', '#f0cdb8']
    const labels = [color, '#0f3525', '#d1b572', '#f4f1e8']
    return {
      meat: items.map(() => new THREE.Color(cuts[Math.floor(r() * cuts.length)])),
      label: items.map((_, i) => new THREE.Color(labels[i % labels.length])),
    }
  }, [items, color, seed])
  return (
    <group>
      <Inst geometry={trayGeo} material={tray} items={items} />
      <Inst geometry={meatGeo} material={meat} items={items} colors={tints.meat} userData={{ castShadow: false }} />
      <Inst geometry={labelGeo} material={label} items={items} colors={tints.label} userData={{ noShadow: true }} />
      <Inst geometry={filmGeo} material={film} items={items} userData={{ noShadow: true }} renderOrder={3} />
    </group>
  )
}

/** Tiered circular island: the centrepiece display. */
function Island({ color, density }: { color: string; density: number }) {
  const M = mats()
  const tiers = [
    { r: 3.3, y: 0.85 },
    { r: 2.5, y: 1.3 },
    { r: 1.7, y: 1.75 },
    { r: 0.9, y: 2.2 },
  ]
  const wood = useMemo(() => weather(new THREE.MeshStandardMaterial({ color: '#8a6a45', roughness: 0.6 }), { macro: 0.2, scale: 3 }), [])
  const items = useMemo(() => {
    const r = rng(52)
    const out: Item[] = []
    tiers.forEach((t, k) => {
      const ring = t.r - 0.42
      const n = Math.max(3, Math.floor(((Math.PI * 2 * ring) / 0.82) * (density < 0.5 ? 0.7 : 1)))
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + k * 0.3
        out.push({ p: [ISLAND.x + Math.cos(a) * ring, t.y + 0.06, ISLAND.z + Math.sin(a) * ring], r: [0, -a + Math.PI / 2 + (r() - 0.5) * 0.12, 0] })
      }
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density])
  return (
    <group>
      {tiers.map((t, i) => (
        <group key={i} position={[ISLAND.x, 0, ISLAND.z]}>
          <mesh position={[0, t.y / 2, 0]} material={i === 0 ? M.white : wood}>
            <cylinderGeometry args={[t.r, t.r, t.y, 48]} />
          </mesh>
          <mesh position={[0, t.y + 0.012, 0]} material={M.stainless}>
            <cylinderGeometry args={[t.r + 0.04, t.r + 0.04, 0.03, 48]} />
          </mesh>
        </group>
      ))}
      <TrayPacks items={items} color={color} seed={53} />
      <ContactShadows spots={[[ISLAND.x, ISLAND.z, 8.4, 8.4]]} />
    </group>
  )
}

/** Refrigerated multideck cabinets along the back and side walls. */
function Multidecks({ color, density }: { color: string; density: number }) {
  const M = mats()
  const units = useMemo(
    () => [
      ...[-10.5, -2.5, 5.5, 13.5].map((x) => ({ x: HALL.x + x, z: -HALL.d / 2 + 1.0, yaw: 0 })),
      ...[-7, 1, 9].map((z) => ({ x: HALL.x - HALL.w / 2 + 1.0, z, yaw: Math.PI / 2 })),
    ],
    [],
  )
  const strip = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#f2f7ff'), emissiveIntensity: 3.5 })
    m.userData.nightGlow = 6
    m.userData.dayGlow = 3.5
    return m
  }, [])
  const header = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 0.5 }), [color])
  const interior = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f4f0', roughness: 0.35 }), [])
  const product = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.45 }), [])
  const per = Math.round(11 * Math.max(density, 0.5))
  const products = useMemo(() => {
    const r = rng(77)
    const tones = [color, '#e9dfcd', '#b8925a', '#8e9c5c', '#f1efe9', '#d8b9a2']
    const out: Item[] = []
    units.forEach((u) => {
      for (let level = 0; level < 4; level++)
        for (let k = 0; k < per; k++)
          for (let depth = 0; depth < 2; depth++) {
            const along = -3.5 + ((k + 0.5) / per) * 7
            const off = 0.0 + depth * 0.36
            const y = 0.52 + level * 0.52
            const x = u.yaw ? u.x - 0.15 + off : u.x + along
            const z = u.yaw ? u.z + along : u.z - 0.15 + off
            out.push({ p: [x, y + 0.11, z], r: [0, u.yaw + (r() - 0.5) * 0.1, 0], s: [0.5 + r() * 0.08, 0.16 + r() * 0.14, 0.3], c: tones[Math.floor(r() * tones.length)] })
          }
    })
    return out
  }, [units, per, color])
  return (
    <group>
      {units.map((u, i) => (
        <group key={i} position={[u.x, 0, u.z]} rotation-y={u.yaw}>
          <Block size={[7.8, 0.36, 1.1]} r={0.04} position={[0, 0.18, 0.05]} material={M.darkSteel} />
          <Block size={[7.8, 2.5, 0.12]} r={0.02} position={[0, 1.6, -0.44]} material={interior} />
          <Block size={[7.8, 0.3, 1.0]} r={0.05} position={[0, 2.75, 0.0]} material={header} />
          {[-3.9, 3.9].map((x) => (
            <Block key={x} size={[0.08, 2.5, 1.0]} r={0.02} position={[x, 1.6, 0]} material={M.white} />
          ))}
          {[0, 1, 2, 3].map((l) => (
            <group key={l}>
              <Block size={[7.7, 0.04, 0.8]} r={0.01} position={[0, 0.5 + l * 0.52, 0.02]} material={M.stainless} />
              <Block size={[7.6, 0.03, 0.04]} position={[0, 0.96 + l * 0.52, 0.36]} material={strip} userData={{ noShadow: true }} />
            </group>
          ))}
        </group>
      ))}
      <Inst geometry={bevelBox(1, 1, 1, 0.04)} material={product} items={products} userData={{ castShadow: false }} />
      <ContactShadows spots={units.map((u) => (u.yaw ? [u.x, u.z, 2.4, 9] : [u.x, u.z, 9, 2.4]))} />
    </group>
  )
}

/** Glass-topped chest counters between the island and the entrance. */
function Chests({ color }: { color: string }) {
  const M = mats()
  const chests = [
    { x: 6.5, z: 3 },
    { x: 6.5, z: 8.5 },
    { x: 12.5, z: 3 },
  ]
  const items = useMemo(() => {
    const out: Item[] = []
    chests.forEach((c) => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) out.push({ p: [c.x - 1.65 + i * 1.1, 0.72, c.z - 0.42 + j * 0.84], r: [0, 0, 0] })
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <group>
      {chests.map((c, i) => (
        <group key={i} position={[c.x, 0, c.z]}>
          <Block size={[4.8, 0.72, 2.0]} r={0.08} position={[0, 0.36, 0]} material={M.white} />
          <Block size={[4.8, 0.3, 2.0]} r={0.06} position={[0, 0.9, 0]} material={M.clearGlass} userData={{ noShadow: true }} />
          <Block size={[4.9, 0.05, 2.1]} r={0.02} position={[0, 1.07, 0]} material={M.stainless} />
        </group>
      ))}
      <TrayPacks items={items} color={color} seed={91} />
      <ContactShadows spots={chests.map((c) => [c.x, c.z, 6, 3.2])} />
    </group>
  )
}
