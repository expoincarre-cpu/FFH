'use client'

import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { curveParam, journey } from './state'
import {
  LANDSCAPE,
  PORTRAIT,
  STATIONS,
  STATIONS_PORTRAIT,
  ZONE_LIST,
  portraitBlend,
  rng,
  threadCurve,
  threadPoint,
  tmpColor,
  tmpObject,
  zoneStops,
} from './shared'
import { Nutrition } from './zones/Nutrition'
import { Hatchery } from './zones/Hatchery'
import { Farming } from './zones/Farming'
import { Transformation } from './zones/Transformation'
import { Food } from './zones/Food'
import { Atmosphere } from './Atmosphere'
import { applySet, soilSet } from './textures'
import { weather, windTime } from './materials'
import { Inst, unitBox } from './props'

export type WorldProps = {
  /** Stage accent colours, from the CMS (nutrition → food). */
  colors: string[]
  /** Geometry density multiplier for the device tier (0–1). */
  density: number
  /** Ambient particle count. */
  particles: number
  /** Shadow map resolution (0 disables shadows). */
  shadowSize: number
  /** Environment map resolution. */
  envSize: number
}

const curve = (pts: [number, number, number][]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.5)
const paths = {
  land: { pos: curve(STATIONS.map((s) => s.pos)), tgt: curve(STATIONS.map((s) => s.target)) },
  port: { pos: curve(STATIONS_PORTRAIT.map((s) => s.pos)), tgt: curve(STATIONS_PORTRAIT.map((s) => s.target)) },
}

/* ----------------------------------------------------------------- CAMERA */

/**
 * Scroll-driven camera. Landscape and portrait viewports each have their own
 * path; in portrait the lens is also shifted upwards (like a shift lens, so
 * verticals stay vertical) to lift the subject above the text card.
 */
function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const p = useMemo(() => new THREE.Vector3(), [])
  const t = useMemo(() => new THREE.Vector3(), [])
  const p2 = useMemo(() => new THREE.Vector3(), [])
  const t2 = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(...STATIONS[0].target), [])
  const pointer = useMemo(() => new THREE.Vector2(), [])
  useFrame((state, dt) => {
    const delta = Math.min(dt, 0.1)
    journey.smooth = journey.snap ? journey.progress : THREE.MathUtils.damp(journey.smooth, journey.progress, 2.6, delta)
    const u = curveParam(journey.smooth)
    const { width, height } = state.size
    const blend = portraitBlend(width / height)
    paths.land.pos.getPoint(u, p)
    paths.land.tgt.getPoint(u, t)
    if (blend > 0) {
      paths.port.pos.getPoint(u, p2)
      paths.port.tgt.getPoint(u, t2)
      p.lerp(p2, blend)
      t.lerp(t2, blend)
    }

    const time = state.clock.elapsedTime
    windTime.value = time
    pointer.lerp(journey.pointer as unknown as THREE.Vector2, 1 - Math.exp(-3 * delta))
    p.x += Math.sin(time * 0.13) * 0.8 + pointer.x * 1.6
    p.y += Math.cos(time * 0.11) * 0.4 + pointer.y * 0.8
    camera.position.copy(p)
    if (journey.snap) look.copy(t)
    else look.lerp(t, 1 - Math.exp(-6 * delta))
    camera.lookAt(look)
    journey.focus = camera.position.distanceTo(look)

    const fov = THREE.MathUtils.lerp(LANDSCAPE.fov, PORTRAIT.fov, blend)
    const shift = THREE.MathUtils.lerp(LANDSCAPE.shift, PORTRAIT.shift, blend) * height
    const view = camera.view
    if (Math.abs(camera.fov - fov) > 0.01 || (shift > 0.5 ? !view || !view.enabled || view.offsetY !== shift || view.fullWidth !== width || view.fullHeight !== height : view?.enabled)) {
      camera.fov = fov
      if (shift > 0.5) camera.setViewOffset(width, height, 0, shift, width, height)
      else if (view?.enabled) camera.clearViewOffset()
      else camera.updateProjectionMatrix()
    }
  })
  return null
}

/* ----------------------------------------------------------------- GROUND */

function Ground() {
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ roughness: 1 })
    applySet(m, soilSet(), 420, 420)
    return weather(m, { macro: 0.34, scale: 70 })
  }, [])
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0, -120]} receiveShadow userData={{ castShadow: false }} material={material}>
      <planeGeometry args={[3600, 3600]} />
    </mesh>
  )
}

/**
 * Distant scenery: scattered farm buildings, tree lines and low hills that sit
 * in the haze. They give the horizon scale and depth instead of an empty plane.
 */
