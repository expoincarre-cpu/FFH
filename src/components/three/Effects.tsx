'use client'

import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BlendFunction,
  BloomEffect,
  DepthOfFieldEffect,
  Effect,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  SMAAEffect,
  SMAAPreset,
  VignetteEffect,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'
import type { PostSettings } from '@/lib/capabilities'
import { curveParam, journey, off } from './state'
import { STATIONS, STATION_LOOK } from './shared'

/**
 * Photographic post-processing, in one EffectComposer on half-float buffers:
 *
 *   scene (HDR, optional MSAA) → N8AO ambient occlusion → [depth of field]
 *   → bloom + exposure + AgX filmic tone mapping + day/dusk colour grade
 *   → SMAA + vignette + film grain → screen
 *
 * Tone mapping happens exactly once, inside the composer. The renderer's own
 * tone mapping only applies when the composer is switched off (degrade ≥ 3).
 * Bloom is "selective" by luminance: only HDR values above 1 — emissive
 * windows, LED strips, the thread, the scanner, the sun — bleed light.
 */

const gradeShader = /* glsl */ `
uniform float exposure;
uniform float contrast;
uniform float saturation;
uniform vec3 gain;
uniform vec3 lift;

vec3 gradeContrast( vec3 x ) {
  vec3 x2 = x * x;
  vec3 x4 = x2 * x2;
  return + 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232;
}

// AgX (same fit as three's AgXToneMapping).
vec3 gradeAgx( vec3 color ) {
  const mat3 toRec2020 = mat3( vec3( 0.6274, 0.0691, 0.0164 ), vec3( 0.3293, 0.9195, 0.0880 ), vec3( 0.0433, 0.0113, 0.8956 ) );
  const mat3 fromRec2020 = mat3( vec3( 1.6605, - 0.1246, - 0.0182 ), vec3( - 0.5876, 1.1329, - 0.1006 ), vec3( - 0.0728, - 0.0083, 1.1187 ) );
  const mat3 inset = mat3( vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ), vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ), vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 ) );
  const mat3 outset = mat3( vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ), vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ), vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 ) );
  color = inset * ( toRec2020 * color );
  color = clamp( ( log2( max( color, 1e-10 ) ) + 12.47393 ) / 16.5, 0.0, 1.0 );
  color = outset * gradeContrast( color );
  color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
  return clamp( fromRec2020 * color, 0.0, 1.0 );
}

void mainImage( const in vec4 inputColor, const in vec2 uv, out vec4 outputColor ) {
  vec3 c = gradeAgx( inputColor.rgb * exposure );
  // Grade in a perceptual encoding.
  vec3 g = pow( c, vec3( 1.0 / 2.2 ) );
  float l = dot( g, vec3( 0.2126, 0.7152, 0.0722 ) );
  g = mix( vec3( l ), g, saturation );
  g = ( g - 0.5 ) * contrast + 0.5;
  g = g * gain + lift * ( 1.0 - g );
  outputColor = vec4( pow( clamp( g, 0.0, 1.0 ), vec3( 2.2 ) ), inputColor.a );
}
`

class GradeEffect extends Effect {
  constructor() {
    super('GradeEffect', gradeShader, {
      blendFunction: BlendFunction.SRC,
      uniforms: new Map<string, THREE.Uniform>([
        ['exposure', new THREE.Uniform(1)],
        ['contrast', new THREE.Uniform(1)],
        ['saturation', new THREE.Uniform(1)],
        ['gain', new THREE.Uniform(new THREE.Vector3(1, 1, 1))],
        ['lift', new THREE.Uniform(new THREE.Vector3(0, 0, 0))],
      ]),
    })
  }
}

/** Day and dusk grades: AgX is neutral, so the "look" is added here. */
const GRADE = {
  day: { contrast: 1.2, saturation: 1.2, gain: [1.02, 1.0, 0.975], lift: [0.0, 0.004, 0.012], bloom: 0.3, vignette: 0.36, grain: 0.1 },
  dusk: { contrast: 1.14, saturation: 1.12, gain: [1.05, 0.99, 0.93], lift: [0.004, 0.014, 0.03], bloom: 0.55, vignette: 0.5, grain: 0.16 },
}

