'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { ZONES, rng, threadPoint, tmpColor, tmpObject, zoneStops } from '../shared'
import { applySet, corrugatedSet, fieldSet, gravelSet, litterSet, soilSet } from '../textures'
import { weather } from '../materials'
import { Block, ContactShadows, Fence, Grass, Inst, Lamps, Trees, Truck, beam, bevelBox, mats, row, unitBox, unitCyl, useConcrete, usePanels } from '../props'
import { gableRoof, zoneAwake } from './util'

const BARN = { length: 40, width: 9, eave: 2.7, rise: 1.7, x: -31 }

function paint(g: THREE.BufferGeometry, c: string) {
  const col = new THREE.Color(c)
  const n = g.attributes.position.count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) col.toArray(a, i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return g
}

/** Gentle ridges at the far ends of the farm; the pad itself is level. */
function terrainHeight(x: number, z: number) {
  const out = THREE.MathUtils.smoothstep(Math.abs(x + 2) - 62, 0, 30)
  const edge = 1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(x) - 112, Math.abs(z) - 26), 0, 8)
  return (Math.sin(x * 0.05) * Math.cos(z * 0.07) * 2.4 + Math.sin(x * 0.13 + z * 0.09) * 0.9 + 2.6) * out * edge
}

/**
 * STAGE 03 — broiler and turkey farm: naturally ventilated houses with raised
 * side curtains, profiled roofs, tunnel fans and feed silos; the nearest house
 * shows its flock on the litter between feeder and drinker lines. Around it,
 * cultivated plots, an olive grove and cypress windbreaks.
 */
export function Farming({ density }: { color: string; density: number }) {
  const lite = density < 0.5
  const barns = useMemo(() => (lite ? [-24, -12, 0] : [-26, -14, -2, 10]).map((z, i, a) => ({ z, open: i === a.length - 1 })), [lite])
  const cypress = useMemo(() => [...row([-60, -31], [-42, -31], lite ? 4 : 7, 0.8, 3), ...row([-60, -29], [-60, 24], lite ? 10 : 18, 0.8, 4)], [lite])
  const olives = useMemo(() => {
    const out: [number, number][] = []
    const r = rng(42)
    for (let i = 0; i < (lite ? 4 : 6); i++) for (let j = 0; j < 3; j++) out.push([26 + i * 7 + (r() - 0.5), 20 + j * 6.5 + (r() - 0.5)])
    return out
  }, [lite])
  const wild = useMemo(() => row([62, -22], [96, 26], lite ? 5 : 10, 12, 5), [lite])
  const tufts = useMemo<[number, number, number, number][]>(
    () => [
      [-40, 21, 22, 33],
      [10, -4, 22, 22],
      [22, 16, 62, 33],
    ],
    [],
  )
  return (
    <group position={[0, 0, ZONES.farming]}>
      <Terrain />
      <Barns barns={barns} />
      <Flock density={density} z={barns[barns.length - 1].z} />
      <Trees spots={cypress} species="cypress" seed={41} size={1.1} density={density} />
      <Trees spots={olives} species="olive" seed={43} size={1} density={density} />
      <Trees spots={wild} species="eucalyptus" seed={44} size={1.1} density={density} />
      <Grass areas={tufts} count={Math.round(2400 * density)} seed={47} y={terrainHeight} />
      <Fence
        points={[
          [-56, 20],
          [9, 20],
          [9, -30],
        ]}
        height={1.8}
      />
      <Lamps
        spots={[
          [-6, -14, -Math.PI / 2],
          [-6, 10, -Math.PI / 2],
          [-54, 17, Math.PI / 2],
        ]}
        height={7}
        lights={2}
        power={70}
      />
      <Trucks />
    </group>
  )
}

