'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ZONES, rng, tmpColor, tmpObject } from '../shared'
import { applySet, concreteSet, corrugatedSet } from '../textures'
import { weather } from '../materials'
import { Block, ContactShadows, Inst, beam, bevelBox, mats, unitBox, unitCyl, useCladding, usePanels } from '../props'
import { truss, zoneAwake } from './util'

const RACK = { w: 2.4, h: 3.4, d: 1.5, levels: 6, cols: 5, rows: 3 }
const HALL = { w: 34, d: 40, h: 7, x: 4, z: -2 }
const TABLE = { x: -7.5, z: 13.5, w: 7.2, d: 3.6, h: 0.9 }

/**
 * STAGE 02 — hatchery hall, seen from its open loading side: steel portal
 * frames and trusses under a profiled roof, insulated wall panels, setter and
 * hatcher cabinets, trolleys of hatching eggs on a resin floor, and the
 * hatching table with day-old chicks and turkey poults in their baskets.
 */
export function Hatchery({ color, density }: { color: string; density: number }) {
  const racks = useMemo(() => {
    const out: [number, number][] = []
    const rows = density < 0.5 ? 2 : 3
    const cols = density < 0.5 ? 4 : 6
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push([-1 + r * 5.5, -14 + c * 3.6])
    return out
  }, [density])

  return (
    <group position={[0, 0, ZONES.hatchery]}>
      <Hall color={color} />
      <Trolleys racks={racks} />
      <Eggs racks={racks} />
      <Cabinets />
      <HatchingTable density={density} />
      <Boxes />
      {/* Hall lighting: on day and night, slightly stronger at dusk. */}
      {[
        [-4, -10],
        [12, -10],
        [-4, 6],
        [12, 6],
      ].map(([x, z], i) => (
        <pointLight key={i} position={[HALL.x + x, HALL.h - 1.2, HALL.z + z]} color="#ffe9cc" intensity={90} distance={30} decay={1.6} userData={{ night: 150, day: 90 }} />
      ))}
      <pointLight position={[TABLE.x, 3.4, TABLE.z]} color="#ffe6c0" intensity={16} distance={12} decay={1.6} userData={{ night: 40, day: 16 }} />
    </group>
  )
}

