'use client'

import * as THREE from 'three'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Sky } from 'three/addons/objects/Sky.js'
import { curveParam, journey, off } from './state'
import { STATIONS, STATION_LOOK } from './shared'
import { installHeightFog, packSun } from './fog'

/**
 * Physically based atmosphere.
 *
 *  - Sky: three's analytic (Preetham) sky with procedural cloud cover. The sun
 *    moves between a high Moroccan daylight position and a low dusk position.
 *  - Image-based lighting: a PMREM environment is generated from that same sky
 *    (plus a ground bounce) and regenerated while the theme blends.
 *  - Sun: one shadow-casting directional light whose orthographic frustum is
 *    fitted to each camera station and snapped to shadow texels (no shimmer).
 *  - Haze: exponential height fog tinted from the sky's own horizon.
 */

type Look = {
  azimuth: number
  elevation: number
  sun: string
  sunIntensity: number
  turbidity: number
  rayleigh: number
  mie: number
  mieG: number
  clouds: number
  cloudDensity: number
  gain: number
  env: number
  ground: string
  exposure: number
  fog: number
  haze: string
}

const DAY: Look = {
  azimuth: 4.0,
  elevation: 0.8,
  sun: '#fff3df',
  sunIntensity: 6.2,
  turbidity: 3.2,
  rayleigh: 1.1,
  mie: 0.004,
  mieG: 0.82,
  clouds: 0.22,
  cloudDensity: 0.35,
  gain: 0.3,
  env: 0.62,
  ground: '#6f6248',
  exposure: 0.86,
  fog: 0.0011,
  haze: '#c9d6e2',
}

const DUSK: Look = {
  azimuth: 2.65,
  elevation: 0.085,
  sun: '#ff9a52',
  sunIntensity: 2.2,
  turbidity: 5.5,
  rayleigh: 2.4,
  mie: 0.006,
  mieG: 0.86,
  clouds: 0.42,
  cloudDensity: 0.5,
  gain: 0.3,
  env: 0.9,
  ground: '#1b1814',
  exposure: 1.9,
  fog: 0.0024,
  haze: '#6a5a5a',
}

function sunDirection(azimuth: number, elevation: number, out: THREE.Vector3) {
  return out.set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), -Math.sin(azimuth) * Math.cos(elevation)).normalize()
}

function makeSky() {
  const sky = new Sky()
  const m = sky.material
  m.uniforms.skyGain = { value: 1 }
  m.fragmentShader = m.fragmentShader
    .replace('uniform float showSunDisc;', 'uniform float showSunDisc;\nuniform float skyGain;')
    .replace('gl_FragColor = vec4( texColor, 1.0 );', 'gl_FragColor = vec4( texColor * skyGain, 1.0 );')
  m.fog = false
  sky.scale.setScalar(1800)
  sky.frustumCulled = false
  sky.renderOrder = -1
  sky.userData.noShadow = true
  return sky
}