function Terrain() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(240, 68, 120, 34)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)) + 0.02)
    g.computeVertexNormals()
    return g
  }, [])
  const grass = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 1 })
    applySet(m, soilSet(23), 30, 9)
    m.color.set('#e9e6c8')
    return weather(m, { macro: 0.34, scale: 30 })
  }, [])
  const gravel = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 1 })
    applySet(m, gravelSet('#a59c86'), 9, 9)
    return weather(m, { macro: 0.3, scale: 18 })
  }, [])
  const fields = useMemo(() => {
    const r = rng(9)
    const tones = ['#6f8a45', '#8c9a4e', '#587a3c', '#a39a55']
    return Array.from({ length: 8 }, (_, i) => {
      const m = new THREE.MeshStandardMaterial({ roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })
      applySet(m, fieldSet(tones[Math.floor(r() * 4)], 0.35 + r() * 0.6, 41 + (i % 3)), 1, 1)
      return { x: 24 + (i % 2) * 17.5, z: -26 + Math.floor(i / 2) * 10.6, m: weather(m, { macro: 0.2, scale: 14 }), rot: i % 3 === 0 ? Math.PI / 2 : 0 }
    })
  }, [])
  return (
    <group>
      <mesh geometry={geometry} material={grass} userData={{ castShadow: false }} />
      {fields.map((f, i) => (
        <mesh key={i} position={[f.x, 0.06, f.z]} rotation={[-Math.PI / 2, 0, f.rot]} material={f.m} userData={{ castShadow: false }}>
          <planeGeometry args={f.rot ? [10, 16.5] : [16.5, 10]} />
        </mesh>
      ))}
      {/* Compacted service yard and the track between the houses */}
      <mesh position={[-24, 0.05, 0]} rotation-x={-Math.PI / 2} material={gravel} userData={{ castShadow: false }}>
        <planeGeometry args={[66, 58]} />
      </mesh>
    </group>
  )
}

const fanGeo = (() => {
  const frame = paint(new THREE.BoxGeometry(0.3, 1.5, 1.5), '#c9cdcb')
  const cone = paint(new THREE.CylinderGeometry(0.62, 0.72, 0.28, 20, 1, true).rotateZ(Math.PI / 2).translate(-0.24, 0, 0), '#b5bab8')
  const hub = paint(new THREE.CircleGeometry(0.62, 20).rotateY(-Math.PI / 2).translate(-0.17, 0, 0), '#191c1c')
  const blades = Array.from({ length: 6 }, (_, i) => paint(new THREE.BoxGeometry(0.02, 0.56, 0.16).translate(0, 0.3, 0).rotateX((i / 6) * Math.PI * 2 + 0.3).translate(-0.2, 0, 0), '#8f9694'))
  return mergeGeometries([frame, cone, hub, ...blades])
})()

const feedSiloGeo = mergeGeometries([
  new THREE.CylinderGeometry(1.05, 1.05, 3.4, 20).translate(0, 5.1, 0),
  new THREE.ConeGeometry(1.05, 1.9, 20).rotateX(Math.PI).translate(0, 2.45, 0),
  new THREE.ConeGeometry(1.1, 0.8, 20).translate(0, 7.2, 0),
])

