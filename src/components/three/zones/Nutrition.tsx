'use client'

import * as THREE from 'three'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ZONES, materials, rng, tmpObject } from '../shared'
import { zoneAwake } from './util'

/** STAGE 01 — grain intake, silos, feed mill, pellets, bulk logistics. */
export function Nutrition({ color, density }: { color: string; density: number }) {
  const silos = useMemo(
    () => [
      [-16, -6], [-10.5, -6], [-5, -6],
      [-16, 0], [-10.5, 0], [-5, 0],
      [-16, 6], [-10.5, 6],
    ] as [number, number][],
    [],
  )

  return (
    <group position={[0, 0, ZONES.nutrition]}>
      {/* Silo battery */}
      {silos.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 8, 0]} material={materials.clay}>
            <cylinderGeometry args={[2.3, 2.3, 16, 40]} />
          </mesh>
          <mesh position={[0, 17.2, 0]} material={materials.clay}>
            <coneGeometry args={[2.3, 2.4, 40]} />
          </mesh>
          {[3, 7, 11, 15].map((y) => (
            <mesh key={y} position={[0, y, 0]} material={materials.graphite}>
              <cylinderGeometry args={[2.34, 2.34, 0.12, 40]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Gantry conveyor over the silos to the mill */}
      <mesh position={[-4, 19.4, 0]} material={materials.graphite}>
        <boxGeometry args={[26, 0.9, 1.1]} />
      </mesh>
      {[-16, -10.5, -5].map((x) => (
        <mesh key={x} position={[x, 18.6, 0]} material={materials.steel}>
          <cylinderGeometry args={[0.18, 0.18, 1.6, 8]} />
        </mesh>
      ))}

      {/* Mill tower + production hall */}
      <mesh position={[6, 12, -1]} material={materials.clayWarm}>
        <boxGeometry args={[7, 24, 7]} />
      </mesh>
      <mesh position={[6, 24.6, -1]} material={materials.graphite}>
        <boxGeometry args={[7.4, 1.2, 7.4]} />
      </mesh>
      <mesh position={[13.5, 5, 3]} material={materials.clay}>
        <boxGeometry args={[12, 10, 14]} />
      </mesh>
      {/* Glazing band, lit from inside */}
      <mesh position={[6, 16, 2.55]}>
        <boxGeometry args={[5.6, 0.6, 0.1]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[13.5, 7.6, 10.05]}>
        <boxGeometry args={[10, 0.4, 0.1]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Intake hopper */}
      <mesh position={[0.5, 2.2, 10]} rotation-x={Math.PI} material={materials.steel}>
        <coneGeometry args={[2.4, 3.2, 4, 1, true]} />
      </mesh>

      <GrainStream color={color} density={density} />
      <PelletHeap density={density} />
      <BulkTrucks />
      <pointLight position={[2, 8, 8]} color={color} intensity={120} distance={45} decay={1.6} />
    </group>
  )
}

/** Grain pouring from the gantry into the mill — GPU-animated points. */
function GrainStream({ color, density }: { color: string; density: number }) {
  const count = Math.round(1400 * Math.max(density, 0.3))
  const geometry = useMemo(() => {
    const r = rng(11)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const rad = Math.sqrt(r()) * 0.7
      pos[i * 3] = 0.5 + Math.cos(a) * rad
      pos[i * 3 + 1] = 0
      pos[i * 3 + 2] = 10 + Math.sin(a) * rad
      seed[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color).multiplyScalar(1.3) } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          attribute float aSeed;
          varying float vA;
          void main() {
            vec3 p = position;
            float h = mod(aSeed * 18.0 + uTime * (5.0 + aSeed * 2.0), 18.0);
            p.y = 21.0 - h;
            p.xz += (p.xz - vec2(0.5, 10.0)) * h * 0.05;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (2.0 + aSeed * 2.0) * (30.0 / -mv.z);
            vA = smoothstep(0.0, 2.0, h) * smoothstep(18.0, 14.0, h);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vA;
          void main() {
            if (length(gl_PointCoord - 0.5) > 0.5) discard;
            gl_FragColor = vec4(uColor, vA);
          }
        `,
      }),
    [color],
  )
  useFrame((state) => {
    if (zoneAwake(0)) material.uniforms.uTime.value = state.clock.elapsedTime
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/** Heap of feed pellets. */
function PelletHeap({ density }: { density: number }) {
  const count = Math.round(1100 * Math.max(density, 0.3))
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const r = rng(5)
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const d = Math.sqrt(r()) * 4.5
      const h = Math.max(0, 2.6 * (1 - d / 4.5)) * r()
      tmpObject.position.set(-3 + Math.cos(a) * d, 0.12 + h, 15 + Math.sin(a) * d)
      tmpObject.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI)
      tmpObject.scale.setScalar(0.8 + r() * 0.4)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [count])
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.13, 0.13, 0.34, 6]} />
      <meshStandardMaterial color="#a88653" roughness={0.95} />
    </instancedMesh>
  )
}

function BulkTrucks() {
  return (
    <group>
      {[
        [16, 15, 0.3],
        [22, 12, -0.4],
      ].map(([x, z, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation-y={ry}>
          <mesh position={[0, 1.6, 0]} material={materials.clay}>
            <boxGeometry args={[2.4, 2.4, 2]} />
          </mesh>
          <mesh position={[0, 2.1, -4.6]} rotation-x={Math.PI / 2} material={materials.steel}>
            <cylinderGeometry args={[1.3, 1.3, 7, 20]} />
          </mesh>
          <mesh position={[0, 0.5, -2.5]} material={materials.graphite}>
            <boxGeometry args={[2.2, 0.5, 9.5]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
