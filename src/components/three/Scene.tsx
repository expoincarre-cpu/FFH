'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { tierSettings, type WebGLTier } from '@/lib/capabilities'
import { World } from './World'
import { Effects } from './Effects'
import { STATIONS } from './shared'
import { journey } from './state'
import { textureDetail } from './textures'

type Props = {
  tier: WebGLTier | 'baked'
  colors: string[]
  running: boolean
  onFail: () => void
}

const capture = typeof window !== 'undefined' && /[?&]capture/.test(window.location.search)

/**
 * Watches the frame rate and degrades gracefully, cheapest sacrifice first:
 *   1. post-processing (depth of field + half-res AO → AO and bloom off → composer off),
 *   2. then the pixel ratio, in steps down to 0.75,
 *   3. then hands over to the fallback (pre-rendered journey, then the 2.5D illustration).
 */
function PerformanceGuard({ onFail, postLevels }: { onFail: () => void; postLevels: number }) {
  const { setDpr, gl } = useThree()
  const acc = useRef({ time: 0, frames: 0, warmup: 2, strikes: 0 })
  useFrame((_, dt) => {
    journey.frames++
    // Ignore hitches (tab switches, shader compilation) and the first seconds after start-up.
    if (dt > 0.25) return
    const a = acc.current
    a.time += dt
    a.frames++
    if (a.frames < 75) return
    const avg = a.time / a.frames
    a.time = a.frames = 0
    if (a.warmup > 0) {
      a.warmup--
      return
    }
    if (avg <= 1 / 42) {
      a.strikes = Math.max(0, a.strikes - 1)
      return
    }
    a.strikes++
    if (a.strikes < 2) return
    a.strikes = 0
    a.warmup = 1
    const dpr = gl.getPixelRatio()
    if (journey.degrade < postLevels) journey.degrade++
    else if (dpr > 0.75) setDpr(Math.max(0.75, dpr - 0.25))
    else onFail()
  })
  return null
}

/** Deterministic rendering for offline capture (?capture): one frame per call, at a given progress and time. */
function CaptureDriver() {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    journey.snap = true
    journey.render = (progress, time) => {
      journey.progress = journey.smooth = progress
      advance(time)
      journey.frames++
    }
    return () => {
      journey.render = null
      journey.snap = false
    }
  }, [advance])
  return null
}

function usePixelRatio(max: number, budget: number) {
  const compute = () => {
    const px = window.innerWidth * window.innerHeight
    return Math.max(0.75, Math.min(max, window.devicePixelRatio || 1, Math.sqrt(budget / px)))
  }
  const [dpr, set] = useState(compute)
  useEffect(() => {
    const on = () => set(compute())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [max, budget])
  return dpr
}

export default function Scene({ tier, colors, running, onFail }: Props) {
  const settings = tierSettings[tier]
  const canvas = useRef<HTMLCanvasElement>(null)
  const dpr = usePixelRatio(settings.dpr[1], settings.pixels)
  // Texture detail must be set before any material is created.
  useMemo(() => {
    Object.assign(textureDetail, settings.textures)
    journey.degrade = 0
  }, [settings])

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const lost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    el.addEventListener('webglcontextlost', lost)
    return () => el.removeEventListener('webglcontextlost', lost)
  }, [onFail])

  return (
    <Canvas
      ref={canvas}
      className="journey__canvas"
      dpr={dpr}
      frameloop={capture ? 'never' : running ? 'always' : 'never'}
      shadows={settings.shadows > 0}
      gl={{
        // With the composer, anti-aliasing happens on its HDR buffers (MSAA / SMAA).
        antialias: !settings.post,
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        preserveDrawingBuffer: capture,
      }}
      camera={{ fov: 40, near: 1, far: 4000, position: STATIONS[0].pos }}
      aria-hidden="true"
    >
      <World colors={colors} density={settings.density} particles={settings.particles} shadowSize={settings.shadows} envSize={settings.env} />
      <Effects settings={settings.post} capture={capture} />
      {capture ? <CaptureDriver /> : <PerformanceGuard onFail={onFail} postLevels={settings.post ? 3 : 0} />}
    </Canvas>
  )
}