function Barns({ barns }: { barns: { z: number; open: boolean }[] }) {
  const M = mats()
  const { length: L, width: W, eave: E, rise: R, x: X } = BARN
  const roof = useMemo(() => gableRoof(W, L, R, 0.7, 0.1), [])
  const roofMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.6 })
    applySet(m, corrugatedSet('#aeb4b5', { ribs: 24, seed: 61, sheets: 1, wear: 0.8, metal: 0.75 }), 8, 1)
    return weather(m, { macro: 0.2, scale: 11 })
  }, [])
  const gable = usePanels('#eceae0', W, { seed: 62, cols: 6, wear: 0.6 })
  const plinth = useConcrete('#b7b1a2', L, 1, { seed: 63 })
  const curtain = useMemo(() => weather(new THREE.MeshStandardMaterial({ color: '#3f6a55', roughness: 0.75 }), { macro: 0.14, scale: 5 }), [])
  const mesh = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#aab0ad', roughness: 0.6, metalness: 0.6, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    [],
  )
  const litter = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 1 })
    applySet(m, litterSet(), 8, 2)
    return weather(m, { macro: 0.25, scale: 6 })
  }, [])
  const gableShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-W / 2, 0)
    s.lineTo(W / 2, 0)
    s.lineTo(0, R)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [W, R])
  const pan = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9372c', roughness: 0.45 }), [])
  const panGeo = useMemo(() => new THREE.CylinderGeometry(0.2, 0.26, 0.12, 12), [])
  const fanMat = useMemo(() => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.5 }), [])

  const data = useMemo(() => {
    const posts: THREE.Matrix4[] = []
    const fans: { p: [number, number, number] }[] = []
    const silos: { p: [number, number, number] }[] = []
    const legs: THREE.Matrix4[] = []
    const augers: THREE.Matrix4[] = []
    const lines: THREE.Matrix4[] = []
    const pans: { p: [number, number, number] }[] = []
    const shadows: [number, number, number, number][] = []
    barns.forEach((b) => {
      for (let k = 0; k <= 10; k++)
        for (const s of [-1, 1]) {
          const px = X - L / 2 + (k * L) / 10
          posts.push(beam([px, 0.5, b.z + (s * W) / 2], [px, E, b.z + (s * W) / 2], 0.14))
        }
      for (const z of [-3, -1, 1, 3]) fans.push({ p: [X - L / 2 - 0.12, 1.35, b.z + z] })
      const sx = X + L / 2 + 2.2
      for (const s of [-1, 1]) {
        const sz = b.z + s * 1.7
        silos.push({ p: [sx, 0, sz] })
        for (const dx of [-0.75, 0.75]) for (const dz of [-0.75, 0.75]) legs.push(beam([sx + dx, 0, sz + dz], [sx + dx, 3.6, sz + dz], 0.09))
        augers.push(beam([sx, 1.6, sz], [X + L / 2 - 0.3, E - 0.3, b.z + s * 1.5], 0.14))
        shadows.push([sx, sz, 3.2, 3.2])
      }
      shadows.push([X, b.z, L + 2.5, W + 2.5])
      // Feeder and drinker lines hang the full length of every house.
      for (const z of [-2.6, 0, 2.6]) lines.push(beam([X - L / 2 + 0.6, 0.62, b.z + z], [X + L / 2 - 0.6, 0.62, b.z + z], 0.07))
      for (const z of [-1.3, 1.3]) lines.push(beam([X - L / 2 + 0.6, 0.5, b.z + z], [X + L / 2 - 0.6, 0.5, b.z + z], 0.035))
      if (b.open) for (const z of [-2.6, 0, 2.6]) for (let k = 0; k < 44; k++) pans.push({ p: [X - L / 2 + 1.2 + k * 0.87, 0.5, b.z + z] })
    })
    return { posts, fans, silos, legs, augers, lines, pans, shadows }
  }, [barns, L, W, E, X])

  return (
    <group>
      {barns.map((b) => (
        <group key={b.z} position={[X, 0, b.z]}>
          {/* Slab, litter and dwarf walls */}
          <Block size={[L + 0.6, 0.16, W + 0.6]} r={0.03} position={[0, 0.08, 0]} material={plinth} />
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.175, 0]} material={litter} userData={{ castShadow: false }}>
            <planeGeometry args={[L - 0.4, W - 0.4]} />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Block size={[L, 0.5, 0.2]} r={0.03} position={[0, 0.41, (s * W) / 2]} material={plinth} />
              {/* Side curtain: rolled up on the featured house, half lowered elsewhere */}
              <Block size={[L - 0.3, b.open ? 0.34 : 1.15, 0.1]} r={0.04} position={[0, b.open ? E - 0.2 : E - 0.6, (s * W) / 2 + 0.04]} material={curtain} />
              <mesh position={[0, 0.66 + (E - 0.66) / 2, (s * W) / 2]} material={mesh} userData={{ noShadow: true }}>
                <planeGeometry args={[L, E - 0.66]} />
              </mesh>
            </group>
          ))}
          {/* Gable walls */}
          {[-1, 1].map((s) => (
            <group key={s} position={[(s * L) / 2, 0, 0]}>
              <Block size={[0.16, E, W]} r={0.02} position={[0, E / 2, 0]} material={gable} />
              <mesh geometry={gableShape} position={[s * 0.081, E, 0]} rotation-y={(s * Math.PI) / 2} material={gable} />
              <mesh geometry={gableShape} position={[-s * 0.081, E, 0]} rotation-y={(-s * Math.PI) / 2} material={gable} />
              {s === 1 && <Block size={[0.08, 2.1, 1.1]} r={0.02} position={[0.1, 1.05, -2.6]} material={M.galvanized} />}
            </group>
          ))}
          <mesh geometry={roof} position={[0, E, 0]} material={roofMat} />
          {/* Ridge cap */}
          <mesh position={[0, E + R + 0.1, 0]} rotation-z={Math.PI / 2} material={M.galvanized}>
            <cylinderGeometry args={[0.16, 0.16, L + 1.4, 8, 1, false, 0, Math.PI]} />
          </mesh>
        </group>
      ))}
      <Inst geometry={unitBox} material={M.galvanized} matrices={data.posts} />
      <Inst geometry={fanGeo} material={fanMat} items={data.fans} />
      <Inst geometry={feedSiloGeo} material={M.galvanized} items={data.silos} />
      <Inst geometry={unitBox} material={M.galvanized} matrices={data.legs} />
      <Inst geometry={unitCyl} material={M.galvanized} matrices={data.augers} />
      <Inst geometry={unitCyl} material={M.galvanized} matrices={data.lines} userData={{ castShadow: false }} />
      <Inst geometry={panGeo} material={pan} items={data.pans} userData={{ castShadow: false }} />
      <ContactShadows spots={data.shadows} />
      {/* Bulk feed lorry and a small store by the gate */}
      <Block size={[6, 3, 5]} r={0.05} position={[3, 1.5, -18]} material={gable} />
      <Block size={[6.5, 0.14, 5.5]} r={0.03} position={[3, 3.07, -18]} material={M.darkSteel} />
      <Inst geometry={bevelBox(1, 1, 1, 0.03)} material={M.galvanized} items={[{ p: [-1.4, 0.6, -18], s: [1.2, 1.2, 1.2] }]} />
    </group>
  )
}