function Hall({ color }: { color: string }) {
  const M = mats()
  const floor = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#b9c2bb', roughness: 0.3 })
    applySet(m, concreteSet('#aab3ad', 33), 6, 7)
    // Resin floor: smoother than raw concrete, so it picks up soft reflections.
    m.roughnessMap = null
    m.metalnessMap = null
    m.roughness = 0.36
    m.metalness = 0
    m.envMapIntensity = 0.45
    m.normalScale.setScalar(0.25)
    return weather(m, { macro: 0.12, scale: 9 })
  }, [])
  const wall = usePanels('#ecebe4', HALL.w, { seed: 21, cols: 8, wear: 0.25 })
  const wallSide = usePanels('#ecebe4', HALL.d, { seed: 22, cols: 8, wear: 0.25 })
  const exterior = useCladding('#e2dcc9', HALL.d, HALL.h, { seed: 23, sheets: 2, box: true })
  const roofMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.2 })
    applySet(m, corrugatedSet('#d5d4cc', { ribs: 24, seed: 24, sheets: 1, wear: 0.6 }), 7, 1)
    return weather(m, { macro: 0.18, scale: 12 })
  }, [])
  const led = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: new THREE.Color('#fff3df'), emissiveIntensity: 5, roughness: 0.5 })
    m.userData.nightGlow = 9
    m.userData.dayGlow = 5
    return m
  }, [])
  const line = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e0b63a', roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 }), [])
  const accent = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -3 }), [color])

  const frames = useMemo(() => Array.from({ length: 7 }, (_, i) => -HALL.d / 2 + 0.4 + i * ((HALL.d - 0.8) / 6)), [])
  const steel = useMemo(() => {
    const out: THREE.Matrix4[] = []
    frames.forEach((z) => {
      out.push(...truss([-HALL.w / 2, HALL.h, z], [HALL.w / 2, HALL.h, z], 1.0, 14, 0.09))
      // Columns on the open sides.
      if (z < 4) out.push(beam([-HALL.w / 2, 0, z], [-HALL.w / 2, HALL.h, z], 0.24))
    })
    for (let i = 3; i < 6; i++) out.push(beam([-HALL.w / 2 + 3 + i * 5.6, 0, HALL.d / 2 - 0.4], [-HALL.w / 2 + 3 + i * 5.6, HALL.h, HALL.d / 2 - 0.4], 0.24))
    // Purlins.
    for (let i = 0; i <= 8; i++) {
      const x = -HALL.w / 2 + (i * HALL.w) / 8
      out.push(beam([x, HALL.h + 0.08, -HALL.d / 2], [x, HALL.h + 0.08, HALL.d / 2], 0.12))
    }
    return out
  }, [frames])
  const leds = useMemo(() => frames.map((z) => ({ p: [0, HALL.h - 1.12, z] as [number, number, number], s: [HALL.w * 0.82, 0.07, 0.14] as [number, number, number] })), [frames])
  const flanges = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ p: [-HALL.w / 2 + 2 + i * 2.8, HALL.h - 2.0, -HALL.d / 2 + 1.5] as [number, number, number], r: [0, 0, Math.PI / 2] as [number, number, number], s: [1.24, 0.06, 1.24] as [number, number, number] })), [])

  return (
    <group position={[HALL.x, 0, HALL.z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]} material={floor} userData={{ castShadow: false }}>
        <planeGeometry args={[HALL.w + 6, HALL.d + 6]} />
      </mesh>
      {/* Safety walkway markings */}
      <Block size={[0.12, 0.012, HALL.d - 6]} position={[-HALL.w / 2 + 3.2, 0.05, 0]} material={line} userData={{ noShadow: true }} />
      <Block size={[HALL.w - 8, 0.012, 0.12]} position={[-1, 0.05, HALL.d / 2 - 5.4]} material={line} userData={{ noShadow: true }} />
      <Block size={[0.14, 0.012, HALL.d - 4]} position={[HALL.w / 2 - 1.3, 0.05, 2]} material={accent} userData={{ noShadow: true }} />
      {/* Back and right walls; the camera looks in through the open loading side */}
      <Block size={[HALL.w, HALL.h, 0.25]} r={0.02} position={[0, HALL.h / 2, -HALL.d / 2]} material={wall} />
      <Block size={[0.25, HALL.h, HALL.d]} r={0.02} position={[HALL.w / 2, HALL.h / 2, 0]} material={[exterior, wallSide, wallSide, wallSide, wallSide, wallSide]} />
      {/* Hygienic coving and a personnel door */}
      <Block size={[HALL.w, 0.3, 0.2]} r={0.08} position={[0, 0.15, -HALL.d / 2 + 0.2]} material={M.stainless} />
      <Block size={[0.2, 0.3, HALL.d]} r={0.08} position={[HALL.w / 2 - 0.2, 0.15, 0]} material={M.stainless} />
      <Block size={[0.08, 2.3, 1.2]} r={0.02} position={[HALL.w / 2 - 0.15, 1.15, 12]} material={M.stainless} />
      {/* Roof: profiled deck on purlins and trusses */}
      <Block size={[HALL.w + 1.2, 0.14, HALL.d + 1.2]} r={0.03} position={[0, HALL.h + 0.24, 0]} material={roofMat} />
      <Inst geometry={unitBox} material={M.darkSteel} matrices={steel} />
      <Inst geometry={unitBox} material={led} items={leds} userData={{ noShadow: true }} />
      {/* Air handling: main duct with flanges and drops */}
      <mesh position={[0, HALL.h - 2.0, -HALL.d / 2 + 1.5]} rotation-z={Math.PI / 2} material={M.galvanized}>
        <cylinderGeometry args={[0.56, 0.56, HALL.w - 1.5, 22]} />
      </mesh>
      <Inst geometry={unitCyl} material={M.galvanized} items={flanges} />
      <ContactShadows spots={[[0, -HALL.d / 2, HALL.w + 2, 3]]} />
    </group>
  )
}

