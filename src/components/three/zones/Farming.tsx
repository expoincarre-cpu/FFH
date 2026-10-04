'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, rng, threadPoint, tmpColor, tmpObject, zoneStops } from '../shared'
import { fieldRows, grass, tiled } from '../textures'
import { Trees, Truck, darkSteel, galvanized, row, useCladding } from '../props'
import { roofGeometry, zoneAwake } from './util'

const BARN = { length: 30, width: 6, height: 2.8, rise: 1.5 }

/**
 * STAGE 03 — broiler and turkey farm: tunnel-ventilated houses with feed silos,
 * cultivated land and windbreaks. One house is shown as a cutaway with its flock.
 */
export function Farming({ color, density }: { color: string; density: number }) {
  const barns = useMemo(() => {
    const rows = density < 0.5 ? 4 : 6
    return Array.from({ length: rows }, (_, i) => ({ x: -36, z: -18 + i * 8, open: i === 2 }))
  }, [density])
  const roof = useMemo(() => roofGeometry(BARN.width + 0.8, BARN.length + 0.6, BARN.rise), [])
  const roofMat = useCladding('#8d9496', BARN.length, BARN.width, 3)
  roofMat.metalness = 0.55
  roofMat.roughness = 0.45
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: '#efece2', roughness: 0.8 }), [])
  const curtain = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3c5a52', roughness: 0.7 }), [])
  const fan = useMemo(() => new THREE.MeshStandardMaterial({ color: '#232827', roughness: 0.5, metalness: 0.5 }), [])

  return (
    <group position={[0, 0, ZONES.farming]}>
      <Terrain color={color} />

      {barns.map((b, i) => (
        <group key={i} position={[b.x + BARN.length / 2, 0, b.z]}>
          {/* Concrete plinth + walls */}
          <mesh position={[0, 0.15, 0]} material={darkSteel}>
            <boxGeometry args={[BARN.length + 0.3, 0.3, BARN.width + 0.3]} />
          </mesh>
          {b.open ? (
            <>
              <mesh position={[0, 0.7, BARN.width / 2]} material={wall}>
                <boxGeometry args={[BARN.length, 1.1, 0.15]} />
              </mesh>
              <mesh position={[0, BARN.height / 2, -BARN.width / 2]} material={wall}>
                <boxGeometry args={[BARN.length, BARN.height, 0.15]} />
              </mesh>
              {/* Exposed roof trusses */}
              {Array.from({ length: 10 }, (_, k) => -BARN.length / 2 + 1.5 + k * 3).map((x) => (
                <mesh key={x} position={[x, BARN.height + 0.5, 0]} material={galvanized}>
                  <boxGeometry args={[0.12, 0.12, BARN.width]} />
                </mesh>
              ))}
              {/* Feeder and drinker lines */}
              {[-1.4, 0, 1.4].map((z) => (
                <mesh key={z} position={[0, 0.55, z]} material={galvanized}>
                  <boxGeometry args={[BARN.length - 1, 0.06, 0.06]} />
                </mesh>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, BARN.height / 2 + 0.3, 0]} material={wall}>
                <boxGeometry args={[BARN.length, BARN.height, BARN.width]} />
              </mesh>
              {/* Side curtains */}
              {[-1, 1].map((s) => (
                <mesh key={s} position={[0, 1.8, (s * BARN.width) / 2 + s * 0.01]} material={curtain}>
                  <boxGeometry args={[BARN.length - 3, 0.9, 0.02]} />
                </mesh>
              ))}
              <mesh geometry={roof} position={[0, BARN.height + 0.3, 0]} material={roofMat} />
              {/* Tunnel fans on the gable */}
              {[-1.6, 0, 1.6].map((z) =>
                [0.95, 2.15].map((y) => (
                  <mesh key={`${z}${y}`} position={[-BARN.length / 2 - 0.02, y, z]} rotation-y={-Math.PI / 2} material={fan}>
                    <circleGeometry args={[0.5, 20]} />
                  </mesh>
                )),
              )}
            </>
          )}
          {/* Feed silos at the service end */}
          {[-1, 1].map((s) => (
            <group key={s} position={[BARN.length / 2 + 1.6, 0, s * 1.4]}>
              {[-0.45, 0.45].map((dx) => (
                <mesh key={dx} position={[dx, 1, 0]} material={darkSteel}>
                  <boxGeometry args={[0.08, 2, 0.08]} />
                </mesh>
              ))}
              <mesh position={[0, 2.8, 0]} rotation-x={Math.PI} material={galvanized}>
                <coneGeometry args={[0.6, 1, 20]} />
              </mesh>
              <mesh position={[0, 4.6, 0]} material={galvanized}>
                <cylinderGeometry args={[0.6, 0.6, 2.6, 20]} />
              </mesh>
              <mesh position={[0, 6.2, 0]} material={galvanized}>
                <coneGeometry args={[0.6, 0.6, 20]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      <Flock density={density} barn={barns.find((b) => b.open)!} />
      <Trees spots={[...row([-46, -26], [6, -26], 22, 1.4, 3), ...row([-48, -24], [-48, 30], 20, 1.4, 4)]} seed={41} size={1.2} />
      <Trees spots={row([22, -18], [60, 20], density < 0.5 ? 8 : 16, 10, 5)} seed={42} size={1.4} />
      <Trucks />
      <pointLight position={[-20, 10, 0]} color="#ffe6c0" intensity={60} distance={60} decay={1.4} />
    </group>
  )
}

function Terrain({ color }: { color: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 64, 110, 32)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const flat = THREE.MathUtils.smoothstep(Math.max(Math.abs(x + 14) - 26, Math.abs(z) - 18), 0, 10)
      const edge = 1 - THREE.MathUtils.smoothstep(Math.max(Math.abs(x) - 90, Math.abs(z) - 24), 0, 8)
      const h = (Math.sin(x * 0.06) * Math.cos(z * 0.08) * 3 + Math.sin(x * 0.17 + z * 0.11) * 1.2 + 2.2) * flat * edge
      pos.setY(i, h - 0.02)
    }
    g.computeVertexNormals()
    return g
  }, [])
  const grassMap = useMemo(() => tiled(grass(), 30, 9), [])
  const fields = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: 10 }, (_, i) => ({
      x: 24 + (i % 2) * 16,
      z: -36 + Math.floor(i / 2) * 13,
      tone: ['#8a7a52', '#7d8a4a', '#a08d5c', '#6f7f45'][Math.floor(r() * 4)],
      rot: (r() - 0.5) * 0.1,
    }))
  }, [])
  return (
    <group>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial map={grassMap} roughness={1} />
      </mesh>
      {fields.map((f, i) => (
        <mesh key={i} position={[f.x, 0.06, f.z]} rotation={[-Math.PI / 2, 0, f.rot]}>
          <planeGeometry args={[14.5, 11.5]} />
          <meshStandardMaterial map={tiled(fieldRows(f.tone), 2, 2)} roughness={1} />
        </mesh>
      ))}
      {/* Gravel service yard */}
      <mesh position={[-21, 0.04, 2]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 52]} />
        <meshStandardMaterial color={new THREE.Color('#a59c86').lerp(new THREE.Color(color), 0.08)} roughness={1} />
      </mesh>
    </group>
  )
}