function Horizon({ density }: { density: number }) {
  const { buildings, trees, hills } = useMemo(() => {
    const r = rng(404)
    const buildings: THREE.Matrix4[] = []
    const colors: THREE.Color[] = []
    const trees: THREE.Matrix4[] = []
    const hills: THREE.Matrix4[] = []
    const q = new THREE.Quaternion()
    const up = new THREE.Vector3(0, 1, 0)
    const nB = Math.round(150 * density)
    for (let i = 0; i < nB; i++) {
      const a = r() * Math.PI * 2
      const d = 190 + r() * r() * 900
      const x = Math.cos(a) * d
      const z = -120 + Math.sin(a) * d
      const w = 8 + r() * 22
      const h = 3 + r() * r() * 9
      q.setFromAxisAngle(up, r() * Math.PI)
      buildings.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), q.clone(), new THREE.Vector3(w, h, 6 + r() * 14)))
      colors.push(new THREE.Color(['#e6dfcd', '#d9cfb8', '#cfc6b3', '#e9e4d8', '#c9a98a'][Math.floor(r() * 5)]))
    }
    const nT = Math.round(900 * density)
    for (let i = 0; i < nT; i++) {
      const a = r() * Math.PI * 2
      const d = 150 + Math.pow(r(), 0.7) * 1100
      // Trees gather in lines (field boundaries).
      const line = Math.round((Math.cos(a) * d) / 60) * 60 + (r() - 0.5) * 6
      const x = r() > 0.4 ? line : Math.cos(a) * d
      const z = -120 + Math.sin(a) * d
      const s = 3 + r() * 4
      trees.push(new THREE.Matrix4().compose(new THREE.Vector3(x, s * 0.9, z), q.identity().clone(), new THREE.Vector3(s, s * (0.9 + r() * 0.8), s)))
    }
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2
      const d = 1500 + r() * 500
      const w = 500 + r() * 700
      hills.push(new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * d, -20, -120 + Math.sin(a) * d), q.identity().clone(), new THREE.Vector3(w, 60 + r() * 150, w * (0.5 + r() * 0.5))))
    }
    return { buildings, colors, trees, hills }
  }, [density])
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9 }), [])
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3f5433', roughness: 1 }), [])
  const hill = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8f8566', roughness: 1 }), [])
  const blob = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const mound = useMemo(() => new THREE.SphereGeometry(1, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), [])
  return (
    <group userData={{ far: true }}>
      <Inst geometry={unitBox} material={wall} matrices={buildings} userData={{ castShadow: false }} />
      <Inst geometry={blob} material={leaf} matrices={trees} userData={{ castShadow: false }} />
      <Inst geometry={mound} material={hill} matrices={hills} userData={{ noShadow: true }} frustumCulled={false} />
    </group>
  )
}

/* -------------------------------------------------------- VALUE-CHAIN THREAD */

const threadVertex = /* glsl */ `
  varying vec2 vUv;
  #include <fog_pars_vertex>
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`

const threadFragment = /* glsl */ `
  uniform vec3 uColors[5];
  uniform float uStops[5];
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;
  #include <fog_pars_fragment>
  void main() {
    float x = vUv.x;
    vec3 col = uColors[0];
    for (int i = 1; i < 5; i++) {
      float mid = (uStops[i - 1] + uStops[i]) * 0.5;
      col = mix(col, uColors[i], smoothstep(mid - 0.03, mid + 0.03, x));
    }
    float lit = 1.0 - smoothstep(uProgress - 0.004, uProgress + 0.03, x);
    float pulse = 0.5 + 0.5 * sin((x * 160.0) - uTime * 3.0);
    float head = exp(-abs(x - uProgress) * 140.0);
    vec3 dim = col * 0.3;
    // Lit sections are HDR so they bloom; the unlit remainder stays a quiet line.
    vec3 c = mix(dim, col * (2.6 + pulse * 0.9), lit) + head * 5.0;
    gl_FragColor = vec4(c, 1.0);
    #include <fog_fragment>
  }
`