/** Setter / hatcher cabinets lining the back wall. */
function Cabinets() {
  const M = mats()
  const xs = useMemo(() => Array.from({ length: 6 }, (_, i) => -HALL.w / 2 + 3.5 + i * 5.2), [])
  const screen = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#0c1512', emissive: new THREE.Color('#7fe0a4'), emissiveIntensity: 2.2, roughness: 0.3 })
    m.userData.nightGlow = 3.2
    m.userData.dayGlow = 2.2
    return m
  }, [])
  const doors = useMemo(() => xs.flatMap((x) => [-1.15, 1.15].map((dx) => ({ p: [x + dx, 2.3, 1.32] as [number, number, number] }))), [xs])
  const handles = useMemo(() => xs.flatMap((x) => [-0.2, 0.2].map((dx) => ({ p: [x + dx, 2.3, 1.4] as [number, number, number] }))), [xs])
  const windows = useMemo(() => xs.flatMap((x) => [-1.15, 1.15].map((dx) => ({ p: [x + dx, 3.3, 1.345] as [number, number, number] }))), [xs])
  return (
    <group position={[HALL.x, 0, HALL.z - HALL.d / 2 + 1.6]}>
      <Inst geometry={bevelBox(4.7, 4.8, 2.6, 0.06)} material={M.white} items={xs.map((x) => ({ p: [x, 2.4, 0] as [number, number, number] }))} />
      <Inst geometry={bevelBox(2.12, 4.2, 0.06, 0.02)} material={M.stainless} items={doors} />
      <Inst geometry={bevelBox(0.05, 1.2, 0.07, 0.02)} material={M.darkSteel} items={handles} />
      <Inst geometry={bevelBox(0.5, 0.5, 0.04, 0.02)} material={M.glass} items={windows} />
      <Inst geometry={bevelBox(0.8, 0.22, 0.04, 0.01)} material={screen} items={xs.map((x) => ({ p: [x, 4.5, 1.33] as [number, number, number] }))} />
      {/* Kick plinth and service trunking above */}
      <Block size={[HALL.w - 3, 0.16, 2.7]} r={0.02} position={[0, 0.08, 0]} material={M.stainless} />
      <Block size={[HALL.w - 3, 0.3, 0.5]} r={0.04} position={[0, 5.0, 0.6]} material={M.galvanized} />
    </group>
  )
}

/** Stainless trolleys holding plastic setter trays. */
function Trolleys({ racks }: { racks: [number, number][] }) {
  const M = mats()
  const { w, h, d, levels } = RACK
  const tray = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b3a4a', roughness: 0.55 }), [])
  const data = useMemo(() => {
    const frame: THREE.Matrix4[] = []
    const trays: { p: [number, number, number] }[] = []
    const castors: { p: [number, number, number] }[] = []
    racks.forEach(([x, z]) => {
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) {
          const px = x + (sx * w) / 2
          const pz = z + (sz * d) / 2
          frame.push(beam([px, 0.24, pz], [px, h + 0.4, pz], 0.06))
          castors.push({ p: [px, 0.12, pz] })
        }
      for (const sz of [-1, 1]) {
        frame.push(beam([x - w / 2, h + 0.4, z + (sz * d) / 2], [x + w / 2, h + 0.4, z + (sz * d) / 2], 0.05))
        frame.push(beam([x - w / 2, 0.3, z + (sz * d) / 2], [x + w / 2, 0.3, z + (sz * d) / 2], 0.05))
      }
      for (const sx of [-1, 1]) frame.push(beam([x + (sx * w) / 2, h + 0.4, z - d / 2], [x + (sx * w) / 2, h + 0.4, z + d / 2], 0.05))
      for (let l = 0; l < levels; l++) trays.push({ p: [x, 0.46 + l * (h / levels), z] })
    })
    return { frame, trays, castors }
  }, [racks, w, h, d, levels])
  return (
    <group>
      <Inst geometry={unitBox} material={M.stainless} matrices={data.frame} />
      <Inst geometry={bevelBox(w - 0.06, 0.07, d - 0.04, 0.02)} material={tray} items={data.trays} />
      <Inst geometry={new THREE.SphereGeometry(0.12, 8, 6)} material={M.rubber} items={data.castors} />
      <ContactShadows spots={racks.map(([x, z]) => [x, z, w + 1, d + 1])} />
    </group>
  )
}

const eggGeo = (() => {
  // True egg profile: blunt end down, pointed end up.
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const a = t * Math.PI
    pts.push(new THREE.Vector2(Math.sin(a) * 0.15 * (1 - 0.18 * Math.cos(a) * -1 - 0.1), -Math.cos(a) * 0.2))
  }
  return new THREE.LatheGeometry(pts, 12)
})()