/** Birds inside the cutaway house, slowly milling. */
function Flock({ density, barn }: { density: number; barn: { x: number; z: number } }) {
  const count = Math.round(520 * Math.max(density, 0.35))
  const body = useRef<THREE.InstancedMesh>(null)
  const head = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: count }, () => ({
      x: barn.x + 0.8 + r() * (BARN.length - 1.6),
      z: barn.z + (r() - 0.5) * (BARN.width - 1),
      ph: r() * 10,
      s: 0.85 + r() * 0.3,
    }))
  }, [count, barn])

  useLayoutEffect(() => {
    const r = rng(18)
    seeds.forEach((_, i) => {
      const c = tmpColor.set(r() > 0.85 ? '#e9dcc6' : '#f6f3ec')
      body.current?.setColorAt(i, c)
      head.current?.setColorAt(i, c)
    })
    if (body.current?.instanceColor) body.current.instanceColor.needsUpdate = true
    if (head.current?.instanceColor) head.current.instanceColor.needsUpdate = true
  }, [seeds])

  const place = (t: number) => {
    seeds.forEach((s, i) => {
      const x = s.x + Math.sin(t * 0.3 + s.ph) * 0.3
      const z = s.z + Math.cos(t * 0.25 + s.ph) * 0.2
      const yaw = s.ph + Math.sin(t * 0.4 + s.ph) * 0.8
      tmpObject.position.set(x, 0.52, z)
      tmpObject.rotation.set(0, yaw, 0)
      tmpObject.scale.set(s.s, s.s * 0.85, s.s * 1.35)
      tmpObject.updateMatrix()
      body.current!.setMatrixAt(i, tmpObject.matrix)
      tmpObject.position.set(x + Math.sin(yaw) * 0.26 * s.s, 0.72, z + Math.cos(yaw) * 0.26 * s.s)
      tmpObject.scale.setScalar(s.s)
      tmpObject.updateMatrix()
      head.current!.setMatrixAt(i, tmpObject.matrix)
    })
    body.current!.instanceMatrix.needsUpdate = true
    head.current!.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => place(0))
  useFrame((state) => {
    if (body.current && head.current && zoneAwake(2)) place(state.clock.elapsedTime)
  })

  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.2, 10, 8]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.09, 8, 6]} />
        <meshStandardMaterial roughness={0.95} />
      </instancedMesh>
    </group>
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
      g.position.set(a.x + 2.4, 0, a.z - ZONES.farming)
      g.lookAt(b.x + 2.4, 0, b.z - ZONES.farming)
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