export function Atmosphere({ shadowSize, envSize = 256 }: { shadowSize: number; envSize?: number }) {
  const { scene, camera, gl } = useThree()
  const sky = useMemo(makeSky, [])
  const sun = useRef<THREE.DirectionalLight>(null)
  const fog = useMemo(() => new THREE.Fog('#c9d6e2', 0.001, 0.8), [])
  const mix = useRef(journey.theme === 'light' ? 1 : 0)
  const tmp = useMemo(
    () => ({
      a: new THREE.Color(),
      b: new THREE.Color(),
      dir: new THREE.Vector3(),
      focus: new THREE.Vector3(),
      right: new THREE.Vector3(),
      up: new THREE.Vector3(),
      view: new THREE.Vector3(),
    }),
    [],
  )
  const glow = useRef<THREE.MeshStandardMaterial[]>([])
  const lamps = useRef<THREE.Light[]>([])

  // Environment: the sky (sun disc hidden) over a ground-bounce hemisphere.
  const env = useMemo(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envScene = new THREE.Scene()
    const dome = new THREE.Mesh(sky.geometry, sky.material)
    dome.scale.setScalar(60)
    const groundMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false })
    const ground = new THREE.Mesh(new THREE.SphereGeometry(20, 24, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), groundMat)
    envScene.add(dome, ground)
    const probe = new THREE.WebGLRenderTarget(4, 4, { type: THREE.FloatType, depthBuffer: false })
    const probeCam = new THREE.PerspectiveCamera(24, 1, 0.1, 200)
    const pixels = new Float32Array(4 * 4 * 4)
    return { pmrem, envScene, groundMat, probe, probeCam, pixels, target: null as THREE.WebGLRenderTarget | null, at: -1, haze: new THREE.Color(), frame: 0 }
  }, [gl, sky])

  useEffect(() => {
    installHeightFog()
    scene.fog = fog
    scene.background = null
    const mats: THREE.MeshStandardMaterial[] = []
    const lights: THREE.Light[] = []
    scene.traverse((o) => {
      const light = o as THREE.Light
      if (light.isLight && light.userData.night !== undefined) lights.push(light)
      const mesh = o as THREE.Mesh
      if (!mesh.isMesh) return
      const list = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[]
      const lit = list.some((m) => (m as THREE.MeshStandardMaterial).isMeshStandardMaterial)
      const solid = list.every((m) => !m.transparent)
      if (lit && !mesh.userData.noShadow) {
        if (mesh.userData.castShadow !== false) mesh.castShadow = solid
        mesh.receiveShadow = true
      }
      list.forEach((m) => {
        if (m.userData?.nightGlow !== undefined && !mats.includes(m as THREE.MeshStandardMaterial)) mats.push(m as THREE.MeshStandardMaterial)
      })
    })
    glow.current = mats
    lamps.current = lights
    if (sun.current) scene.add(sun.current.target)
    return () => {
      scene.fog = null
      scene.environment = null
    }
  }, [scene, fog])

  useEffect(
    () => () => {
      env.target?.dispose()
      env.pmrem.dispose()
      env.probe.dispose()
    },
    [env],
  )

  useFrame((state, dt) => {
    const target = journey.theme === 'light' ? 1 : 0
    mix.current = journey.snap ? target : THREE.MathUtils.damp(mix.current, target, 2.2, Math.min(dt, 0.1))
    if (Math.abs(mix.current - target) < 0.002) mix.current = target
    const m = mix.current
    journey.mix = m
    const lerpC = (a: string, b: string) => tmp.a.set(a).lerp(tmp.b.set(b), m)
    const lerpN = (a: number, b: number) => a + (b - a) * m

    // Sky.
    const u = sky.material.uniforms
    const elevation = lerpN(DUSK.elevation, DAY.elevation)
    const azimuth = lerpN(DUSK.azimuth, DAY.azimuth)
    sunDirection(azimuth, elevation, tmp.dir)
    u.sunPosition.value.copy(tmp.dir)
    u.turbidity.value = lerpN(DUSK.turbidity, DAY.turbidity)
    u.rayleigh.value = lerpN(DUSK.rayleigh, DAY.rayleigh)
    u.mieCoefficient.value = lerpN(DUSK.mie, DAY.mie)
    u.mieDirectionalG.value = lerpN(DUSK.mieG, DAY.mieG)
    u.cloudCoverage.value = lerpN(DUSK.clouds, DAY.clouds)
    u.cloudDensity.value = lerpN(DUSK.cloudDensity, DAY.cloudDensity)
    u.skyGain.value = lerpN(DUSK.gain, DAY.gain)
    u.time.value = 40 + state.clock.elapsedTime
    sky.position.copy(camera.position)

    // Environment lighting follows the sky; regenerated (throttled) while the theme blends.
    env.frame++
    if (env.at < 0 || (Math.abs(env.at - m) > 0.004 && (env.frame % 5 === 0 || m === target))) {
      env.groundMat.color.copy(lerpC(DUSK.ground, DAY.ground))
      u.showSunDisc.value = 0
      const next = env.pmrem.fromScene(env.envScene, 0, 0.1, 200, { size: envSize })
      // Haze colour: sample the horizon, side-on to the sun.
      env.haze.copy(lerpC(DUSK.haze, DAY.haze))
      try {
        const side = azimuth + Math.PI * 0.6
        env.probeCam.lookAt(Math.cos(side), 0.05, -Math.sin(side))
        const old = gl.getRenderTarget()
        gl.setRenderTarget(env.probe)
        gl.render(env.envScene, env.probeCam)
        gl.readRenderTargetPixels(env.probe, 0, 0, 4, 4, env.pixels)
        gl.setRenderTarget(old)
        let r = 0
        let g = 0
        let b = 0
        for (let i = 0; i < 16; i++) {
          r += env.pixels[i * 4]
          g += env.pixels[i * 4 + 1]
          b += env.pixels[i * 4 + 2]
        }
        if (Number.isFinite(r + g + b) && r + g + b > 0) {
          env.haze.setRGB(r / 16, g / 16, b / 16)
          // Keep the haze from out-shining the sunlit scene it veils.
          const peak = Math.max(env.haze.r, env.haze.g, env.haze.b)
          if (peak > 0.95) env.haze.multiplyScalar(0.95 / peak)
        }
      } catch {
        /* float read-back unsupported: keep the preset haze colour */
      }
      u.showSunDisc.value = 1
      env.target?.dispose()
      env.target = next
      env.at = m
      scene.environment = next.texture
    }
    scene.environmentIntensity = off.has('env') ? 0 : lerpN(DUSK.env, DAY.env)

    // Per-station look.
    const p = curveParam(journey.smooth) * (STATIONS.length - 1)
    const i = Math.min(Math.floor(p), STATIONS.length - 2)
    const k = p - i
    const A = STATION_LOOK[i]
    const B = STATION_LOOK[i + 1]

    fog.color.copy(env.haze)
    fog.near = lerpN(DUSK.fog, DAY.fog) * THREE.MathUtils.lerp(A.fog, B.fog, k)
    fog.far = packSun(azimuth, elevation)
    if (off.has('fog')) fog.near = 0

    // Sun: frustum fitted to the station, centred on what the camera looks at, snapped to texels.
    const light = sun.current
    if (light) {
      const extent = THREE.MathUtils.lerp(A.shadow, B.shadow, k)
      camera.getWorldDirection(tmp.view)
      const hit = tmp.view.y < -0.02 ? -camera.position.y / tmp.view.y : Infinity
      const reach = Math.min(hit, extent * (hit < extent * 2.2 ? 2.2 : 0.75))
      tmp.focus.copy(camera.position).addScaledVector(tmp.view, reach)
      tmp.focus.y = 0
      tmp.right.set(0, 1, 0).cross(tmp.dir).normalize()
      tmp.up.copy(tmp.dir).cross(tmp.right).normalize()
      const size = light.shadow.mapSize.x
      const texel = (extent * 2) / size
      const cx = tmp.focus.dot(tmp.right)
      const cy = tmp.focus.dot(tmp.up)
      tmp.focus.addScaledVector(tmp.right, Math.round(cx / texel) * texel - cx).addScaledVector(tmp.up, Math.round(cy / texel) * texel - cy)
      light.position.copy(tmp.focus).addScaledVector(tmp.dir, 330)
      light.target.position.copy(tmp.focus)
      light.color.copy(lerpC(DUSK.sun, DAY.sun))
      light.intensity = lerpN(DUSK.sunIntensity, DAY.sunIntensity)
      const cam = light.shadow.camera
      if (Math.abs(cam.right - extent) > 0.01) {
        cam.left = cam.bottom = -extent
        cam.right = cam.top = extent
        cam.updateProjectionMatrix()
      }
      light.shadow.normalBias = texel * 3
      light.shadow.radius = THREE.MathUtils.clamp(0.09 / texel, 1.2, 4)
    }

    journey.exposure = lerpN(DUSK.exposure * THREE.MathUtils.lerp(A.dusk, B.dusk, k), DAY.exposure)
    gl.toneMappingExposure = journey.exposure

    // Artificial lighting: windows, lamps and signs come on as daylight fades.
    const night = THREE.MathUtils.smoothstep(1 - m, 0.25, 0.9)
    glow.current.forEach((mat) => {
      const base = mat.userData.nightGlow as number
      const day = (mat.userData.dayGlow as number | undefined) ?? 0
      mat.emissiveIntensity = day + (base - day) * night
    })
    lamps.current.forEach((l) => {
      const base = l.userData.night as number
      const day = (l.userData.day as number | undefined) ?? 0
      l.intensity = day + (base - day) * night
    })
  })

  return (
    <>
      <primitive object={sky} />
      <directionalLight
        ref={sun}
        castShadow={shadowSize > 0}
        shadow-mapSize-width={shadowSize || 512}
        shadow-mapSize-height={shadowSize || 512}
        shadow-camera-near={40}
        shadow-camera-far={700}
        shadow-bias={-0.0006}
      />
    </>
  )
}