function Eggs({ racks }: { racks: [number, number][] }) {
  const perTray = RACK.cols * RACK.rows
  const count = racks.length * RACK.levels * perTray
  const ref = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const r = rng(21)
    const tones = ['#f1e6d2', '#e6d2b3', '#dcc29c', '#efe0c8', '#d9b890']
    let i = 0
    racks.forEach(([x, z]) => {
      for (let l = 0; l < RACK.levels; l++) {
        const y = 0.68 + l * (RACK.h / RACK.levels)
        for (let a = 0; a < RACK.cols; a++)
          for (let b = 0; b < RACK.rows; b++) {
            tmpObject.position.set(x - RACK.w / 2 + 0.3 + a * 0.45, y, z - RACK.d / 2 + 0.35 + b * 0.4)
            tmpObject.rotation.set((r() - 0.5) * 0.25, r() * 6, (r() - 0.5) * 0.25)
            tmpObject.scale.setScalar(0.92 + r() * 0.16)
            tmpObject.updateMatrix()
            mesh.setMatrixAt(i, tmpObject.matrix)
            mesh.setColorAt(i, tmpColor.set(tones[Math.floor(r() * tones.length)]))
            i++
          }
      }
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [racks])

  return (
    <instancedMesh ref={ref} args={[eggGeo, undefined, count]} frustumCulled={false}>
      {/* Shell: matte with a soft sheen and a thin glaze, so it does not read as plastic. */}
      <meshPhysicalMaterial roughness={0.5} sheen={0.6} sheenRoughness={0.5} sheenColor="#fff1dc" clearcoat={0.12} clearcoatRoughness={0.5} />
    </instancedMesh>
  )
}

const chickGeo = (() => {
  const paint = (g: THREE.BufferGeometry, c: string) => {
    const col = new THREE.Color(c)
    const n = g.attributes.position.count
    const a = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) col.toArray(a, i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(a, 3))
    return g
  }
  const body = paint(new THREE.SphereGeometry(0.15, 12, 9).scale(0.92, 0.88, 1.15), '#ffffff')
  const head = paint(new THREE.SphereGeometry(0.105, 10, 8).translate(0, 0.19, 0.15), '#ffffff')
  const beak = paint(new THREE.ConeGeometry(0.03, 0.08, 6).rotateX(Math.PI / 2).translate(0, 0.18, 0.28), '#e08a2a')
  const eyes = [-1, 1].map((s) => paint(new THREE.SphereGeometry(0.014, 5, 4).translate(s * 0.06, 0.215, 0.235), '#0a0a0a'))
  const wings = [-1, 1].map((s) => paint(new THREE.SphereGeometry(0.1, 8, 6).scale(0.35, 0.7, 1).translate(s * 0.15, 0.0, -0.02), '#f3f3f3'))
  return mergeGeometries([body, head, beak, ...eyes, ...wings])
})()