const birdGeo = mergeGeometries([
  paint(new THREE.SphereGeometry(0.2, 10, 8).scale(0.85, 0.82, 1.3), '#ffffff'),
  paint(new THREE.SphereGeometry(0.11, 8, 6).scale(0.9, 1.5, 0.9).translate(0, 0.18, 0.2), '#ffffff'),
  paint(new THREE.SphereGeometry(0.075, 8, 6).translate(0, 0.33, 0.25), '#ffffff'),
  paint(new THREE.ConeGeometry(0.025, 0.07, 5).rotateX(Math.PI / 2).translate(0, 0.32, 0.34), '#e0a030'),
  paint(new THREE.BoxGeometry(0.02, 0.07, 0.1).translate(0, 0.41, 0.25), '#c2261d'),
  paint(new THREE.SphereGeometry(0.03, 5, 4).scale(0.6, 1.2, 0.8).translate(0, 0.25, 0.31), '#c2261d'),
  paint(new THREE.ConeGeometry(0.11, 0.26, 6).rotateX(-Math.PI / 2.6).translate(0, 0.12, -0.28), '#f4f4f0'),
])

/** The flock inside the featured house, slowly milling and pecking. */
function Flock({ density, z }: { density: number; z: number }) {
  const count = Math.round(900 * Math.max(density, 0.35))
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: count }, () => ({
      x: BARN.x - BARN.length / 2 + 0.8 + r() * (BARN.length - 1.6),
      z: z + (r() - 0.5) * (BARN.width - 1),
      ph: r() * 10,
      s: 0.8 + r() * 0.35,
    }))
  }, [count, z])

  useLayoutEffect(() => {
    const r = rng(18)
    seeds.forEach((_, i) => ref.current?.setColorAt(i, tmpColor.set(r() > 0.85 ? '#e6d9c3' : '#f4f1ea').multiplyScalar(0.88 + r() * 0.14)))
    if (ref.current?.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [seeds])

  const place = (t: number) => {
    const mesh = ref.current
    if (!mesh) return
    seeds.forEach((s, i) => {
      const yaw = s.ph + Math.sin(t * 0.4 + s.ph) * 0.8
      tmpObject.position.set(s.x + Math.sin(t * 0.3 + s.ph) * 0.3, 0.36 * s.s, s.z + Math.cos(t * 0.25 + s.ph) * 0.2)
      tmpObject.rotation.set(Math.max(0, Math.sin(t * 1.3 + s.ph * 3)) * 0.5, yaw, 0, 'YXZ')
      tmpObject.scale.setScalar(s.s)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => place(0))
  useFrame((state) => {
    if (zoneAwake(2)) place(state.clock.elapsedTime)
  })
  return (
    <instancedMesh ref={ref} args={[birdGeo, undefined, count]} frustumCulled={false} userData={{ castShadow: false }}>
      <meshPhysicalMaterial vertexColors roughness={0.95} sheen={0.7} sheenRoughness={0.8} sheenColor="#ffffff" />
    </instancedMesh>
  )
}

/** Live-bird trucks driving the thread from the farms to the processing plant. */
function Trucks() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const a = useMemo(() => new THREE.Vector3(), [])
  const b = useMemo(() => new THREE.Vector3(), [])
  const from = zoneStops[2]
  const to = zoneStops[3]
  useFrame((state) => {
    if (!zoneAwake(2) && !zoneAwake(3)) return
    const t = state.clock.elapsedTime
    refs.current.forEach((g, i) => {
      if (!g) return
      const k = from + ((t * 0.012 + i / 3) % 1) * (to - from)
      threadPoint(k, a)
      threadPoint(k + 0.002, b)
      g.position.set(a.x + 2.6, 0, a.z - ZONES.farming)
      g.lookAt(b.x + 2.6, 0, b.z - ZONES.farming)
    })
  })
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (refs.current[i] = el)}>
          <Truck kind="live" cab={i % 2 ? '#e7e3d8' : '#c9d3cf'} scale={0.9} />
        </group>
      ))}
    </group>
  )
}