export function Effects({ settings, capture = false }: { settings: PostSettings | null; capture?: boolean }) {
  const { gl, scene, camera, size, viewport } = useThree()

  const fx = useMemo(() => {
    if (!settings) return null
    const composer = new EffectComposer(gl, { frameBufferType: THREE.HalfFloatType, multisampling: settings.msaa })
    composer.addPass(new RenderPass(scene, camera))

    const ao = settings.ao && !off.has('ao') ? new N8AOPostPass(scene, camera, 256, 256) : null
    if (ao) {
      const c = ao.configuration
      c.aoSamples = settings.ao === 'full' ? 16 : 8
      c.denoiseSamples = settings.ao === 'full' ? 8 : 4
      c.denoiseRadius = 12
      c.aoRadius = 3
      c.distanceFalloff = 1
      c.intensity = 2.6
      c.halfRes = settings.ao === 'half'
      c.depthAwareUpsampling = true
      c.color = new THREE.Color('#0b0806')
      composer.addPass(ao)
    }

    const dof = settings.dof ? new DepthOfFieldEffect(camera, { focusDistance: 40, focusRange: 40, bokehScale: 1.6, resolutionScale: 0.5 }) : null
    const dofPass = dof ? new EffectPass(camera, dof) : null
    if (dofPass) composer.addPass(dofPass)

    const grade = new GradeEffect()
    const bloom = settings.bloom && !off.has('bloom')
      ? new BloomEffect({ blendFunction: BlendFunction.ADD, luminanceThreshold: 1.0, luminanceSmoothing: 0.35, mipmapBlur: true, intensity: 0.5, radius: 0.74, levels: 7 })
      : null
    const gradePass = bloom ? new EffectPass(camera, bloom, grade) : new EffectPass(camera, grade)
    // Fallback grade without bloom, swapped in when the guard degrades quality.
    const gradeLite = bloom ? new EffectPass(camera, new GradeEffect()) : null
    composer.addPass(gradePass)
    if (gradeLite) {
      gradeLite.enabled = false
      composer.addPass(gradeLite)
    }

    const smaa = new SMAAEffect({ preset: settings.msaa ? SMAAPreset.MEDIUM : SMAAPreset.HIGH })
    const vignette = new VignetteEffect({ offset: 0.3, darkness: 0.4 })
    const noise = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false })
    composer.addPass(new EffectPass(camera, smaa, vignette, noise))

    return { composer, ao, dof, dofPass, bloom, gradePass, gradeLite, vignette, noise }
  }, [gl, scene, camera, settings])

  useEffect(() => () => fx?.composer.dispose(), [fx])
  useEffect(() => {
    fx?.composer.setSize(size.width, size.height, false)
  }, [fx, size, viewport.dpr])

  useEffect(() => {
    // Only used when rendering straight to the screen (no composer).
    gl.toneMapping = THREE.AgXToneMapping
  }, [gl])

  useFrame((_, dt) => {
    const level = journey.degrade
    if (!fx || level >= 3) {
      gl.render(scene, camera)
      return
    }
    const m = journey.mix
    const mixN = (a: number, b: number) => a + (b - a) * m
    const p = curveParam(journey.smooth) * (STATIONS.length - 1)
    const i = Math.min(Math.floor(p), STATIONS.length - 2)
    const k = p - i
    const A = STATION_LOOK[i]
    const B = STATION_LOOK[i + 1]

    if (fx.ao) {
      fx.ao.enabled = level < 2
      const c = fx.ao.configuration
      const radius = Math.round(THREE.MathUtils.lerp(A.ao, B.ao, k) * 10) / 10
      if (c.aoRadius !== radius) c.aoRadius = radius
      const half = settings!.ao === 'half' || level >= 1
      if (c.halfRes !== half) c.halfRes = half
    }
    if (fx.dof && fx.dofPass) {
      const strength = THREE.MathUtils.lerp(A.dof, B.dof, k)
      fx.dofPass.enabled = level < 1 && strength > 0.05
      fx.dof.cocMaterial.focusDistance = journey.focus
      fx.dof.cocMaterial.focusRange = journey.focus * 1.4
      fx.dof.bokehScale = 1.7 * strength
    }
    const liteBloom = level >= 2 && !!fx.gradeLite
    fx.gradePass.enabled = !liteBloom
    if (fx.gradeLite) fx.gradeLite.enabled = liteBloom
    if (fx.bloom) fx.bloom.intensity = mixN(GRADE.dusk.bloom, GRADE.day.bloom)

    const pass = liteBloom ? fx.gradeLite! : fx.gradePass
    const grade = (pass as unknown as { effects: Effect[] }).effects.find((e) => e instanceof GradeEffect)!
    const u = grade.uniforms
    u.get('exposure')!.value = journey.exposure
    u.get('contrast')!.value = mixN(GRADE.dusk.contrast, GRADE.day.contrast)
    u.get('saturation')!.value = mixN(GRADE.dusk.saturation, GRADE.day.saturation)
    ;(u.get('gain')!.value as THREE.Vector3).set(
      mixN(GRADE.dusk.gain[0], GRADE.day.gain[0]),
      mixN(GRADE.dusk.gain[1], GRADE.day.gain[1]),
      mixN(GRADE.dusk.gain[2], GRADE.day.gain[2]),
    )
    ;(u.get('lift')!.value as THREE.Vector3).set(
      mixN(GRADE.dusk.lift[0], GRADE.day.lift[0]),
      mixN(GRADE.dusk.lift[1], GRADE.day.lift[1]),
      mixN(GRADE.dusk.lift[2], GRADE.day.lift[2]),
    )
    fx.vignette.darkness = mixN(GRADE.dusk.vignette, GRADE.day.vignette)
    // Grain is left out of pre-rendered frames: it would cost most of the bitrate.
    fx.noise.blendMode.opacity.value = capture ? 0 : mixN(GRADE.dusk.grain, GRADE.day.grain)

    fx.composer.render(Math.min(dt, 0.1))
  }, 1)

  return null
}
