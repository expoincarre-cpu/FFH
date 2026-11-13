'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, tmpObject } from '../shared'
import { Block, ContactShadows, Fence, Inst, Lamps, Trees, Truck, beam, bevelBox, mats, row, unitBox, unitCyl, useAsphalt, useCladding, useConcrete, useFacade, usePanels } from '../props'
import { zoneAwake } from './util'

const LINE = { x: 1.5, from: 10, to: -22 }

/**
 * STAGE 04 — processing plant: panel-clad slaughter and cutting hall with its
 * office front and rooftop refrigeration, a glazed process gallery where the
 * packing line and its quality-control scanner are visible, and the cold store
 * with dock shelters and reefer trucks on an asphalt yard.
 */
export function Transformation({ color, density }: { color: string; density: number }) {
  const M = mats()
  const hall = usePanels('#e4e9e8', 26, { seed: 31, cols: 8, rows: 3, wear: 0.5 })
  const hallEnd = usePanels('#e4e9e8', 18, { seed: 32, cols: 8, rows: 3, wear: 0.5 })
  const office = useFacade({ wall: '#e4e9e8', cols: 12, rows: 2, band: true, seed: 31, glass: '#30474c' })
  const cold = useCladding('#dfe5e4', 14, 9, { seed: 33, sheets: 2, box: true, wear: 0.5 })
  const coldEnd = useCladding('#dfe5e4', 12, 9, { seed: 34, sheets: 2, box: true, wear: 0.5 })
  const roof = useConcrete('#8f918c', 18, 26, { seed: 35, grime: 0 })
  const yard = useAsphalt(64, 50)
  const dock = useConcrete('#b9b4a8', 14, 1.2, { seed: 36 })
  const paint = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e3ddc8', roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -3 }), [])
  const yellow = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9ae2c', roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -3 }), [])
  const scanMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(5), transparent: true, opacity: 0.75, side: THREE.DoubleSide }), [color])
  const scan = useRef<THREE.Mesh>(null)
  const lite = density < 0.5

  useFrame((state) => {
    if (!scan.current || !zoneAwake(3)) return
    scan.current.position.y = 1.5 + (Math.sin(state.clock.elapsedTime * 1.6) * 0.5 + 0.5) * 1.6
  })

  const len = LINE.from - LINE.to
  const mid = (LINE.from + LINE.to) / 2
  const frame = useMemo(() => {
    const out: THREE.Matrix4[] = []
    for (let i = 0; i <= 8; i++) {
      const z = LINE.to - 0.5 + (i * (len + 1)) / 8
      for (const s of [-2, 2]) out.push(beam([LINE.x + s, 0, z], [LINE.x + s, 4.4, z], 0.1))
      out.push(beam([LINE.x - 2, 4.4, z], [LINE.x + 2, 4.4, z], 0.1))
    }
    for (const s of [-2, 2])
      for (const y of [1.0, 4.4]) out.push(beam([LINE.x + s, y, LINE.to - 0.5], [LINE.x + s, y, LINE.from + 0.5], 0.08))
    return out
  }, [len])
  const rollers = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ p: [LINE.x, 1.22, LINE.to + 0.4 + (i * (len - 0.8)) / 59] as [number, number, number], r: [0, 0, Math.PI / 2] as [number, number, number], s: [0.1, 1.5, 0.1] as [number, number, number] })),
    [len],
  )
  const stands = useMemo(() => Array.from({ length: 12 }, (_, i) => LINE.to + 1 + i * 2.7).flatMap((z) => [-0.75, 0.75].map((s) => beam([LINE.x + s, 0, z], [LINE.x + s, 1.15, z], 0.07))), [])
  const condensers = useMemo(() => [-12, -6, 0, 6].map((z) => ({ p: [16, 10.35, z - 2] as [number, number, number] })), [])
  const fans = useMemo(() => condensers.flatMap((c) => [-0.75, 0.75].map((dx) => ({ p: [c.p[0] + dx, 11.22, c.p[2]] as [number, number, number] }))), [condensers])
  const docks = [-18.5, -14, -9.5]
  const bays = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ p: [-25 + i * 4.5, 0.06, 2] as [number, number, number], s: [0.12, 0.01, 14] as [number, number, number] })), [])
  const pipes = useMemo(
    () => [
      beam([-7, 8.2, -12], [5, 8.2, -12], 0.22),
      beam([-7, 7.8, -12.5], [5, 7.8, -12.5], 0.16),
      beam([-7, 8.2, -12], [-7, 9.3, -12], 0.22),
      ...[-4, 0, 4].flatMap((x) => [beam([x, 0, -12.2], [x, 8.0, -12.2], 0.14)]),
    ],
    [],
  )
  const trees = useMemo(() => row([-34, -29], [-34, 16], lite ? 5 : 9, 1.5, 61), [lite])

  return (
    <group position={[0, 0, ZONES.transformation]}>
      {/* Yard */}
      <mesh rotation-x={-Math.PI / 2} position={[-2, 0.04, -6]} material={yard} userData={{ castShadow: false }}>
        <planeGeometry args={[64, 50]} />
      </mesh>
      <Inst geometry={unitBox} material={paint} items={bays} userData={{ noShadow: true }} />
      <Block size={[16, 0.012, 0.18]} position={[-14, 0.062, -4.6]} material={yellow} userData={{ noShadow: true }} />

      {/* Processing hall with office front */}
      <Block size={[18, 9, 26]} r={0.05} position={[14, 4.5, -4]} material={[hall, hall, roof, roof, office, hallEnd]} />
      <Block size={[18.3, 0.5, 26.3]} r={0.05} position={[14, 9.15, -4]} material={M.darkSteel} />
      <Block size={[5, 0.16, 1.8]} r={0.03} position={[14, 3, 9.9]} material={M.darkSteel} />
      <Block size={[2.2, 2.5, 0.1]} r={0.02} position={[14, 1.25, 9.04]} material={M.glass} />
      <Inst geometry={bevelBox(3.2, 1.7, 2.4, 0.08)} material={M.galvanized} items={condensers} />
      <Inst geometry={new THREE.CylinderGeometry(0.62, 0.62, 0.08, 18)} material={M.darkSteel} items={fans} />
      <Inst geometry={unitCyl} material={M.galvanized} matrices={pipes} />
      {/* Ammonia receiver beside the plant room */}
      <mesh position={[3.4, 1.6, -19]} rotation-z={Math.PI / 2} material={M.white}>
        <capsuleGeometry args={[1.1, 4.6, 6, 18]} />
      </mesh>
      {[1.6, 5.2].map((x) => (
        <Block key={x} size={[0.3, 1, 1.8]} r={0.04} position={[x, 0.5, -19]} material={dock} />
      ))}

      {/* Glazed process gallery: the line is visible inside */}
      <Block size={[4, 4.3, len + 1]} r={0.01} position={[LINE.x, 2.2, mid]} material={M.clearGlass} userData={{ noShadow: true }} />
      <Inst geometry={unitBox} material={M.darkSteel} matrices={frame} />
      <Block size={[4.5, 0.18, len + 1.6]} r={0.03} position={[LINE.x, 4.55, mid]} material={M.galvanized} />
      <Block size={[4.2, 0.1, len + 1.2]} r={0.02} position={[LINE.x, 0.05, mid]} material={dock} />
      {/* Roller conveyor */}
      {[-0.78, 0.78].map((s) => (
        <Block key={s} size={[0.08, 0.2, len]} r={0.02} position={[LINE.x + s, 1.2, mid]} material={M.stainless} />
      ))}
      <Inst geometry={unitCyl} material={M.stainless} items={rollers} />
      <Inst geometry={unitBox} material={M.stainless} matrices={stands} />
      {/* LED line above the conveyor */}
      <mesh position={[LINE.x, 4.3, mid]}>
        <boxGeometry args={[0.12, 0.05, len - 1]} />
        <meshBasicMaterial color={new THREE.Color('#eaf4ff').multiplyScalar(4)} />
      </mesh>
      {/* Quality-control scanner */}
      <group position={[LINE.x, 0, -2]}>
        {[-1, 1].map((s) => (
          <Block key={s} size={[0.3, 3.6, 0.9]} r={0.05} position={[s * 1.15, 1.8, 0]} material={M.white} />
        ))}
        <Block size={[2.6, 0.45, 0.9]} r={0.05} position={[0, 3.6, 0]} material={M.white} />
        <mesh ref={scan} position={[0, 2, 0]} rotation-x={-Math.PI / 2} material={scanMat} userData={{ noShadow: true }}>
          <planeGeometry args={[2.0, 0.5]} />
        </mesh>
        <pointLight position={[0, 2.4, 0]} color={color} intensity={6} distance={7} decay={1.8} userData={{ night: 14, day: 6 }} />
      </group>
      <Packs density={density} />

      {/* Cold store with refrigerated docks */}
      <Block size={[14, 9, 12]} r={0.05} position={[-14, 4.5, -14]} material={[coldEnd, coldEnd, roof, roof, cold, cold]} />
      <Block size={[14.3, 0.4, 12.3]} r={0.05} position={[-14, 9.1, -14]} material={M.darkSteel} />
      <Block size={[14, 1.2, 1.4]} r={0.04} position={[-14, 0.6, -7.3]} material={dock} />
      <Block size={[15, 0.18, 3.2]} r={0.03} position={[-14, 5.6, -6.6]} material={M.galvanized} />
      {docks.map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Block size={[3.0, 3.2, 0.1]} r={0.02} position={[0, 2.8, -7.96]} material={M.white} />
          {/* Dock shelter: rubber curtains around the opening */}
          {[-1.7, 1.7].map((s) => (
            <Block key={s} size={[0.5, 3.6, 0.7]} r={0.05} position={[s, 3.0, -7.6]} material={M.rubber} />
          ))}
          <Block size={[3.9, 0.6, 0.7]} r={0.05} position={[0, 4.75, -7.6]} material={M.rubber} />
          {[-1.2, 1.2].map((s) => (
            <Block key={s} size={[0.3, 0.5, 0.2]} r={0.04} position={[s, 0.95, -6.5]} material={M.rubber} />
          ))}
        </group>
      ))}
      <Truck kind="reefer" position={[-18.5, 0, 0.2]} rotation-y={Math.PI} />
      <Truck kind="reefer" cab="#cdd6d4" position={[-9.5, 0, 0.4]} rotation-y={Math.PI} />
      <Truck kind="reefer" position={[-24, 0, 12]} rotation-y={Math.PI / 2} />

      <Trees spots={trees} species="broad" seed={62} size={1} density={density} />
      <Fence
        points={[
          [-34, 19],
          [-34, -31],
          [30, -31],
        ]}
      />
      <Lamps
        spots={[
          [-4, 6, -Math.PI / 2],
          [-30, -4, Math.PI / 2],
          [-4, -8, -Math.PI / 2],
          [26, 14, Math.PI],
        ]}
        height={9}
        lights={3}
        color="#e6f0ff"
        power={80}
      />
      <ContactShadows
        spots={[
          [14, -4, 20.5, 28.5],
          [-14, -14, 16.5, 14.5],
          [LINE.x, mid, 5.5, len + 2.5],
        ]}
      />
    </group>
  )
}

function Packs({ density }: { density: number }) {
  const count = Math.round(26 * Math.max(density, 0.6))
  const ref = useRef<THREE.InstancedMesh>(null)
  const length = LINE.from - LINE.to
  const geo = useMemo(() => bevelBox(1, 0.42, 0.72, 0.05), [])
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#e8cdb9', roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.15 }), [])
  const place = (t: number) => {
    const mesh = ref.current
    if (!mesh) return
    for (let i = 0; i < count; i++) {
      const z = LINE.from - ((((t * 1.6 + (i * length) / count) % length) + length) % length)
      const packed = z < -2
      tmpObject.position.set(LINE.x, packed ? 1.49 : 1.42, z)
      tmpObject.rotation.set(0, 0, 0)
      tmpObject.scale.set(packed ? 1 : 0.8, packed ? 1 : 0.55, packed ? 1 : 0.8)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }
  useFrame((state) => {
    if (zoneAwake(3)) place(state.clock.elapsedTime)
  })
  return <instancedMesh ref={ref} args={[geo, mat, count]} frustumCulled={false} />
}
