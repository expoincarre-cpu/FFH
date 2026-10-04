'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, tmpObject } from '../shared'
import { asphalt, panels, tiled } from '../textures'
import { Trees, Truck, darkSteel, galvanized, row, useCladding, useFacade } from '../props'
import { zoneAwake } from './util'

const LINE = { x: 1.5, from: 10, to: -22 }

/** STAGE 04 — processing plant: slaughter & cutting halls, glazed process gallery, cold store, docks. */
export function Transformation({ color, density }: { color: string; density: number }) {
  const hall = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tiled(panels('#e6ecec'), 3, 1.5), roughness: 0.5, metalness: 0.1 }),
    [],
  )
  const office = useFacade({ wall: '#e6ecec', cols: 12, rows: 2, band: true, seed: 31, glass: '#30474c' })
  const cold = useCladding('#dfe5e4', 14, 9, 2)
  const scan = useRef<THREE.Mesh>(null)
  const yard = useMemo(() => tiled(asphalt(), 6, 6), [])

  useFrame((state) => {
    if (!scan.current || !zoneAwake(3)) return
    scan.current.position.y = 1.2 + (Math.sin(state.clock.elapsedTime * 1.6) * 0.5 + 0.5) * 1.8
  })

  return (
    <group position={[0, 0, ZONES.transformation]}>
      {/* Yard */}
      <mesh rotation-x={-Math.PI / 2} position={[-2, 0.03, -6]}>
        <planeGeometry args={[60, 46]} />
        <meshStandardMaterial map={yard} roughness={0.9} />
      </mesh>

      {/* Processing hall with office front */}
      <mesh position={[14, 4.5, -4]} material={[hall, hall, darkSteel, darkSteel, office, hall]}>
        <boxGeometry args={[18, 9, 26]} />
      </mesh>
      <mesh position={[14, 9.2, -4]} material={darkSteel}>
        <boxGeometry args={[18.4, 0.4, 26.4]} />
      </mesh>
      {[-12, -6, 0, 6].map((z) => (
        <group key={z} position={[16, 10.2, z - 2]}>
          <mesh material={galvanized}>
            <boxGeometry args={[3, 1.6, 2.4]} />
          </mesh>
          <mesh position={[0, 0.82, 0]} rotation-x={-Math.PI / 2} material={darkSteel}>
            <circleGeometry args={[0.8, 20]} />
          </mesh>
        </group>
      ))}

      {/* Glazed process gallery: the line is visible inside */}
      <mesh position={[LINE.x, 2.2, (LINE.from + LINE.to) / 2]}>
        <boxGeometry args={[4, 4.4, LINE.from - LINE.to + 1]} />
        <meshStandardMaterial color="#cfe6ec" transparent opacity={0.16} roughness={0.05} metalness={0.4} depthWrite={false} />
      </mesh>
      <mesh position={[LINE.x, 4.5, (LINE.from + LINE.to) / 2]} material={darkSteel}>
        <boxGeometry args={[4.3, 0.2, LINE.from - LINE.to + 1.3]} />
      </mesh>
      <mesh position={[LINE.x, 1.05, (LINE.from + LINE.to) / 2]} material={darkSteel}>
        <boxGeometry args={[1.8, 0.2, LINE.from - LINE.to]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => LINE.to + 1 + i * 2.7).map((z) => (
        <mesh key={z} position={[LINE.x, 0.5, z]} material={galvanized}>
          <boxGeometry args={[1.6, 1, 0.1]} />
        </mesh>
      ))}
      {/* Quality-control scanner */}
      <group position={[LINE.x, 0, -2]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 1.2, 1.8, 0]} material={galvanized}>
            <boxGeometry args={[0.2, 3.6, 0.6]} />
          </mesh>
        ))}
        <mesh position={[0, 3.6, 0]} material={galvanized}>
          <boxGeometry args={[2.6, 0.3, 0.6]} />
        </mesh>
        <mesh ref={scan} position={[0, 2, 0]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[2.2, 0.5]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Packs density={density} />

      {/* Cold store with refrigerated docks */}
      <mesh position={[-14, 4.5, -14]} material={cold}>
        <boxGeometry args={[14, 9, 12]} />
      </mesh>
      {[-18.5, -14, -9.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.2, -7.95]} material={darkSteel}>
            <boxGeometry args={[3.2, 3.8, 0.12]} />
          </mesh>
          <mesh position={[x, 4.4, -7.7]} material={galvanized}>
            <boxGeometry args={[3.6, 0.4, 0.7]} />
          </mesh>
        </group>
      ))}
      <Truck kind="reefer" position={[-18.5, 0, -2]} rotation-y={Math.PI} />
      <Truck kind="reefer" cab="#cdd6d4" position={[-9.5, 0, -1.4]} rotation-y={Math.PI} />
      <Truck kind="reefer" position={[-27, 0, 6]} rotation-y={Math.PI / 2} />

      <Trees spots={row([-30, 16], [28, 16], density < 0.5 ? 8 : 14, 1.5, 61)} seed={62} size={1} />
      <pointLight position={[0, 8, -2]} color="#e8f4ff" intensity={90} distance={50} decay={1.5} />
    </group>
  )
}

function Packs({ density }: { density: number }) {
  const count = Math.round(26 * Math.max(density, 0.6))
  const ref = useRef<THREE.InstancedMesh>(null)
  const length = LINE.from - LINE.to
  useFrame((state) => {
    const mesh = ref.current
    if (!mesh || !zoneAwake(3)) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const z = LINE.from - ((((t * 1.6 + (i * length) / count) % length) + length) % length)
      const packed = z < -2
      tmpObject.position.set(LINE.x, packed ? 1.42 : 1.34, z)
      tmpObject.rotation.set(0, 0, 0)
      tmpObject.scale.set(packed ? 1 : 0.8, packed ? 1 : 0.55, packed ? 1 : 0.8)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[1, 0.45, 0.75]} />
      <meshStandardMaterial color="#e9c9b3" roughness={0.3} />
    </instancedMesh>
  )
}