/** Hatching table with baskets of newborn chicks (yellow) and turkey poults (buff), gently alive. */
function HatchingTable({ density }: { density: number }) {
  const M = mats()
  const count = Math.round(110 * Math.max(density, 0.5))
  const ref = useRef<THREE.InstancedMesh>(null)
  const baskets = useMemo(() => {
    const out: { p: [number, number, number]; c: string }[] = []
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) out.push({ p: [TABLE.x - 2.55 + i * 1.7, TABLE.h + 0.14, TABLE.z - 0.8 + j * 1.6], c: (i + j) % 3 === 0 ? '#3c6fb0' : '#e2c53e' })
    return out
  }, [])
  const seeds = useMemo(() => {
    const r = rng(33)
    return Array.from({ length: count }, (_, i) => {
      const b = baskets[i % baskets.length]
      return {
        x: b.p[0] + (r() - 0.5) * 1.25,
        z: b.p[2] + (r() - 0.5) * 1.15,
        a: r() * Math.PI * 2,
        s: 0.66 + r() * 0.26,
        poult: (i % baskets.length) % 3 === 0,
        ph: r() * 10,
      }
    })
  }, [count, baskets])

  useLayoutEffect(() => {
    const r = rng(34)
    seeds.forEach((s, i) => ref.current?.setColorAt(i, tmpColor.set(s.poult ? '#d2b684' : '#f2c838').multiplyScalar(0.9 + r() * 0.2)))
    if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [seeds])

  const place = (t: number) => {
    const mesh = ref.current
    if (!mesh) return
    seeds.forEach((s, i) => {
      const hop = Math.max(0, Math.sin(t * 3 + s.ph)) * 0.04
      const yaw = s.a + Math.sin(t * 0.5 + s.ph) * 0.8
      const peck = Math.max(0, Math.sin(t * 1.7 + s.ph * 2)) * 0.35
      tmpObject.position.set(s.x, TABLE.h + 0.2 + hop, s.z)
      tmpObject.rotation.set(peck, yaw, 0, 'YXZ')
      tmpObject.scale.setScalar(s.s)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => place(0))
  useFrame((state) => {
    if (zoneAwake(1)) place(state.clock.elapsedTime)
  })

  const legs = useMemo(
    () => [-1, 1].flatMap((sx) => [-1, 1].map((sz) => beam([TABLE.x + sx * (TABLE.w / 2 - 0.2), 0, TABLE.z + sz * (TABLE.d / 2 - 0.2)], [TABLE.x + sx * (TABLE.w / 2 - 0.2), TABLE.h, TABLE.z + sz * (TABLE.d / 2 - 0.2)], 0.07))),
    [],
  )
  const basketMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.5, side: THREE.DoubleSide }), [])
  const basketGeo = useMemo(() => {
    // Open-topped crate: four walls and a floor.
    const w = 1.55
    const d = 1.45
    const h = 0.26
    const parts = [
      new THREE.BoxGeometry(w, 0.03, d).translate(0, -h / 2, 0),
      new THREE.BoxGeometry(w, h, 0.03).translate(0, 0, d / 2),
      new THREE.BoxGeometry(w, h, 0.03).translate(0, 0, -d / 2),
      new THREE.BoxGeometry(0.03, h, d).translate(w / 2, 0, 0),
      new THREE.BoxGeometry(0.03, h, d).translate(-w / 2, 0, 0),
    ]
    return mergeGeometries(parts)
  }, [])
  return (
    <group>
      <Block size={[TABLE.w, 0.06, TABLE.d]} r={0.02} position={[TABLE.x, TABLE.h - 0.03, TABLE.z]} material={M.stainless} />
      <Block size={[TABLE.w - 0.3, 0.05, TABLE.d - 0.3]} r={0.02} position={[TABLE.x, 0.3, TABLE.z]} material={M.stainless} />
      <Inst geometry={unitBox} material={M.stainless} matrices={legs} />
      <Inst geometry={basketGeo} material={basketMat} items={baskets} />
      <instancedMesh ref={ref} args={[chickGeo, undefined, count]} frustumCulled={false}>
        {/* Down: fully rough with a strong sheen lobe — the fuzzy rim light of real chicks. */}
        <meshPhysicalMaterial vertexColors roughness={1} sheen={1} sheenRoughness={0.75} sheenColor="#fff6cf" />
      </instancedMesh>
      <ContactShadows spots={[[TABLE.x, TABLE.z, TABLE.w + 1.4, TABLE.d + 1.4]]} />
    </group>
  )
}

/** Stacks of chick-delivery boxes on pallets, ready for the farms. */
function Boxes() {
  const data = useMemo(() => {
    const r = rng(45)
    const boxes: { p: [number, number, number]; r: [number, number, number]; c: string }[] = []
    const pallets: { p: [number, number, number] }[] = []
    ;[
      [-10.5, 5.5],
      [-10.5, 2.6],
      [-8.2, -1.2],
    ].forEach(([x, z], k) => {
      pallets.push({ p: [x, 0.08, z] })
      const layers = 4 + k
      for (let l = 0; l < layers; l++)
        for (let a = 0; a < 2; a++)
          for (let b = 0; b < 2; b++)
            boxes.push({
              p: [x - 0.3 + a * 0.6 + (r() - 0.5) * 0.02, 0.3 + l * 0.2, z - 0.25 + b * 0.5 + (r() - 0.5) * 0.02],
              r: [0, (r() - 0.5) * 0.04, 0],
              c: l % 2 ? '#d8c59c' : '#cdb88b',
            })
    })
    return { boxes, pallets }
  }, [])
  const card = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.85 }), [])
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a98a5e', roughness: 0.9 }), [])
  return (
    <group>
      <Inst geometry={bevelBox(1.25, 0.14, 1.05, 0.01)} material={wood} items={data.pallets} />
      <Inst geometry={bevelBox(0.58, 0.19, 0.48, 0.012)} material={card} items={data.boxes} />
    </group>
  )
}