function Thread({ colors }: { colors: string[] }) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: threadVertex,
        fragmentShader: threadFragment,
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uColors: { value: colors.map((c) => new THREE.Color(c)) },
            uStops: { value: zoneStops },
            uProgress: { value: 0 },
            uTime: { value: 0 },
          },
        ]),
      }),
    [colors],
  )
  const geometry = useMemo(() => new THREE.TubeGeometry(threadCurve, 900, 0.075, 6, false), [])

  useFrame((state) => {
    const u = curveParam(journey.smooth)
    // Light the thread up to the stage the visitor has reached.
    const reach = u < 1 / 7 ? 0.08 : THREE.MathUtils.lerp(0.08, 1, Math.min(1, (u - 1 / 7) / (5 / 7)))
    material.uniforms.uProgress.value = reach
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return <mesh geometry={geometry} material={material} userData={{ noShadow: true }} />
}

/** Stage markers — survey rings on the ground at each zone. */
function ZoneRings({ colors }: { colors: string[] }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    ref.current?.children.forEach((child, i) => {
      const pulse = child.children[1] as THREE.Mesh
      const s = 1 + ((state.clock.elapsedTime * 0.15 + i * 0.2) % 1) * 0.25
      pulse.scale.setScalar(s)
      ;(pulse.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - (s - 1) / 0.25)
    })
  })
  return (
    <group ref={ref}>
      {ZONE_LIST.map((z, i) => (
        <group key={z} position={[0, 0.03, z]} rotation-x={-Math.PI / 2}>
          <mesh>
            <ringGeometry args={[19, 19.12, 160]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={0.55} depthWrite={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[19, 19.06, 160]} />
            <meshBasicMaterial color={colors[i]} transparent opacity={0.3} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ------------------------------------------------------- FLOW ALONG THREAD */

/**
 * Units flowing down the chain: grain → egg → chick → bird → pack.
 * Their colour and scale change with the stage they are passing through.
 */
function Flow({ colors, density }: { colors: string[]; density: number }) {
  const count = Math.round(220 * Math.max(density, 0.4))
  const ref = useRef<THREE.InstancedMesh>(null)
  const seeds = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: count }, () => ({ o: r(), a: r() * Math.PI * 2, d: 0.25 + r() * 0.45 }))
  }, [count])
  const palette = useMemo(() => colors.map((c) => new THREE.Color(c)), [colors])
  const p = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const time = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const s = seeds[i]
      const t = (s.o + time * 0.006) % 1
      threadPoint(t, p)
      let stage = 0
      while (stage < 4 && t > (zoneStops[stage] + zoneStops[stage + 1]) / 2) stage++
      const scale = [0.05, 0.07, 0.08, 0.09, 0.09][stage]
      tmpObject.position.set(p.x + Math.cos(s.a + time * 0.4) * s.d, p.y + 0.25 + Math.sin(time * 1.3 + s.a) * 0.08, p.z + Math.sin(s.a) * s.d)
      tmpObject.scale.set(scale, stage === 1 ? scale * 1.3 : scale, stage === 4 ? scale * 0.8 : scale)
      tmpObject.rotation.set(0, s.a, 0)
      tmpObject.updateMatrix()
      mesh.setMatrixAt(i, tmpObject.matrix)
      mesh.setColorAt(i, tmpColor.copy(palette[stage]).multiplyScalar(2.4))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false} userData={{ noShadow: true }}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------- ATMOSPHERE */

const dustVertex = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y += mod(uTime * (0.15 + aSeed * 0.35) + aSeed * 30.0, 30.0);
    p.x += sin(uTime * 0.2 + aSeed * 12.0) * 1.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.2 + aSeed * 2.4) * uPixelRatio * (40.0 / -mv.z);
    vAlpha = smoothstep(160.0, 10.0, -mv.z) * (0.25 + aSeed * 0.5);
  }
`
const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, uAlpha * vAlpha * smoothstep(0.5, 0.0, d));
  }
`

function Dust({ count }: { count: number }) {
  const { gl } = useThree()
  const geometry = useMemo(() => {
    const r = rng(3)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (r() - 0.5) * 140
      positions[i * 3 + 1] = r() * 4 - 4
      positions[i * 3 + 2] = 30 - r() * 300
      seeds[i] = r()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: gl.getPixelRatio() },
          uColor: { value: new THREE.Color('#e9d6a6') },
          uAlpha: { value: 1 },
        },
      }),
    [gl],
  )
  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uAlpha.value = THREE.MathUtils.damp(material.uniforms.uAlpha.value, journey.theme === 'light' ? 0.12 : 0.7, 2, 0.016)
  })
  return <points geometry={geometry} material={material} frustumCulled={false} />
}

/* ------------------------------------------------------------------ WORLD */

export function World({ colors, density, particles, shadowSize, envSize }: WorldProps) {
  return (
    <>
      <CameraRig />
      <Atmosphere shadowSize={shadowSize} envSize={envSize} />

      <Ground />
      <Horizon density={density} />
      <Thread colors={colors} />
      <ZoneRings colors={colors} />
      <Flow colors={colors} density={density} />
      {particles > 0 && <Dust count={particles} />}

      <Nutrition color={colors[0]} density={density} />
      <Hatchery color={colors[1]} density={density} />
      <Farming color={colors[2]} density={density} />
      <Transformation color={colors[3]} density={density} />
      <Food color={colors[4]} density={density} />
    </>
  )
}
